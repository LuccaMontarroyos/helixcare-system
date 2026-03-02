import { Controller, Post, Get, Put, Delete, Body, Param, Query, UseGuards, UsePipes, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
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

@ApiTags('Appointments (Agenda)')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo agendamento de consulta' })
  @ApiResponse({ status: 201, description: 'Agendamento criado com sucesso.' })
  @ApiResponse({ status: 409, description: 'Conflito de horário (Double Booking).' })
  @Roles(RoleEnum.ADMIN, RoleEnum.RECEPTIONIST) // Apenas a recepção/admin cria agendas
  @UsePipes(new YupValidationPipe(createAppointmentSchema))
  async create(@Body() createAppointmentDto: CreateAppointmentDto) {
    return await this.appointmentsService.create(createAppointmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista os agendamentos com filtros dinâmicos' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'patient_id', required: false, type: String })
  @ApiQuery({ name: 'doctor_id', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELED'] })
  @ApiQuery({ name: 'date', required: false, type: String, description: 'Filtra por um dia exato (YYYY-MM-DD)' })
  @Roles(RoleEnum.ADMIN, RoleEnum.RECEPTIONIST, RoleEnum.DOCTOR, RoleEnum.NURSE)
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('patient_id') patientId?: string,
    @Query('doctor_id') doctorId?: string,
    @Query('status') status?: string,
    @Query('date') date?: string,
  ) {
    const filters = { patient_id: patientId, doctor_id: doctorId, status, date };
    return await this.appointmentsService.findAll(page || 1, limit || 10, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca os detalhes de um agendamento específico' })
  @Roles(RoleEnum.ADMIN, RoleEnum.RECEPTIONIST, RoleEnum.DOCTOR, RoleEnum.NURSE)
  async findOne(@Param('id') id: string) {
    return await this.appointmentsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza um agendamento (Ex: remanejar data ou alterar status)' })
  @Roles(RoleEnum.ADMIN, RoleEnum.RECEPTIONIST, RoleEnum.DOCTOR)
  @UsePipes(new YupValidationPipe(updateAppointmentSchema))
  async update(
    @Param('id') id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ) {
    return await this.appointmentsService.update(id, updateAppointmentDto);
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