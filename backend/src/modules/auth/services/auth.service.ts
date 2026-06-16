  import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
  import { JwtService } from '@nestjs/jwt';
  import { InjectModel } from '@nestjs/sequelize';
  import { Sequelize } from 'sequelize-typescript';
  import { CreationAttributes } from 'sequelize';
  import * as argon2 from 'argon2';
  import { User } from '../../users/entities/user.entity';
  import { RegisterDto } from '../dto/register.dto';
  import { LoginDto } from '../dto/login.dto';
  import { Role } from '../../roles/entities/role.entity';
  import { Clinic } from '../../clinics/entities/clinic.entity';
  import { RoleEnum } from '../../roles/enums/roles.enum';

  @Injectable()
  export class AuthService {
    constructor(
      @InjectModel(User) private userModel: typeof User,
      private sequelize: Sequelize,
      private jwtService: JwtService,
    ) {}

    async register(dto: RegisterDto, clinicId: string | null) {
      const existingUser = await this.userModel.findOne({ where: { email: dto.email } });
      if (existingUser) {
        throw new BadRequestException('Este e-mail já está em uso.');
      }

      const hashedPassword = await argon2.hash(dto.password);
      const transaction = await this.sequelize.transaction();

      try {
        const newUser = await this.userModel.create(
          {
            name: dto.name,
            email: dto.email,
            password_hash: hashedPassword,
            role_id: dto.role_id,
            clinic_id: clinicId,
          } as CreationAttributes<User>,
          { transaction }
        );

        await transaction.commit();

        const userObj = newUser.get({ plain: true }) as User;
        const { password_hash, ...userResponse } = userObj;

        return userResponse;
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    }

    async login(dto: LoginDto) {
      const user = await this.userModel.findOne({
        where: { email: dto.email },
        include: [Role, Clinic],
      });

      if (!user) {
        throw new UnauthorizedException('Credenciais inválidas.');
      }

      const isPasswordValid = await argon2.verify(user.password_hash, dto.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Credenciais inválidas.');
      }

      const isSuperAdmin = user.role.name === RoleEnum.SUPER_ADMIN;
      if (!isSuperAdmin && user.clinic && !user.clinic.is_active) {
        throw new UnauthorizedException('Esta clínica está inativa. Contate o administrador da plataforma.');
      }

      const clinicId = isSuperAdmin ? null : (user.clinic_id ?? null);

      const payload = {
        sub: user.id,
        role: user.role.name,
        clinicId,
      };

      return {
        access_token: await this.jwtService.signAsync(payload),
        user: {
          id: user.id,
          name: user.name,
          role: user.role.name,
          clinicId,
        },
      };
    }
  }