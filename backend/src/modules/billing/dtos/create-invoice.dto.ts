import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethodEnum } from '../enums/payment-method.enum';

export class CreateInvoiceDto {
  @ApiProperty({ example: 'uuid-do-paciente' })
  patient_id: string;

  @ApiPropertyOptional({ example: 'uuid-do-agendamento' })
  appointment_id?: string;

  @ApiPropertyOptional({ example: 'uuid-do-exame' })
  exam_id?: string;

  @ApiProperty({ example: 150.50, description: 'Valor da fatura em reais' })
  amount: number;

  @ApiProperty({ example: PaymentMethodEnum.CREDIT_CARD, enum: PaymentMethodEnum })
  payment_method: PaymentMethodEnum;

  @ApiProperty({ example: '2026-03-10T23:59:59Z', description: 'Data limite para o pagamento' })
  due_date: Date;

  @ApiPropertyOptional({ example: 'Cobrança referente à consulta cardiológica.' })
  notes?: string;
}