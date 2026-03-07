import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiProperty({ example: 'uuid-do-paciente' })
  patient_id: string;

  @ApiProperty({ example: 'uuid-do-medico' })
  doctor_id: string;

  @ApiProperty({ example: '2026-12-01T14:30:00.000Z', description: 'Data e hora em formato ISO 8601' })
  appointment_date: Date;

  @ApiPropertyOptional({ example: 'Paciente solicitou encaixe por dor aguda.' })
  notes?: string;
}