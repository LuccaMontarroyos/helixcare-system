import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { CreationAttributes, Op } from 'sequelize';
import { Exam } from '../entities/exam.entity';
import { CreateExamDto } from '../dto/create-exam.dto';
import { UpdateExamResultDto } from '../dto/update-exam-result.dto';
import { ExamStatusEnum } from '../enums/exam-status.enum';

import { PatientsService } from '../../patients/services/patients.service';
import { UsersService } from '../../users/services/users.service';
import { RoleEnum } from '../../roles/enums/roles.enum';
import { User } from '../../users/entities/user.entity';
import { CloudService } from 'src/core/cloud/cloud.service';

@Injectable()
export class ExamsService {
  constructor(
    @InjectModel(Exam)
    private examModel: typeof Exam,
    private sequelize: Sequelize,
    private patientsService: PatientsService,
    private usersService: UsersService,
    private cloudService: CloudService,
  ) {}

  async create(doctorId: string, dto: CreateExamDto): Promise<Exam> {
    await this.patientsService.findOne(dto.patient_id);

    const transaction = await this.sequelize.transaction();
    try {
      const examData = {
        ...dto,
        doctor_id: doctorId,
        status: ExamStatusEnum.REQUESTED,
      };

      const exam = await this.examModel.create(
        examData as CreationAttributes<Exam>,
        { transaction }
      );
      
      await transaction.commit();
      return exam;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findAll(page: number = 1, limit: number = 10, filters: any = {}) {
    const offset = (page - 1) * limit;
    const whereClause: any = {};

    if (filters.patient_id) whereClause.patient_id = filters.patient_id;
    if (filters.doctor_id) whereClause.doctor_id = filters.doctor_id;
    if (filters.lab_technician_id) whereClause.lab_technician_id = filters.lab_technician_id;
    if (filters.status) whereClause.status = filters.status;
    
    if (filters.exam_type) {
      whereClause.exam_type = { [Op.iLike]: `%${filters.exam_type}%` };
    }

    const { rows, count } = await this.examModel.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, as: 'doctor', attributes: ['id', 'name'] },
        { model: User, as: 'lab_technician', attributes: ['id', 'name'] }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    return { data: rows, total: count, current_page: page, total_pages: Math.ceil(count / limit) };
  }

  async findOne(id: string): Promise<Exam> {
    const exam = await this.examModel.findByPk(id, {
      include: [
        { model: User, as: 'doctor', attributes: ['id', 'name'] },
        { model: User, as: 'lab_technician', attributes: ['id', 'name'] }
      ]
    });
    
    if (!exam) throw new NotFoundException('Exame não encontrado.');
    return exam;
  }

  async updateResult(id: string, technicianId: string, dto: UpdateExamResultDto): Promise<Exam> {
    const exam = await this.findOne(id);

    if (exam.status === ExamStatusEnum.CANCELED) {
      throw new BadRequestException('Não é possível inserir resultados em um exame cancelado.');
    }

    if (exam.status === ExamStatusEnum.COMPLETED && exam.lab_technician_id !== technicianId) {
      throw new ForbiddenException('Apenas o técnico que finalizou o laudo original pode alterá-lo.');
    }

    const transaction = await this.sequelize.transaction();
    try {
      const updatedExam = await exam.update(
        {
          status: dto.status,
          result_text: dto.result_text !== undefined ? dto.result_text : exam.result_text,
          lab_technician_id: technicianId,
        } as Partial<CreationAttributes<Exam>>,
        { transaction }
      );
      
      await transaction.commit();
      return updatedExam;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const exam = await this.findOne(id);
    
    if (exam.status === ExamStatusEnum.COMPLETED || exam.status === ExamStatusEnum.IN_PROGRESS) {
      throw new BadRequestException('Exames em andamento ou finalizados não podem ser excluídos. Utilize o status CANCELED se necessário.');
    }

    await exam.destroy();
  }

  async uploadResultFile(id: string, technicianId: string, file: Express.Multer.File): Promise<Exam> {
    const exam = await this.findOne(id);

    if (exam.status === ExamStatusEnum.REQUESTED || exam.status === ExamStatusEnum.CANCELED) {
      throw new BadRequestException('Você só pode anexar arquivos em exames em andamento ou finalizados.');
    }
    if (exam.lab_technician_id !== technicianId) {
      throw new ForbiddenException('Apenas o técnico responsável pode anexar o arquivo de laudo.');
    }

    const fileUrl = await this.cloudService.uploadFile(file);

    const transaction = await this.sequelize.transaction();
    try {
      const updatedExam = await exam.update(
        { result_file_url: fileUrl },
        { transaction }
      );
      await transaction.commit();
      return updatedExam;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}