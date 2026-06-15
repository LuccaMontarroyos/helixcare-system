import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { CreationAttributes, Op } from 'sequelize';
import { Invoice } from '../entities/invoice.entity';
import { CreateInvoiceDto } from '../dtos/create-invoice.dto';
import { UpdateInvoiceStatusDto } from '../dtos/update-invoice-status.dto';
import { GatewayWebhookDto } from '../dtos/gateway-webhook.dto';
import { InvoiceStatusEnum } from '../enums/invoice-status.enum';
import { PaymentMethodEnum } from '../enums/payment-method.enum';
import { BillingPaymentGatewayService } from './billing-payment-gateway.service';

import { PatientsService } from '../../patients/services/patients.service';
import { AppointmentsService } from '../../appointments/services/appointments.service';
import { ExamsService } from '../../exams/services/exams.service';
import { Patient } from '../../patients/entities/patient.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { Exam } from '../../exams/entities/exam.entity';

@Injectable()
export class BillingService {
  constructor(
    @InjectModel(Invoice)
    private invoiceModel: typeof Invoice,
    private sequelize: Sequelize,
    private patientsService: PatientsService,
    private appointmentsService: AppointmentsService,
    private examsService: ExamsService,
    private billingPaymentGatewayService: BillingPaymentGatewayService,
  ) {}

  async create(dto: CreateInvoiceDto): Promise<Invoice> {
    const patient = await this.patientsService.findOne(dto.patient_id);

    if (dto.payment_method === PaymentMethodEnum.HEALTH_INSURANCE) {
      if (!patient.insurance_provider || !patient.insurance_number) {
        throw new BadRequestException('Este paciente não possui os dados de Plano de Saúde cadastrados em seu perfil.');
      }
    }

    if (dto.appointment_id) {
      await this.appointmentsService.findOne(dto.appointment_id);
    }
    if (dto.exam_id) {
      await this.examsService.findOne(dto.exam_id);
    }

    const transaction = await this.sequelize.transaction();
    try {
      const invoiceData = {
        ...dto,
        status: dto.payment_method === PaymentMethodEnum.HEALTH_INSURANCE 
          ? InvoiceStatusEnum.BILLED_TO_INSURANCE 
          : InvoiceStatusEnum.PENDING,
      };

      const invoice = await this.invoiceModel.create(
        invoiceData as CreationAttributes<Invoice>,
        { transaction }
      );
      
      await transaction.commit();
      return invoice;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findAll(page: number = 1, limit: number = 10, filters: any = {}) {
    const offset = (page - 1) * limit;
    const whereClause: any = {};

    if (filters.patient_id) whereClause.patient_id = filters.patient_id;
    if (filters.status) whereClause.status = filters.status;
    if (filters.payment_method) whereClause.payment_method = filters.payment_method;
    
    if (filters.start_date && filters.end_date) {
      whereClause.due_date = {
        [Op.between]: [new Date(filters.start_date), new Date(filters.end_date)],
      };
    }

    const { rows, count } = await this.invoiceModel.findAndCountAll({
      where: whereClause,
      include: [
        { model: Patient, attributes: ['id', 'name', 'cpf', 'insurance_provider', 'insurance_number'] },
        { model: Appointment, attributes: ['id', 'appointment_date', 'status'] },
        { model: Exam, attributes: ['id', 'exam_type', 'status'] },
        
      ],
      order: [['due_date', 'ASC'], ['created_at', 'DESC']],
      limit,
      offset,
    });

    return { data: rows, total: count, current_page: page, total_pages: Math.ceil(count / limit) };
  }

  async findOne(id: string): Promise<Invoice> {
    const invoice = await this.invoiceModel.findByPk(id, {
      include: [
        { model: Patient, attributes: ['id', 'name', 'cpf', 'insurance_provider', 'insurance_number'] }
      ]
    });
    
    if (!invoice) throw new NotFoundException('Fatura não encontrada.');
    return invoice;
  }

  async updateStatus(id: string, dto: UpdateInvoiceStatusDto): Promise<Invoice> {
    const invoice = await this.findOne(id);

    if (invoice.status === InvoiceStatusEnum.CANCELED) {
      throw new BadRequestException('Faturas canceladas não podem sofrer alterações.');
    }

    const transaction = await this.sequelize.transaction();
    try {
      const updatedInvoice = await invoice.update(
        {
          status: dto.status,
          notes: dto.notes !== undefined ? dto.notes : invoice.notes,
          paid_at: dto.status === InvoiceStatusEnum.PAID 
            ? (dto.paid_at || new Date()) 
            : invoice.paid_at,
        } as Partial<CreationAttributes<Invoice>>,
        { transaction }
      );
      
      await transaction.commit();
      return updatedInvoice;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const invoice = await this.findOne(id);
    
    if (invoice.status === InvoiceStatusEnum.PAID) {
      throw new ForbiddenException('Não é permitido excluir uma fatura já paga. Utilize a alteração de status para REFUNDED (Estornado) e insira uma nota.');
    }

    await invoice.update({ status: InvoiceStatusEnum.CANCELED });
    await invoice.destroy();
  }

  async createCheckoutForInvoice(id: string, forceRefresh: boolean = false): Promise<Invoice> {
    const invoice = await this.findOne(id);

    if (
      !forceRefresh &&
      invoice.checkout_url &&
      invoice.provider_checkout_session_id &&
      invoice.status === InvoiceStatusEnum.PENDING
    ) {
      return invoice;
    }

    const checkout = this.billingPaymentGatewayService.createCheckout(invoice);

    await invoice.update({
      payment_provider: checkout.provider,
      provider_checkout_session_id: checkout.providerCheckoutSessionId,
      checkout_url: checkout.checkoutUrl,
    });

    return await this.findOne(id);
  }

  async handleGatewayWebhook(payload: GatewayWebhookDto, signature?: string) {
    this.billingPaymentGatewayService.verifyWebhookSignature(
      payload as unknown as Record<string, unknown>,
      signature,
    );

    const invoice = await this.findOne(payload.data.invoice_id);
    const incomingStatus = String(payload.data.status || '').toUpperCase();
    const isPaidEvent =
      incomingStatus === InvoiceStatusEnum.PAID ||
      String(payload.event_type || '').toLowerCase().includes('paid');

    const alreadyProcessed =
      isPaidEvent &&
      invoice.status === InvoiceStatusEnum.PAID &&
      (!!payload.data.provider_payment_id
        ? invoice.provider_payment_id === payload.data.provider_payment_id
        : true);

    if (alreadyProcessed) {
      return {
        ok: true,
        already_processed: true,
        invoice_id: invoice.id,
      };
    }

    const updates: Partial<CreationAttributes<Invoice>> = {
      payment_provider: payload.provider || invoice.payment_provider,
      provider_payment_id: payload.data.provider_payment_id || invoice.provider_payment_id,
      provider_checkout_session_id:
        payload.data.provider_checkout_session_id || invoice.provider_checkout_session_id,
      notes: this.appendWebhookNote(invoice.notes, payload.event_id),
    };

    if (isPaidEvent) {
      updates.status = InvoiceStatusEnum.PAID;
      updates.paid_at = invoice.paid_at || new Date();
    }

    await invoice.update(updates);

    return {
      ok: true,
      already_processed: false,
      invoice_id: invoice.id,
      status: updates.status || invoice.status,
    };
  }

  private appendWebhookNote(previousNotes: string | null, eventId: string): string {
    const marker = `[gateway-webhook:${eventId}]`;
    const notes = previousNotes || '';
    if (notes.includes(marker)) return notes;

    const line = `\n${marker} ${new Date().toISOString()}`;
    return `${notes}${line}`.trim();
  }
}