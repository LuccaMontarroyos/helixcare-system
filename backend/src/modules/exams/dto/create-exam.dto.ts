import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExamDto {
  @ApiProperty({ example: 'uuid-do-paciente' })
  patient_id: string;

  @ApiProperty({ example: 'Hemograma Completo' })
  exam_type: string;

  @ApiPropertyOptional({ example: 'Paciente apresenta febre e fadiga há 4 dias. Suspeita de Dengue.' })
  observations?: string;
}