import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentTypeEnum } from '../enums/appointment-type.enum';

export class CreateAppointmentDto {

  @ApiProperty({
    example: 'uuid-do-paciente',
    description: 'ID do paciente',
  })
  patient_id: string;

  @ApiProperty({
    example: 'uuid-do-medico',
    description: 'ID do médico responsável',
  })
  doctor_id: string;

  @ApiProperty({
    example: '2026-12-01T14:30:00.000Z',
    description: 'Data e hora em formato ISO 8601',
  })
  appointment_date: Date;

  @ApiPropertyOptional({
    example: 'PRIMEIRA_CONSULTA',
    enum: AppointmentTypeEnum,
    description: 'Tipo da consulta ou procedimento. Se OUTRO, informar duration_minutes.',
  })
  appointment_type?: string;

  @ApiPropertyOptional({
    example: 45,
    description: 'Duração em minutos. Preenchida automaticamente pelo tipo. Obrigatória apenas para tipo OUTRO.',
  })
  duration_minutes?: number;

  @ApiPropertyOptional({
    example: 'Paciente solicitou encaixe por dor aguda.',
  })
  notes?: string;
}