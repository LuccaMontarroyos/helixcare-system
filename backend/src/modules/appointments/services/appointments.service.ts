import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { CreationAttributes, Op } from 'sequelize';
import { Appointment } from '../entities/appointment.entity';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { UpdateAppointmentDto } from '../dto/update-appointment.dto';
import { AppointmentStatusEnum } from '../enums/appointment-status.enum';

import { PatientsService } from '../../patients/services/patients.service';
import { UsersService } from '../../users/services/users.service';
import { RoleEnum } from '../../roles/enums/roles.enum';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment)
    private appointmentModel: typeof Appointment,
    private sequelize: Sequelize,
    private patientsService: PatientsService,
    private usersService: UsersService,
  ) {}

  private async checkDoubleBooking(doctorId: string, date: Date, excludeAppointmentId?: string): Promise<void> {
    const whereClause: any = {
      doctor_id: doctorId,
      appointment_date: date,
      status: { [Op.in]: [AppointmentStatusEnum.SCHEDULED, AppointmentStatusEnum.CONFIRMED] },
    };

    if (excludeAppointmentId) {
      whereClause.id = { [Op.ne]: excludeAppointmentId };
    }

    const conflict = await this.appointmentModel.findOne({ where: whereClause });

    if (conflict) {
      throw new ConflictException('O médico selecionado já possui um paciente agendado para este horário.');
    }
  }

  async create(dto: CreateAppointmentDto): Promise<Appointment> {
    await this.patientsService.findOne(dto.patient_id);

    const doctor = await this.usersService.findOne(dto.doctor_id);
    if (doctor.role.name !== RoleEnum.DOCTOR) {
      throw new BadRequestException('O usuário selecionado não possui o cargo de Médico.');
    }

    await this.checkDoubleBooking(dto.doctor_id, dto.appointment_date);

    const transaction = await this.sequelize.transaction();
    try {
      const appointment = await this.appointmentModel.create(
        dto as CreationAttributes<Appointment>,
        { transaction }
      );
      await transaction.commit();
      return appointment;
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
    if (filters.status) whereClause.status = filters.status;
    if (filters.date) {
      const [year, month, day] = filters.date.split('-').map(Number);
      const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);      
      const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);
      
      whereClause.appointment_date = { [Op.between]: [startOfDay, endOfDay] };
    }

    const { rows, count } = await this.appointmentModel.findAndCountAll({
      where: whereClause,
      include: ['patient', 'doctor'],
      order: [['appointment_date', 'ASC']],
      limit,
      offset,
    });

    return { data: rows, total: count, current_page: page, total_pages: Math.ceil(count / limit) };
  }

  async findOne(id: string): Promise<Appointment> {
    const appointment = await this.appointmentModel.findByPk(id, {
      include: ['patient', 'doctor']
    });
    if (!appointment) throw new NotFoundException('Agendamento não encontrado.');
    return appointment;
  }

  async update(id: string, dto: UpdateAppointmentDto): Promise<Appointment> {
    const appointment = await this.findOne(id);

    const newDoctorId = dto.doctor_id || appointment.doctor_id;
    const newDate = dto.appointment_date || appointment.appointment_date;
    
    if (dto.appointment_date || dto.doctor_id) {
      await this.checkDoubleBooking(newDoctorId, newDate, id);
    }

    const transaction = await this.sequelize.transaction();
    try {
      const updatedAppointment = await appointment.update(
        dto as Partial<CreationAttributes<Appointment>>,
        { transaction }
      );
      await transaction.commit();
      return updatedAppointment;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const appointment = await this.findOne(id);
    
    if (appointment.status === AppointmentStatusEnum.COMPLETED) {
      throw new BadRequestException('Consultas já realizadas não podem ser removidas do histórico.');
    }

    await appointment.destroy();
  }
}