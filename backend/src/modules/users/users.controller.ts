import { Controller, Get, Put, Delete, Param, Body, UseGuards, UsePipes } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { updateUserSchema } from './schemas/update-user.schema';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { RoleEnum } from '../roles/enums/roles.enum';
import { YupValidationPipe } from '../../core/pipes/yup-validation.pipe';

@ApiTags('Users (Staff)')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Lista todos os funcionários (Médicos, Enfermeiros, etc.)' })
  @Roles(RoleEnum.ADMIN, RoleEnum.RECEPTIONIST) 
  async findAll() {
    return await this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um funcionário específico' })
  @Roles(RoleEnum.ADMIN, RoleEnum.RECEPTIONIST)
  async findOne(@Param('id') id: string) {
    return await this.usersService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza os dados de um funcionário (Nome ou Cargo)' })
  @Roles(RoleEnum.ADMIN)
  @UsePipes(new YupValidationPipe(updateUserSchema))
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return await this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desativa um funcionário (Soft Delete)' })
  @Roles(RoleEnum.ADMIN)
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
    return { message: 'Usuário desativado com sucesso.' };
  }
}