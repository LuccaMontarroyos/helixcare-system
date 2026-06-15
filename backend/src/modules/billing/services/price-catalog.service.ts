import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PriceCatalog } from '../entities/price-catalog.entity';
import { PaymentMethodEnum } from '../enums/payment-method.enum';

export interface ResolvedPrice {
  amount:         number;
  paymentMethod:  PaymentMethodEnum;
  dueDays:        number;
}

@Injectable()
export class PriceCatalogService {
  private readonly logger = new Logger(PriceCatalogService.name);

  constructor(
    @InjectModel(PriceCatalog)
    private catalogModel: typeof PriceCatalog,
  ) {}

  async resolve(
    serviceKind: 'APPOINTMENT' | 'EXAM',
    serviceCode: string | null | undefined,
    hasInsurance: boolean,
  ): Promise<ResolvedPrice> {
    const code = serviceCode || 'OUTRO';

    const entry = await this.catalogModel.findOne({
      where: { service_kind: serviceKind, service_code: code, is_active: true },
    });

    if (!entry) {
      this.logger.warn(
        `[PriceCatalog] Código não encontrado: ${serviceKind}/${code}. ` +
        `Tentando fallback OUTRO.`,
      );

      const fallback = await this.catalogModel.findOne({
        where: { service_kind: serviceKind, service_code: 'OUTRO', is_active: true },
      });

      return {
        amount:        parseFloat(String(fallback?.base_price ?? 220)),
        paymentMethod: (fallback?.default_payment_method as PaymentMethodEnum) ?? PaymentMethodEnum.PIX,
        dueDays:       fallback?.due_days ?? 0,
      };
    }

    const INSURANCE_DISCOUNT = 0.6;
    const amount = hasInsurance
      ? parseFloat(String(entry.base_price)) * INSURANCE_DISCOUNT
      : parseFloat(String(entry.base_price));

    const paymentMethod = hasInsurance
      ? PaymentMethodEnum.HEALTH_INSURANCE
      : (entry.default_payment_method as PaymentMethodEnum) ?? PaymentMethodEnum.PIX;

    return {
      amount:        Math.round(amount * 100) / 100,
      paymentMethod,
      dueDays:       entry.due_days,
    };
  }

  async findAll(serviceKind?: 'APPOINTMENT' | 'EXAM'): Promise<PriceCatalog[]> {
    const where: any = { is_active: true };
    if (serviceKind) where.service_kind = serviceKind;
    return this.catalogModel.findAll({ where, order: [['display_name', 'ASC']] });
  }
}