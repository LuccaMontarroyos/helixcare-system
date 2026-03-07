import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SocialHistory } from '../entities/medical-record.entity';

class SocialHistoryDto implements SocialHistory {
  @ApiProperty({ example: false })
  is_smoker: boolean;
  
  @ApiProperty({ example: true })
  consumes_alcohol: boolean;
  
  @ApiPropertyOptional({ example: 'Bebedor social aos finais de semana' })
  notes?: string;
}

export class CreateMedicalRecordDto {
  @ApiProperty({ example: 'uuid-do-paciente' })
  patient_id: string;

  @ApiProperty({ example: 'Paciente relata dores de cabeça constantes há 3 dias...' })
  anamnesis: string;

  @ApiPropertyOptional({ example: 'Enxaqueca (G43)' })
  diagnosis?: string;

  @ApiPropertyOptional({ example: 'Paracetamol 750mg de 8/8h' })
  prescription?: string;

  @ApiPropertyOptional({ type: SocialHistoryDto })
  social_history?: SocialHistoryDto;
}