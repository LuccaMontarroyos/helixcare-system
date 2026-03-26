import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './entities/user.entity';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';
import { CloudService } from 'src/core/cloud/cloud.service';

@Module({
  imports: [
    SequelizeModule.forFeature([User]),
  ],
  controllers: [UsersController],
  providers: [UsersService, CloudService],
  exports: [SequelizeModule, UsersService],
})
export class UsersModule {}