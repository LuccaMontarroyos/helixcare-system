import { Controller, Post, Get, Put, Patch, Delete, Body, Param, Query, UseGuards, UsePipes, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { AppointmentsService } from '../services/appointments.service';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { UpdateAppointmentDto } from '../dto/update-appointment.dto';
import { createAppointmentSchema } from '../schemas/create-appointment.schema';
import { updateAppointmentSchema } from '../schemas/update-appointment.schema';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/guards/roles.guard';
import { Roles } from '../../../core/decorators/roles.decorator';
import { RoleEnum } from '../../roles/enums/roles.enum';
import { YupValidationPipe } from '../../../core/pipes/yup-validation.pipe';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import type { ICurrentUser } from 'src/modules/auth/interfaces/current-user.interface';

@ApiTags('Appointments (Agenda)')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) { }

  @Post()
  @ApiOperation({ summary: 'Cria um novo agendamento de consulta' })
  @ApiResponse({ status: 201, description: 'Agendamento criado com sucesso.' })
  @ApiResponse({ status: 409, description: 'Conflito de horário (Double Booking).' })
  @Roles(RoleEnum.ADMIN, RoleEnum.RECEPTIONIST, RoleEnum.DOCTOR)
  @UsePipes()
  async create(@Body(new YupValidationPipe(createAppointmentSchema)) createAppointmentDto: CreateAppointmentDto, @CurrentUser() currentUser: ICurrentUser) {
    return await this.appointmentsService.create(createAppointmentDto, currentUser);
  }

  @Get()
  @ApiOperation({ summary: 'Lista os agendamentos com filtros dinâmicos' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'patient_id', required: false, type: String })
  @ApiQuery({ name: 'doctor_id', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELED'] })
  @ApiQuery({ name: 'date', required: false, type: String, description: 'Filtra por um dia exato (YYYY-MM-DD)' })
  @ApiQuery({ name: 'start_date', required: false, type: String, description: 'Filtra por um intervalo de datas (YYYY-MM-DD)' })
  @ApiQuery({ name: 'end_date', required: false, type: String, description: 'Filtra por um intervalo de datas (YYYY-MM-DD)' })
  @Roles(RoleEnum.ADMIN, RoleEnum.RECEPTIONIST, RoleEnum.DOCTOR, RoleEnum.NURSE)
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('patient_id') patientId?: string,
    @Query('doctor_id') doctorId?: string,
    @Query('status') status?: string,
    @Query('date') date?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const filters = { patient_id: patientId, doctor_id: doctorId, status, date, start_date: startDate, end_date: endDate };
    return await this.appointmentsService.findAll(page || 1, limit || 10, filters);
  }

  @Get('week-counts')
  @ApiOperation({ summary: 'Retorna contagem de consultas por dia para uma semana' })
  @ApiQuery({ name: 'start_date', required: true, type: String, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'end_date', required: true, type: String, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'doctor_id', required: false, type: String })
  @Roles(RoleEnum.ADMIN, RoleEnum.RECEPTIONIST, RoleEnum.DOCTOR, RoleEnum.NURSE)
  async getWeekCounts(
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Query('doctor_id') doctorId?: string,
    @Query('patient_id') patientId?: string,
    @Query('status') status?: string,
  ) {
    return await this.appointmentsService.findAll_weekCounts(
      startDate,
      endDate,
      { doctor_id: doctorId, patient_id: patientId, status },
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retorna uma consulta por id' })
  @Roles(RoleEnum.ADMIN, RoleEnum.RECEPTIONIST, RoleEnum.DOCTOR, RoleEnum.LAB_TECHNICIAN, RoleEnum.NURSE)
  async findOne(@Param('id') id: string) {
    return await this.appointmentsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza um agendamento (Ex: remanejar data ou alterar status)' })
  @Roles(RoleEnum.ADMIN, RoleEnum.RECEPTIONIST, RoleEnum.DOCTOR)
  @UsePipes()
  async update(
    @Param('id') id: string,
    @Body(new YupValidationPipe(updateAppointmentSchema)) updateAppointmentDto: UpdateAppointmentDto,
  ) {
    return await this.appointmentsService.update(id, updateAppointmentDto);
  }

  @Post(':id/reschedule')
  @ApiOperation({ summary: 'Remarca uma consulta — cria nova e marca a atual como RESCHEDULED' })
  @ApiBody({ schema: { properties: { appointment_date: { type: 'string', format: 'date-time' } } } })
  @Roles(RoleEnum.ADMIN, RoleEnum.RECEPTIONIST, RoleEnum.DOCTOR)
  async reschedule(
    @Param('id') id: string,
    @Body('appointment_date') newDate: string,
  ) {
    return await this.appointmentsService.reschedule(
      id,
      new Date(newDate),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancela/Remove um agendamento (Soft Delete)' })
  @Roles(RoleEnum.ADMIN, RoleEnum.RECEPTIONIST)
  async remove(@Param('id') id: string) {
    await this.appointmentsService.remove(id);
    return { message: 'Agendamento removido com sucesso.' };
  }
}