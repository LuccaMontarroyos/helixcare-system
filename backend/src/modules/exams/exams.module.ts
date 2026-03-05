import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Exam } from './entities/exam.entity';
import { PatientsModule } from '../patients/patients.module';
import { UsersModule } from '../users/users.module';
import { ExamsController } from './controllers/exams.controller';
import { ExamsService } from './services/exams.service';
import { CloudService } from 'src/core/cloud/cloud.service';


@Module({
  imports: [
    SequelizeModule.forFeature([Exam]),
    PatientsModule,
    UsersModule,
  ],
  controllers: [ExamsController],
  providers: [ExamsService, CloudService],
  exports: [SequelizeModule, ExamsService],
})
export class ExamsModule {}