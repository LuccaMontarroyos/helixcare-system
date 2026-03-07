import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Invoice } from './entities/invoice.entity';
import { PatientsModule } from '../patients/patients.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { ExamsModule } from '../exams/exams.module';
import { BillingController } from './controllers/billing.controller';
import { BillingService } from './services/billing.service';

@Module({
  imports: [
    SequelizeModule.forFeature([Invoice]),
    PatientsModule,
    AppointmentsModule,
    ExamsModule,
  ],
  controllers: [BillingController],
  providers: [BillingService, SequelizeModule],
})
export class BillingModule {}