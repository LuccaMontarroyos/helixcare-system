import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Invoice } from '../billing/entities/invoice.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Exam } from '../exams/entities/exam.entity';
import { AnalyticsController } from './controllers/analytics.controller';
import { AnalyticsService } from './services/analytics.service';
import { RedisModule } from 'src/core/redis/redis.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Invoice, Appointment, Exam]),
    RedisModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}