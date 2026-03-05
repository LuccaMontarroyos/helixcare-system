import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InvoiceStatusEnum } from '../enums/invoice-status.enum';

export class UpdateInvoiceStatusDto {
  @ApiProperty({ example: InvoiceStatusEnum.PAID, enum: InvoiceStatusEnum })
  status: InvoiceStatusEnum;

  @ApiPropertyOptional({ example: '2026-03-04T15:30:00Z', description: 'Data em que o pagamento foi efetivado' })
  paid_at?: Date;

  @ApiPropertyOptional({ example: 'Pagamento recebido na recepção via PIX.' })
  notes?: string;
}