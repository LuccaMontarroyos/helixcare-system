import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { BillingService } from './billing.service';
import { Invoice } from '../entities/invoice.entity';
import { InvoiceStatusEnum } from '../enums/invoice-status.enum';
import { PatientsService } from '../../patients/services/patients.service';
import { AppointmentsService } from '../../appointments/services/appointments.service';
import { ExamsService } from '../../exams/services/exams.service';
import { BillingPaymentGatewayService } from './billing-payment-gateway.service';
import { Sequelize } from 'sequelize-typescript';
import { Op } from 'sequelize';

const mockInvoiceModel = {
  findOne: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn(),
  findAndCountAll: jest.fn(),
};

const mockSequelize = {
  transaction: jest.fn().mockResolvedValue({ commit: jest.fn(), rollback: jest.fn() }),
};

describe('BillingService.hasActiveInvoiceForAppointment', () => {
  let service: BillingService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: getModelToken(Invoice), useValue: mockInvoiceModel },
        { provide: Sequelize, useValue: mockSequelize },
        { provide: PatientsService, useValue: { findOne: jest.fn() } },
        { provide: AppointmentsService, useValue: { findOne: jest.fn() } },
        { provide: ExamsService, useValue: { findOne: jest.fn() } },
        { provide: BillingPaymentGatewayService, useValue: {} },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
  });

  it('returns true when a non-canceled invoice exists for the appointment', async () => {
    mockInvoiceModel.findOne.mockResolvedValue({ id: 'inv-1', status: InvoiceStatusEnum.PENDING });

    const result = await service.hasActiveInvoiceForAppointment('appt-1');

    expect(result).toBe(true);
    expect(mockInvoiceModel.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ appointment_id: 'appt-1' }),
      }),
    );
  });

  it('returns false when no invoice exists for the appointment', async () => {
    mockInvoiceModel.findOne.mockResolvedValue(null);

    const result = await service.hasActiveInvoiceForAppointment('appt-1');

    expect(result).toBe(false);
  });

  it('returns false when only a CANCELED invoice exists (excluded by guard)', async () => {
    mockInvoiceModel.findOne.mockResolvedValue(null);

    await service.hasActiveInvoiceForAppointment('appt-1');

    const whereArg = mockInvoiceModel.findOne.mock.calls[0][0].where;
    expect(whereArg.status).toEqual({ [Op.ne]: InvoiceStatusEnum.CANCELED });
  });
});
