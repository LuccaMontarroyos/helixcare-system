  import { Module } from '@nestjs/common';
  import { SequelizeModule } from '@nestjs/sequelize';
  import { SearchController } from './search.controller';
  import { SearchService } from './search.service';

  import { Patient } from '../modules/patients/entities/patient.entity';
  import { User } from '../modules/users/entities/user.entity';
  import { Appointment } from '../modules/appointments/entities/appointment.entity';
import { AuthModule } from 'src/modules/auth/auth.module';

  @Module({
    imports: [SequelizeModule.forFeature([Patient, User, Appointment]), AuthModule],
    controllers: [SearchController],
    providers: [SearchService],
  })
  export class SearchModule {}