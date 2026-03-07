import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from '../services/analytics.service';
import { AnalyticsQueryDto } from '../dto/analytics-query.dto';
import { analyticsQuerySchema } from '../schemas/analytics-query.schema';

import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/guards/roles.guard';
import { Roles } from '../../../core/decorators/roles.decorator';
import { RoleEnum } from '../../roles/enums/roles.enum';
import { YupValidationPipe } from '../../../core/pipes/yup-validation.pipe';

@ApiTags('Analytics (Dashboards e Relatórios)')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.ADMIN)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('finance')
  @ApiOperation({ summary: 'Retorna o resumo financeiro da clínica (Faturamento)' })
  async getFinanceSummary(
    @Query(new YupValidationPipe(analyticsQuerySchema)) query: AnalyticsQueryDto,
  ) {
    return await this.analyticsService.getFinancialSummary(query.start_date, query.end_date);
  }

  @Get('clinical')
  @ApiOperation({ summary: 'Retorna o volume de consultas agrupado por status' })
  async getClinicalProductivity(
    @Query(new YupValidationPipe(analyticsQuerySchema)) query: AnalyticsQueryDto,
  ) {
    return await this.analyticsService.getClinicalProductivity(query.start_date, query.end_date);
  }

  @Get('exams')
  @ApiOperation({ summary: 'Retorna o fluxo e gargalos do laboratório' })
  async getExamsFlow(
    @Query(new YupValidationPipe(analyticsQuerySchema)) query: AnalyticsQueryDto,
  ) {
    return await this.analyticsService.getExamsFlow(query.start_date, query.end_date);
  }
}