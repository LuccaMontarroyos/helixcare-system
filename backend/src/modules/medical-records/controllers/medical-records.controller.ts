import { Controller, Post, Put, Get, Delete, Param, Query, Body, UseGuards, UsePipes, ConflictException, HttpCode, HttpStatus, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
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
import type { ICurrentUser } from '../..//auth/interfaces/current-user.interface';
import { memoryStorage } from 'multer';

@ApiTags('Medical Records')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('medical-records')
export class MedicalRecordsController {
  constructor(private readonly medicalRecordsService: MedicalRecordsService, private readonly redisLockService: RedisLockService) { }

  @Post()
  @ApiOperation({ summary: 'Cria uma nova evolução/prontuário para um paciente' })
  @ApiResponse({ status: 201, description: 'Prontuário criado com sucesso.' })
  @Roles(RoleEnum.DOCTOR, RoleEnum.NURSE)
  async create(
    @Body(new YupValidationPipe(createMedicalRecordSchema)) createMedicalRecordDto: CreateMedicalRecordDto,
    @CurrentUser() user: ICurrentUser,
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
  async lockRecord(@Param('id') id: string, @CurrentUser() user: ICurrentUser) {
    const locked = await this.redisLockService.acquireLock(id, user.id);
    if (!locked) {
      throw new ConflictException('O prontuário já está sendo editado por outro profissional.');
    }
    return { message: 'Prontuário travado com sucesso para edição.' };
  }

  @Get(':id/lock-status')
  @ApiOperation({ summary: 'Verifica o status atual de travamento de um prontuário' })
  @Roles(RoleEnum.ADMIN, RoleEnum.DOCTOR, RoleEnum.NURSE)
  async checkLockStatus(@Param('id') id: string) {
    const ownerId = await this.redisLockService.getLockOwner(id);
    return {
      isLocked: !!ownerId,
      lockedBy: ownerId || null,
    };
  }

  @Post(':id/unlock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Libera a trava de um prontuário manualmente' })
  @Roles(RoleEnum.DOCTOR, RoleEnum.NURSE)
  async unlockRecord(@Param('id') id: string, @CurrentUser() user: ICurrentUser) {
    const unlocked = await this.redisLockService.releaseLock(id, user.id);
    if (!unlocked) {
      throw new ConflictException('Você não pode destravar um prontuário que não foi travado por você.');
    }
    return { message: 'Prontuário liberado com sucesso.' };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza uma evolução clínica (Somente o Autor ou Admin)' })
  @Roles(RoleEnum.ADMIN, RoleEnum.DOCTOR, RoleEnum.NURSE)
  async update(
    @Param('id') id: string,
    @Body(new YupValidationPipe(updateMedicalRecordSchema)) updateMedicalRecordDto: UpdateMedicalRecordDto,
    @CurrentUser() user: ICurrentUser,
  ) {
    return await this.medicalRecordsService.update(id, user.id, user.role, updateMedicalRecordDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove uma evolução clínica (Soft Delete)' })
  @Roles(RoleEnum.ADMIN, RoleEnum.DOCTOR, RoleEnum.NURSE)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: ICurrentUser,
  ) {
    await this.medicalRecordsService.remove(id, user.id, user.role);
    return { message: 'Prontuário removido com sucesso.' };
  }

  @Post(':id/upload')
  @ApiOperation({ summary: 'Anexa PDFs ou Imagens externas ao prontuário (Apenas Médicos)' })
  @Roles(RoleEnum.DOCTOR)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: { type: 'object', properties: { file: { type: 'string', format: 'binary', description: 'PDF ou Imagem (Max: 10MB)' } } },
  })
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(pdf|jpeg|png|jpg)$/)) {
        return cb(new BadRequestException('Apenas arquivos PDF, PNG e JPEG são permitidos!'), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 10 * 1024 * 1024 }
  }))
  async uploadAttachment(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: ICurrentUser,
  ) {
    if (!file) throw new BadRequestException('Nenhum arquivo foi enviado.');
    return await this.medicalRecordsService.uploadAttachment(id, user.id, file);
  }
}