import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Appointment } from './entities/appointment.entity';
import { PatientsModule } from '../patients/patients.module';
import { UsersModule } from '../users/users.module';
import { AppointmentsController } from './controllers/appointments.controller';
import { AppointmentsService } from './services/appointments.service';
import { AppointmentsNoShowScheduler } from './cron/appointments-no-show.scheduler';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    SequelizeModule.forFeature([Appointment]),
    EventEmitterModule,
    PatientsModule,
    UsersModule,
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentsNoShowScheduler],
  exports: [SequelizeModule, AppointmentsService],
})
export class AppointmentsModule {}