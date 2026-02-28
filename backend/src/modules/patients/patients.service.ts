import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { CreationAttributes } from 'sequelize';
import { Patient } from './entities/patient.entity';
import { CreatePatientDto } from './dto/create-patient.dto';

@Injectable()
export class PatientsService {
  constructor(
    @InjectModel(Patient)
    private patientModel: typeof Patient,
    private sequelize: Sequelize,
  ) {}

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

  async findAll(): Promise<Patient[]> {
    return await this.patientModel.findAll({
      order: [['created_at', 'DESC']],
    });
  }

  async findOne(id: string): Promise<Patient> {
    const patient = await this.patientModel.findByPk(id);
    if (!patient) {
      throw new NotFoundException('Paciente não encontrado.');
    }
    return patient;
  }
}