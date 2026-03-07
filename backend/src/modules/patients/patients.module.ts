import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Patient } from './entities/patient.entity';
import { PatientsController } from './controllers/patients.controller';
import { PatientsService } from './services/patients.service';
import { CloudService } from 'src/core/cloud/cloud.service';

@Module({
  imports: [SequelizeModule.forFeature([Patient])],
  controllers: [PatientsController],
  providers: [PatientsService, CloudService],
  exports: [SequelizeModule, PatientsService],
})
export class PatientsModule { }