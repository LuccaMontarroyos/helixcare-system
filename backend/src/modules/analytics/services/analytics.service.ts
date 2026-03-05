import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Op } from 'sequelize';
import { Invoice } from '../../billing/entities/invoice.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { Exam } from '../../exams/entities/exam.entity';
import { InvoiceStatusEnum } from '../../billing/enums/invoice-status.enum';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Invoice) private invoiceModel: typeof Invoice,
    @InjectModel(Appointment) private appointmentModel: typeof Appointment,
    @InjectModel(Exam) private examModel: typeof Exam,
    private sequelize: Sequelize,
  ) {}

  private getDateRange(startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);
    return { start, end };
  }

  async getFinancialSummary(startDate?: string, endDate?: string) {
    const { start, end } = this.getDateRange(startDate, endDate);

    const totalRevenue = await this.invoiceModel.sum('amount', {
      where: {
        status: InvoiceStatusEnum.PAID,
        paid_at: { [Op.between]: [start, end] },
      },
    });

    const totalPending = await this.invoiceModel.sum('amount', {
      where: {
        status: { [Op.in]: [InvoiceStatusEnum.PENDING, InvoiceStatusEnum.BILLED_TO_INSURANCE] },
        due_date: { [Op.between]: [start, end] },
      },
    });

    const invoiceCount = await this.invoiceModel.count({
      where: { created_at: { [Op.between]: [start, end] } },
    });

    const paid = Number(totalRevenue) || 0;
    const pending = Number(totalPending) || 0;
    const totalSales = paid + pending;

    return {
      period: { start, end },
      revenue_paid: paid,
      revenue_pending: pending,
      total_invoices_generated: invoiceCount,
      average_ticket: invoiceCount > 0 ? (totalSales / invoiceCount) : 0,
    };
  }

  async getClinicalProductivity(startDate?: string, endDate?: string) {
    const { start, end } = this.getDateRange(startDate, endDate);

    const appointmentsByStatus = await this.appointmentModel.findAll({
      attributes: [
        'status',
        [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'count'],
      ],
      where: {
        appointment_date: { [Op.between]: [start, end] },
      },
      group: ['status'],
      raw: true,
    });

    return {
      period: { start, end },
      appointments_by_status: appointmentsByStatus,
    };
  }

  async getExamsFlow(startDate?: string, endDate?: string) {
    const { start, end } = this.getDateRange(startDate, endDate);

    const examsByStatus = await this.examModel.findAll({
      attributes: [
        'status',
        [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'count'],
      ],
      where: {
        created_at: { [Op.between]: [start, end] },
      },
      group: ['status'],
      raw: true,
    });

    return {
      period: { start, end },
      exams_by_status: examsByStatus,
    };
  }
}