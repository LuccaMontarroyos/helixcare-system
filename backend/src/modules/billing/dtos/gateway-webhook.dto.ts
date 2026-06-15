import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GatewayWebhookDataDto {
  @ApiProperty({ example: 'uuid-da-fatura' })
  invoice_id: string;

  @ApiPropertyOptional({ example: 'pay_123456789' })
  provider_payment_id?: string;

  @ApiPropertyOptional({ example: 'sess_123456789' })
  provider_checkout_session_id?: string;

  @ApiPropertyOptional({ example: 'PAID' })
  status?: string;
}

export class GatewayWebhookDto {
  @ApiProperty({ example: 'evt_123456789' })
  event_id: string;

  @ApiProperty({ example: 'checkout.paid' })
  event_type: string;

  @ApiProperty({ example: 'MOCKPAY' })
  provider: string;

  @ApiPropertyOptional({ example: '2026-05-05T17:04:00.000Z' })
  occurred_at?: string;

  @ApiProperty({ type: GatewayWebhookDataDto })
  data: GatewayWebhookDataDto;
}
