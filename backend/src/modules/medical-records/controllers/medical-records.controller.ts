import { Controller, Post, Put, Get, Delete, Param, Query, Body, UseGuards, UsePipes, ConflictException, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MedicalRecordsService } from '../services/medical-records.service';
import { CreateMedicalRecordDto } from '../dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from '../dto/update-medical-record.dto';
import { createMedicalRecordSchema } from '../schemas/create-medical-record.schema';
import { updateMedicalRecordSchema } from '../schemas/update-medical-record.schema';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/guards/roles.guard';
import { Roles } from '../../../core/decorators/roles.decorator';
import { RoleEnum } from '../../roles/enums/roles.enum';
import { YupValidationPipe } from '../../../core/pipes/yup-validation.pipe';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { RedisLockService } from 'src/core/redis/redis-lock.service';

@ApiTags('Medical Records')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('medical-records')
export class MedicalRecordsController {
  constructor(private readonly medicalRecordsService: MedicalRecordsService, private readonly redisLockService: RedisLockService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma nova evolução/prontuário para um paciente' })
  @ApiResponse({ status: 201, description: 'Prontuário criado com sucesso.' })
  @Roles(RoleEnum.DOCTOR, RoleEnum.NURSE)
  @UsePipes(new YupValidationPipe(createMedicalRecordSchema))
  async create(
    @Body() createMedicalRecordDto: CreateMedicalRecordDto,
    @CurrentUser() user: any,
  ) {
    return await this.medicalRecordsService.create(user.id, createMedicalRecordDto);
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Lista o histórico de prontuários de um paciente (Paginado)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 10)' })
  @ApiQuery({ name: 'doctor_id', required: false, type: String, description: 'Filtrar por ID do médico' })
  @ApiQuery({ name: 'start_date', required: false, type: String, description: 'Data inicial (YYYY-MM-DD)' })
  @ApiQuery({ name: 'end_date', required: false, type: String, description: 'Data final (YYYY-MM-DD)' })
  @ApiQuery({ name: 'diagnosis', required: false, type: String, description: 'Palavra-chave no diagnóstico' })
  @Roles(RoleEnum.ADMIN, RoleEnum.DOCTOR, RoleEnum.NURSE)
  async findAllByPatient(
    @Param('patientId') patientId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('doctor_id') doctorId?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('diagnosis') diagnosis?: string,
  ) {
    const filters = {
        doctor_id: doctorId,
        start_date: startDate,
        end_date: endDate,
        diagnosis,
      };

    return await this.medicalRecordsService.findAllByPatient(patientId, page || 1, limit || 10, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca os detalhes de uma evolução médica específica' })
  @Roles(RoleEnum.ADMIN, RoleEnum.DOCTOR, RoleEnum.NURSE)
  async findOne(@Param('id') id: string) {
    return await this.medicalRecordsService.findOne(id);
  }

  @Post(':id/lock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trava um prontuário para edição exclusiva (Lock Pessimista)' })
  @Roles(RoleEnum.DOCTOR, RoleEnum.NURSE)
  async lockRecord(@Param('id') id: string, @CurrentUser() user: any) {
    const locked = await this.redisLockService.acquireLock(id, user.id);
    if (!locked) {
      throw new ConflictException('O prontuário já está sendo editado por outro profissional.');
    }
    return { message: 'Prontuário travado com sucesso para edição.' };
  }

  @Post(':id/unlock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Libera a trava de um prontuário manualmente' })
  @Roles(RoleEnum.DOCTOR, RoleEnum.NURSE)
  async unlockRecord(@Param('id') id: string, @CurrentUser() user: any) {
    const unlocked = await this.redisLockService.releaseLock(id, user.id);
    if (!unlocked) {
      throw new ConflictException('Você não pode destravar um prontuário que não foi travado por você.');
    }
    return { message: 'Prontuário liberado com sucesso.' };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza uma evolução clínica (Somente o Autor ou Admin)' })
  @Roles(RoleEnum.ADMIN, RoleEnum.DOCTOR, RoleEnum.NURSE)
  @UsePipes(new YupValidationPipe(updateMedicalRecordSchema))
  async update(
    @Param('id') id: string,
    @Body() updateMedicalRecordDto: UpdateMedicalRecordDto,
    @CurrentUser() user: any,
  ) {
    return await this.medicalRecordsService.update(id, user.id, user.role, updateMedicalRecordDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove uma evolução clínica (Soft Delete)' })
  @Roles(RoleEnum.ADMIN, RoleEnum.DOCTOR, RoleEnum.NURSE)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    await this.medicalRecordsService.remove(id, user.id, user.role);
    return { message: 'Prontuário removido com sucesso.' };
  }
}