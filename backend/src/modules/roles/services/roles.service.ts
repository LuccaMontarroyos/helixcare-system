import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Role } from '../entities/role.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role)
    private roleModel: typeof Role,
  ) {}

  async findAll(): Promise<Role[]> {
    return await this.roleModel.findAll({
      order: [['name', 'ASC']],
    });
  }
}