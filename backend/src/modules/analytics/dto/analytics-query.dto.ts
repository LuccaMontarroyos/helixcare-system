import { ApiPropertyOptional } from '@nestjs/swagger';

export class AnalyticsQueryDto {
  @ApiPropertyOptional({ example: '2026-03-01', description: 'Data inicial do relatório (YYYY-MM-DD)' })
  start_date?: string;

  @ApiPropertyOptional({ example: '2026-03-31', description: 'Data final do relatório (YYYY-MM-DD)' })
  end_date?: string;
}