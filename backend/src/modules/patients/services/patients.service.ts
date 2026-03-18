import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { CreationAttributes, Op } from 'sequelize';
import { Patient } from '../entities/patient.entity';
import { CreatePatientDto } from '../dto/create-patient.dto';
import { UpdatePatientDto } from '../dto/update-patient.dto';
import { CloudService } from 'src/core/cloud/cloud.service';

@Injectable()
export class PatientsService {
  constructor(
    @InjectModel(Patient)
    private patientModel: typeof Patient,
    private sequelize: Sequelize,
    private cloudService: CloudService,
  ) { }

  async create(dto: CreatePatientDto): Promise<Patient> {
    const patientExists = await this.patientModel.findOne({ where: { cpf: dto.cpf } });
    if (patientExists) {
      throw new BadRequestException('Já existe um paciente cadastrado com este CPF.');
    }

    const transaction = await this.sequelize.transaction();

    try {
      const patient = await this.patientModel.create(dto as CreationAttributes<Patient>, { transaction });

      await transaction.commit();
      return patient;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async update(id: string, dto: UpdatePatientDto): Promise<Patient> {

    const patient = await this.findOne(id);

    if (dto.cpf && dto.cpf !== patient.cpf) {
      const cpfExists = await this.patientModel.findOne({ where: { cpf: dto.cpf } });
      if (cpfExists) {
        throw new BadRequestException('Este CPF já está vinculado a outro paciente.');
      }
    }

    const transaction = await this.sequelize.transaction();

    try {
      const updatedPatient = await patient.update(
        dto as Partial<CreationAttributes<Patient>>,
        { transaction }
      );

      await transaction.commit();
      return updatedPatient;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findAll(search?: string): Promise<Patient[]> {

    const whereClause: any = {};

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { cpf: { [Op.iLike]: `%${search}%` } },
      ];
    }

    return await this.patientModel.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: search ? 20 : undefined,
    });
  }

  async findOne(id: string): Promise<Patient> {
    const patient = await this.patientModel.findByPk(id);
    if (!patient) {
      throw new NotFoundException('Paciente não encontrado.');
    }
    return patient;
  }

  async remove(id: string): Promise<void> {
    const patient = await this.findOne(id);

    await patient.destroy();
  }

  async uploadAvatar(id: string, file: Express.Multer.File): Promise<Patient> {
    const patient = await this.findOne(id);

    const fileUrl = await this.cloudService.uploadFile(file);

    return await patient.update({ avatar_url: fileUrl });
  }
}