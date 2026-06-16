import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Clinic } from './entities/clinic.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { ClinicsController } from './controllers/clinics.controller';
import { ClinicsService } from './services/clinics.service';

@Module({
  imports: [SequelizeModule.forFeature([Clinic, User, Role])],
  controllers: [ClinicsController],
  providers: [ClinicsService],
  exports: [ClinicsService, SequelizeModule],
})
export class ClinicsModule {}
