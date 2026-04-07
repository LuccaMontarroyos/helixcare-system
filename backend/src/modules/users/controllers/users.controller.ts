import { Controller, Get, Put, Delete, Param, Body, UseGuards, UsePipes, Query, BadRequestException, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { UsersService } from '../services/users.service';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { updateUserSchema } from '../schemas/update-user.schema';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/guards/roles.guard';
import { Roles } from '../../../core/decorators/roles.decorator';
import { RoleEnum } from '../../roles/enums/roles.enum';
import { YupValidationPipe } from '../../../core/pipes/yup-validation.pipe';
import { memoryStorage } from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import { string } from 'yup';

@ApiTags('Users (Staff)')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  @ApiOperation({ summary: 'Lista todos os funcionários (Médicos, Enfermeiros, etc.)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Nome ou email do funcionário' })
  @Roles(RoleEnum.ADMIN, RoleEnum.RECEPTIONIST)
  async findAll(@Query('search') search: string) {
    return await this.usersService.findAll(search);
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

  @Post(':id/avatar')
  @ApiOperation({ summary: 'Faz o upload e atualiza a foto de perfil do usuário' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: { type: 'object', properties: { file: { type: 'string', format: 'binary', description: 'Imagem JPG ou PNG (Max: 5MB)' } } },
  })
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpeg|png|jpg)$/)) {
        return cb(new BadRequestException('Apenas imagens PNG e JPEG são permitidas!'), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 }
  }))
  async uploadAvatar(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Nenhuma imagem foi enviada.');
    return await this.usersService.uploadAvatar(id, file);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desativa um funcionário (Soft Delete)' })
  @Roles(RoleEnum.ADMIN)
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
    return { message: 'Usuário desativado com sucesso.' };
  }

}
