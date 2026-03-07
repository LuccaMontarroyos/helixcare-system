import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './entities/user.entity';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';

@Module({
  imports: [
    SequelizeModule.forFeature([User]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [SequelizeModule, UsersService],
})
export class UsersModule {}