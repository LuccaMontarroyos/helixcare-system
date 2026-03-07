import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExamStatusEnum } from '../enums/exam-status.enum';

export class UpdateExamResultDto {
  @ApiProperty({ example: ExamStatusEnum.COMPLETED, enum: ExamStatusEnum })
  status: ExamStatusEnum;

  @ApiPropertyOptional({ example: 'Eritrócitos: 4.5 milhões/mm³ (Normal). Leucócitos: 3.200/mm³ (Leucopenia leve).' })
  result_text?: string;
}