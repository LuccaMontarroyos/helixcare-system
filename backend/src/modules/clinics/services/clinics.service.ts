import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { CreationAttributes } from 'sequelize';
import * as argon2 from 'argon2';
import { Clinic } from '../entities/clinic.entity';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../roles/entities/role.entity';
import { CreateClinicDto } from '../dto/create-clinic.dto';
import { RoleEnum } from '../../roles/enums/roles.enum';

@Injectable()
export class ClinicsService {
  constructor(
    @InjectModel(Clinic) private clinicModel: typeof Clinic,
    @InjectModel(User) private userModel: typeof User,
    @InjectModel(Role) private roleModel: typeof Role,
    private sequelize: Sequelize,
  ) {}

  async create(dto: CreateClinicDto): Promise<Clinic> {
    const emailTaken = await this.userModel.findOne({ where: { email: dto.first_admin_email } });
    if (emailTaken) {
      throw new BadRequestException('Este e-mail já está em uso por outro usuário.');
    }

    const adminRole = await this.roleModel.findOne({ where: { name: RoleEnum.ADMIN } });
    if (!adminRole) {
      throw new BadRequestException('Role ADMIN não encontrada. Execute os seeders primeiro.');
    }

    const passwordHash = await argon2.hash(dto.first_admin_password);
    const transaction = await this.sequelize.transaction();

    try {
      const clinic = await this.clinicModel.create(
        { name: dto.name, is_active: true } as CreationAttributes<Clinic>,
        { transaction },
      );

      await this.userModel.create(
        {
          name: dto.first_admin_name,
          email: dto.first_admin_email,
          password_hash: passwordHash,
          role_id: adminRole.id,
          clinic_id: clinic.id,
          is_active: true,
        } as CreationAttributes<User>,
        { transaction },
      );

      await transaction.commit();
      return clinic;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findAll(): Promise<Clinic[]> {
    return this.clinicModel.findAll({ order: [['created_at', 'DESC']] });
  }

  async deactivate(id: string): Promise<Clinic> {
    const clinic = await this.clinicModel.findByPk(id);
    if (!clinic) throw new NotFoundException('Clínica não encontrada.');
    await clinic.update({ is_active: false });
    return clinic;
  }
}
