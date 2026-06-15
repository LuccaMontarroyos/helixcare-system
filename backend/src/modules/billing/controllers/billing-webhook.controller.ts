import { Body, Controller, Headers, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BillingService } from '../services/billing.service';
import { GatewayWebhookDto } from '../dtos/gateway-webhook.dto';
import { gatewayWebhookSchema } from '../schemas/gateway-webhook.schema';
import { YupValidationPipe } from '../../../core/pipes/yup-validation.pipe';

@ApiTags('Billing Webhook')
@Controller('invoices')
export class BillingWebhookController {
  constructor(private readonly billingService: BillingService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recebe eventos de pagamento do gateway (webhook)' })
  async handleWebhook(
    @Body(new YupValidationPipe(gatewayWebhookSchema)) payload: GatewayWebhookDto,
    @Headers('x-billing-signature') signature?: string,
  ) {
    return await this.billingService.handleGatewayWebhook(payload, signature);
  }
}
