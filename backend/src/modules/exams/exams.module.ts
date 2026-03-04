import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Exam } from './entities/exam.entity';
import { PatientsModule } from '../patients/patients.module';
import { UsersModule } from '../users/users.module';


@Module({
  imports: [
    SequelizeModule.forFeature([Exam]),
    PatientsModule,
    UsersModule,
  ],
  controllers: [],
  providers: [],
  exports: [SequelizeModule],
})
export class ExamsModule {}