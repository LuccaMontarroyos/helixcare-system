import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Patient } from './entities/patient.entity';
import { PatientsController } from './controllers/patients.controller';
import { PatientsService } from './patients.service';

@Module({
  imports: [SequelizeModule.forFeature([Patient])],
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [SequelizeModule, PatientsService],
})
export class PatientsModule { }