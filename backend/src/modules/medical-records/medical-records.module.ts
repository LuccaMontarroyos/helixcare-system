import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MedicalRecord } from './entities/medical-record.entity';
import { MedicalRecordsController } from './controllers/medical-records.controller';
import { MedicalRecordsService } from './services/medical-records.service';
import { PatientsModule } from '../patients/patients.module';
import { MedicalRecordHistory } from './entities/medical-record.history.entity';
import { CloudService } from 'src/core/cloud/cloud.service';

@Module({
  imports: [
    SequelizeModule.forFeature([MedicalRecord, MedicalRecordHistory]),
    PatientsModule,
  ],
  controllers: [MedicalRecordsController],
  providers: [MedicalRecordsService, CloudService],
})
export class MedicalRecordsModule {}