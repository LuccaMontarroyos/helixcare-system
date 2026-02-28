import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Patient } from './entities/patient.entity';

@Module({
  imports: [SequelizeModule.forFeature([Patient])],
  controllers: [],
  providers: [],
  exports: [SequelizeModule],
})
export class PatientsModule {}