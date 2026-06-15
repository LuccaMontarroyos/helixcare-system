import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Invoice } from './entities/invoice.entity';
import { PriceCatalog } from './entities/price-catalog.entity';
import { BillingController } from './controllers/billing.controller';
import { BillingWebhookController } from './controllers/billing-webhook.controller';
import { BillingService } from './services/billing.service';
import { BillingPaymentGatewayService } from './services/billing-payment-gateway.service';
import { BillingEventListenerService } from './services/billing-event-listener.event';
import { PriceCatalogService } from './services/price-catalog.service';
import { PatientsModule } from '../patients/patients.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { ExamsModule } from '../exams/exams.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Invoice, PriceCatalog]),
    PatientsModule,
    AppointmentsModule,
    ExamsModule,
  ],
  controllers: [
    BillingController,
    BillingWebhookController,
  ],
  providers: [
    BillingService,
    BillingPaymentGatewayService,
    BillingEventListenerService,
    PriceCatalogService,
  ],
  exports: [BillingService, PriceCatalogService],
})
export class BillingModule { }