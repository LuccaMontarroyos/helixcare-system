import { Controller, Post, Get, Param, Body, UseGuards, UsePipes } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { createPatientSchema } from './schemas/create-patient.schema';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { RoleEnum } from '../roles/enums/roles.enum';
import { YupValidationPipe } from '../../core/pipes/yup-validation.pipe';

@ApiTags('Patients')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastra um novo paciente clínico' })
  @ApiResponse({ status: 201, description: 'Paciente cadastrado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Erro de validação (Yup) ou CPF já existente.' })
  @ApiResponse({ status: 403, description: 'Acesso negado para o cargo atual.' })
  @Roles(RoleEnum.ADMIN, RoleEnum.RECEPTIONIST) 
  @UsePipes(new YupValidationPipe(createPatientSchema))
  async create(@Body() createPatientDto: CreatePatientDto) {
    return await this.patientsService.create(createPatientDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os pacientes' })
  @Roles(RoleEnum.ADMIN, RoleEnum.RECEPTIONIST, RoleEnum.DOCTOR, RoleEnum.NURSE)
  async findAll() {
    return await this.patientsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca os dados de um paciente específico pelo ID' })
  @Roles(RoleEnum.ADMIN, RoleEnum.RECEPTIONIST, RoleEnum.DOCTOR, RoleEnum.NURSE)
  async findOne(@Param('id') id: string) {
    return await this.patientsService.findOne(id);
  }
}