import { Controller, Post, Get, Put, Delete, Param, Body, UseGuards, UsePipes, BadRequestException, UploadedFile, UseInterceptors, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { PatientsService } from '../services/patients.service';
import { CreatePatientDto } from '../dto/create-patient.dto';
import { createPatientSchema } from '../schemas/create-patient.schema';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/guards/roles.guard';
import { Roles } from '../../../core/decorators/roles.decorator';
import { RoleEnum } from '../../roles/enums/roles.enum';
import { UpdatePatientDto } from '../dto/update-patient.dto';
import { updatePatientSchema } from '../schemas/update-patient.schema';
import { YupValidationPipe } from '../../../core/pipes/yup-validation.pipe';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@ApiTags('Patients')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) { }

  @Post()
  @ApiOperation({ summary: 'Cadastra um novo paciente clínico' })
  @ApiResponse({ status: 201, description: 'Paciente cadastrado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Erro de validação (Yup) ou CPF já existente.' })
  @ApiResponse({ status: 403, description: 'Acesso negado para o cargo atual.' })
  @Roles(RoleEnum.ADMIN, RoleEnum.RECEPTIONIST)
  async create(@Body(new YupValidationPipe(createPatientSchema)) createPatientDto: CreatePatientDto) {
    return await this.patientsService.create(createPatientDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza os dados de um paciente existente' })
  @ApiResponse({ status: 200, description: 'Paciente atualizado com sucesso.' })
  @Roles(RoleEnum.ADMIN, RoleEnum.RECEPTIONIST)
  async update(@Param('id') id: string, @Body(new YupValidationPipe(updatePatientSchema)) updatePatientDto: UpdatePatientDto) {
    return await this.patientsService.update(id, updatePatientDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os pacientes' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Nome ou CPF do paciente' })
  @Roles(RoleEnum.ADMIN, RoleEnum.RECEPTIONIST, RoleEnum.DOCTOR, RoleEnum.NURSE)
  async findAll(@Query('search') search: string) {
    return await this.patientsService.findAll(search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca os dados de um paciente específico pelo ID' })
  @Roles(RoleEnum.ADMIN, RoleEnum.RECEPTIONIST, RoleEnum.DOCTOR, RoleEnum.NURSE)
  async findOne(@Param('id') id: string) {
    return await this.patientsService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um paciente do sistema (Soft Delete)' })
  @ApiResponse({ status: 200, description: 'Paciente removido com sucesso.' })
  @Roles(RoleEnum.ADMIN, RoleEnum.RECEPTIONIST)
  async remove(@Param('id') id: string) {
    await this.patientsService.remove(id);
    return { message: 'Paciente removido com sucesso.' };
  }

  @Post(':id/avatar')
  @ApiOperation({ summary: 'Faz o upload da foto de perfil do paciente (Recepção/Admin)' })
  @Roles(RoleEnum.ADMIN, RoleEnum.RECEPTIONIST)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: { type: 'object', properties: { file: { type: 'string', format: 'binary', description: 'Foto (Max: 5MB)' } } },
  })
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpeg|png|jpg)$/)) {
        return cb(new BadRequestException('Apenas imagens JPEG ou PNG são permitidas para a foto de perfil!'), false);
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
    return await this.patientsService.uploadAvatar(id, file);
  }
}