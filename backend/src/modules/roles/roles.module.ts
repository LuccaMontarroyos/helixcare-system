import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Role } from './entities/role.entity';
import { RolesController } from './controllers/roles.controller';
import { RolesService } from './services/roles.service';

@Module({
  imports: [SequelizeModule.forFeature([Role])],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [SequelizeModule, RolesService],
})
export class RolesModule { }