import { Body, Controller, Get, Param, Patch, Post, UseGuards, UsePipes } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ClinicsService } from '../services/clinics.service';
import type { CreateClinicDto } from '../dto/create-clinic.dto';
import { createClinicSchema } from '../schemas/create-clinic.schema';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/guards/roles.guard';
import { Roles } from '../../../core/decorators/roles.decorator';
import { RoleEnum } from '../../roles/enums/roles.enum';
import { YupValidationPipe } from '../../../core/pipes/yup-validation.pipe';

@ApiTags('Clinics (Platform Admin)')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.SUPER_ADMIN)
@Controller('clinics')
export class ClinicsController {
  constructor(private readonly clinicsService: ClinicsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma nova clínica e seu primeiro administrador' })
  @UsePipes(new YupValidationPipe(createClinicSchema))
  async create(@Body() dto: CreateClinicDto) {
    return await this.clinicsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as clínicas' })
  async findAll() {
    return await this.clinicsService.findAll();
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Desativa uma clínica (bloqueia login dos seus usuários)' })
  async deactivate(@Param('id') id: string) {
    return await this.clinicsService.deactivate(id);
  }
}
