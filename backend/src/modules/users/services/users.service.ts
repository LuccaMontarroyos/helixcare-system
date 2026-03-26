import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { CreationAttributes, Op } from 'sequelize';
import { User } from '../entities/user.entity';
import { Role } from '../../roles/entities/role.entity';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { CloudService } from 'src/core/cloud/cloud.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User) private userModel: typeof User,
    private sequelize: Sequelize,
    private cloudService: CloudService,
  ) { }

  async findAll(search?: string): Promise<Omit<User, 'password_hash'>[]> {

    const whereClause: any = {};

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }
    const users = await this.userModel.findAll({
      where: whereClause,
      attributes: { exclude: ['password_hash'] },
      include: [{ model: Role, attributes: ['id', 'name'] }],
      order: [['created_at', 'DESC']],
      limit: search ? 20 : undefined,
    });
    return users as unknown as Omit<User, 'password_hash'>[];
  }

  async findOne(id: string): Promise<Omit<User, 'password_hash'>> {
    const user = await this.userModel.findByPk(id, {
      attributes: { exclude: ['password_hash'] },
      include: [{ model: Role, attributes: { exclude: ['password_hash']} }],
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<Omit<User, 'password_hash'>> {
    const user = await this.userModel.findByPk(id);

    if (!user) throw new NotFoundException('Usuário não encontrado.');

    const transaction = await this.sequelize.transaction();
    try {
      await user.update(dto as Partial<CreationAttributes<User>>, { transaction });
      await transaction.commit();

      return this.findOne(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async uploadAvatar(id: string, file: Express.Multer.File): Promise<Omit<User, 'password_hash'>> {
    const user = await this.userModel.findByPk(id);
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    
    const fileUrl = await this.cloudService.uploadFile(file);

    await user.update({ avatar_url: fileUrl });

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const user = await this.userModel.findByPk(id);
    if (!user) throw new NotFoundException('Usuário não encontrado.');

    await user.update({ is_active: false });
    await user.destroy();
  }
}