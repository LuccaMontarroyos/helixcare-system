import { Controller, Post, Get, Put, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus, UseInterceptors, UploadedFile, BadRequestException, } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { ExamsService } from '../services/exams.service';
import { CreateExamDto } from '../dto/create-exam.dto';
import { UpdateExamResultDto } from '../dto/update-exam-result.dto';
import { createExamSchema } from '../schemas/create-exam.schema';
import { updateExamResultSchema } from '../schemas/update-exam-result.schema';

import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/guards/roles.guard';
import { Roles } from '../../../core/decorators/roles.decorator';
import { RoleEnum } from '../../roles/enums/roles.enum';
import { YupValidationPipe } from '../../../core/pipes/yup-validation.pipe';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import type { ICurrentUser } from '../../auth/interfaces/current-user.interface';

import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@ApiTags('Exams (Laboratório)')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) { }

  @Post()
  @ApiOperation({ summary: 'Solicita um novo exame (Apenas Médicos)' })
  @ApiResponse({ status: 201, description: 'Pedido de exame criado com sucesso.' })
  @Roles(RoleEnum.DOCTOR)
  async create(
    @Body(new YupValidationPipe(createExamSchema)) createExamDto: CreateExamDto,
    @CurrentUser() user: ICurrentUser,
  ) {
    return await this.examsService.create(user.id, createExamDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista os exames com filtros dinâmicos' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'patient_id', required: false, type: String })
  @ApiQuery({ name: 'doctor_id', required: false, type: String })
  @ApiQuery({ name: 'lab_technician_id', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['REQUESTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED'] })
  @ApiQuery({ name: 'exam_type', required: false, type: String })
  @Roles(RoleEnum.ADMIN, RoleEnum.DOCTOR, RoleEnum.NURSE, RoleEnum.LAB_TECHNICIAN)

  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('patient_id') patientId?: string,
    @Query('doctor_id') doctorId?: string,
    @Query('lab_technician_id') labTechnicianId?: string,
    @Query('status') status?: string,
    @Query('exam_type') examType?: string,
  ) {
    const filters = { patient_id: patientId, doctor_id: doctorId, lab_technician_id: labTechnicianId, status, exam_type: examType };
    return await this.examsService.findAll(page || 1, limit || 10, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca os detalhes de um exame específico' })
  @Roles(RoleEnum.ADMIN, RoleEnum.DOCTOR, RoleEnum.NURSE, RoleEnum.LAB_TECHNICIAN)
  async findOne(@Param('id') id: string) {
    return await this.examsService.findOne(id);
  }

  @Put(':id/result')
  @ApiOperation({ summary: 'Insere o laudo e atualiza o status do exame (Apenas Técnicos)' })
  @Roles(RoleEnum.LAB_TECHNICIAN, RoleEnum.ADMIN)

  async updateResult(
    @Param('id') id: string,
    @Body(new YupValidationPipe(updateExamResultSchema)) updateExamResultDto: UpdateExamResultDto,
    @CurrentUser() user: ICurrentUser,
  ) {
    return await this.examsService.updateResult(id, user.id, updateExamResultDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancela/Remove um pedido de exame (Soft Delete)' })
  @Roles(RoleEnum.ADMIN, RoleEnum.DOCTOR)

  async remove(@Param('id') id: string) {
    await this.examsService.remove(id);
    return { message: 'Exame removido com sucesso.' };
  }

  @Post(':id/upload')
  @ApiOperation({ summary: 'Faz o upload do laudo para a nuvem (Apenas Técnicos)' })
  @Roles(RoleEnum.LAB_TECHNICIAN, RoleEnum.ADMIN)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'Arquivo PDF, PNG ou JPG (Max: 5MB)' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(pdf|jpeg|png)$/)) {
        return cb(new BadRequestException('Apenas arquivos PDF, PNG e JPEG são permitidos!'), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 }
  }))
  async uploadFile(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: ICurrentUser,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado.');
    }

    return await this.examsService.uploadResultFile(id, user.id, file);
  }
}