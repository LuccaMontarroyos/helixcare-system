import { Controller, Post, Get, Put, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BillingService } from '../services/billing.service';
import { CreateInvoiceDto } from '../dtos/create-invoice.dto';
import { UpdateInvoiceStatusDto } from '../dtos/update-invoice-status.dto';
import { createInvoiceSchema } from '../schemas/create-invoice.schema';
import { updateInvoiceStatusSchema } from '../schemas/update-invoice-status.schema';

import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/guards/roles.guard';
import { Roles } from '../../../core/decorators/roles.decorator';
import { RoleEnum } from '../../roles/enums/roles.enum';
import { YupValidationPipe } from '../../../core/pipes/yup-validation.pipe';

@ApiTags('Billing (Faturamento e Invoices)')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.ADMIN, RoleEnum.RECEPTIONIST) 
@Controller('invoices')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post()
  @ApiOperation({ summary: 'Gera uma nova cobrança/fatura para um paciente' })
  @ApiResponse({ status: 201, description: 'Fatura criada com sucesso.' })
  async create(
    @Body(new YupValidationPipe(createInvoiceSchema)) createInvoiceDto: CreateInvoiceDto,
  ) {
    return await this.billingService.create(createInvoiceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista faturas com filtros (Fluxo de Caixa)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'patient_id', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'PAID', 'BILLED_TO_INSURANCE', 'CANCELED', 'REFUNDED'] })
  @ApiQuery({ name: 'payment_method', required: false, enum: ['CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'CASH', 'HEALTH_INSURANCE'] })
  @ApiQuery({ name: 'start_date', required: false, type: String, description: 'Vencimento inicial (YYYY-MM-DD)' })
  @ApiQuery({ name: 'end_date', required: false, type: String, description: 'Vencimento final (YYYY-MM-DD)' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('patient_id') patientId?: string,
    @Query('status') status?: string,
    @Query('payment_method') paymentMethod?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const filters = { patient_id: patientId, status, payment_method: paymentMethod, start_date: startDate, end_date: endDate };
    return await this.billingService.findAll(page || 1, limit || 10, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca os detalhes de uma fatura específica' })
  async findOne(@Param('id') id: string) {
    return await this.billingService.findOne(id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Dá baixa em uma fatura ou altera seu status' })
  async updateStatus(
    @Param('id') id: string,
    @Body(new YupValidationPipe(updateInvoiceStatusSchema)) updateInvoiceStatusDto: UpdateInvoiceStatusDto,
  ) {
    return await this.billingService.updateStatus(id, updateInvoiceStatusDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancela/Soft Delete uma fatura' })
  @Roles(RoleEnum.ADMIN)
  async remove(@Param('id') id: string) {
    await this.billingService.remove(id);
    return { message: 'Fatura cancelada e removida com sucesso.' };
  }
}