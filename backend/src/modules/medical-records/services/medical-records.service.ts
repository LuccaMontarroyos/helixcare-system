import { ForbiddenException, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { CreationAttributes, Op } from 'sequelize';
import { MedicalRecord } from '../entities/medical-record.entity';
import { CreateMedicalRecordDto } from '../dto/create-medical-record.dto';
import { PatientsService } from '../../patients/services/patients.service';
import { User } from '../../users/entities/user.entity';
import { RoleEnum } from '../../roles/enums/roles.enum';
import { UpdateMedicalRecordDto } from '../dto/update-medical-record.dto';
import { RedisLockService } from '../../../core/redis/redis-lock.service';
import { MedicalRecordHistory } from '../entities/medical-record.history.entity';

@Injectable()
export class MedicalRecordsService {
  constructor(
    @InjectModel(MedicalRecord)
    private medicalRecordModel: typeof MedicalRecord,
    @InjectModel(MedicalRecordHistory)
    private historyModel: typeof MedicalRecordHistory,
    private sequelize: Sequelize,
    private patientsService: PatientsService, 
    private redisLockService: RedisLockService,

  ) {}

  async create(doctorId: string, dto: CreateMedicalRecordDto): Promise<MedicalRecord> {
    await this.patientsService.findOne(dto.patient_id);

    const transaction = await this.sequelize.transaction();

    try {
      const recordData = {
        ...dto,
        doctor_id: doctorId,
      };

      const record = await this.medicalRecordModel.create(
        recordData as CreationAttributes<MedicalRecord>, 
        { transaction }
      );
      
      await transaction.commit();
      return record;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findAllByPatient(patientId: string, page: number = 1, limit: number = 10, filters: { doctor_id?: string; start_date?: string; end_date?: string; diagnosis?: string } = {}) {
    const offset = (page - 1) * limit;

    const whereClause: any = { patient_id: patientId };

    if (filters.doctor_id) {
        whereClause.doctor_id = filters.doctor_id;
    }

    if (filters.start_date && filters.end_date) {
        whereClause.created_at = {
          [Op.between]: [new Date(filters.start_date), new Date(filters.end_date)],
        };
      } else if (filters.start_date) {
        whereClause.created_at = { [Op.gte]: new Date(filters.start_date) };
      } else if (filters.end_date) {
        whereClause.created_at = { [Op.lte]: new Date(filters.end_date) };
      }

      if (filters.diagnosis) {
        whereClause.diagnosis = {
          [Op.iLike]: `%${filters.diagnosis}%`,
        };
      }

    const { rows, count } = await this.medicalRecordModel.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, attributes: ['id', 'name'] }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    return {
      data: rows,
      total: count,
      current_page: Number(page),
      total_pages: Math.ceil(count / limit),
    };
  }

  async findOne(id: string): Promise<MedicalRecord> {
    const record = await this.medicalRecordModel.findByPk(id, {
      include: [{ model: User, attributes: ['id', 'name'] }]
    });
    if (!record) {
      throw new NotFoundException('Prontuário não encontrado.');
    }
    return record;
  }

  async update(id: string, userId: string, userRole: string, dto: UpdateMedicalRecordDto): Promise<MedicalRecord> {
    const record = await this.findOne(id);

    if (record.doctor_id !== userId && userRole !== RoleEnum.ADMIN) {
      throw new ForbiddenException('Você não tem permissão para editar um prontuário criado por outro profissional.');
    }

    const currentLockOwner = await this.redisLockService.getLockOwner(id);
    if (currentLockOwner && currentLockOwner !== userId) {
      throw new ConflictException('Este prontuário está sendo editado por outro profissional neste exato momento. Atualização rejeitada para evitar perda de dados.');
    }

    const transaction = await this.sequelize.transaction();
    try {
        await this.historyModel.create(
            {
              medical_record_id: record.id,
              editor_id: userId,
              old_anamnesis: record.anamnesis,
              old_diagnosis: record.diagnosis,
              old_prescription: record.prescription,
              old_social_history: record.social_history,
            } as CreationAttributes<MedicalRecordHistory>, 
            { transaction }
          );

      const updatedRecord = await record.update(
        dto as Partial<CreationAttributes<MedicalRecord>>, 
        { transaction }
      );
      await transaction.commit();

      await this.redisLockService.releaseLock(id, userId);
      return updatedRecord;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async remove(id: string, userId: string, userRole: string): Promise<void> {
    const record = await this.findOne(id);

    if (record.doctor_id !== userId && userRole !== RoleEnum.ADMIN) {
      throw new ForbiddenException('Você não tem permissão para excluir este prontuário.');
    }

    await record.destroy();
  }
}