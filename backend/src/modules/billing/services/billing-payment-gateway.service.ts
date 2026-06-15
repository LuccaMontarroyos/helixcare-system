import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, randomUUID } from 'crypto';
import { Invoice } from '../entities/invoice.entity';
import { PaymentMethodEnum } from '../enums/payment-method.enum';

@Injectable()
export class BillingPaymentGatewayService {
  private readonly providerName = process.env.BILLING_PAYMENT_PROVIDER || 'MOCKPAY';
  private readonly checkoutBaseUrl =
    process.env.BILLING_CHECKOUT_BASE_URL || 'https://checkout.helixcare.local/pay';
  private readonly webhookSecret = process.env.BILLING_WEBHOOK_SECRET || '';

  createCheckout(invoice: Invoice) {
    if (invoice.status === 'PAID') {
      throw new BadRequestException('A fatura já foi paga e não pode gerar novo checkout.');
    }

    if (invoice.payment_method === PaymentMethodEnum.HEALTH_INSURANCE) {
      throw new BadRequestException('Faturas de convênio não usam checkout de gateway.');
    }

    if (invoice.payment_method === PaymentMethodEnum.CASH) {
      throw new BadRequestException('Faturas em dinheiro não usam checkout de gateway.');
    }

    const providerCheckoutSessionId = `sess_${randomUUID().replace(/-/g, '')}`;
    const checkoutUrl =
      `${this.checkoutBaseUrl}` +
      `?invoice_id=${encodeURIComponent(invoice.id)}` +
      `&session_id=${encodeURIComponent(providerCheckoutSessionId)}`;

    return {
      provider: this.providerName,
      providerCheckoutSessionId,
      checkoutUrl,
    };
  }

  verifyWebhookSignature(payload: Record<string, unknown>, signature?: string): void {
    if (!this.webhookSecret) return;
    if (!signature) {
      throw new UnauthorizedException('Assinatura ausente no webhook.');
    }

    const canonicalPayload = JSON.stringify(payload);
    const expected = createHmac('sha256', this.webhookSecret)
      .update(canonicalPayload)
      .digest('hex');

    if (signature !== expected) {
      throw new UnauthorizedException('Assinatura inválida no webhook.');
    }
  }
}
