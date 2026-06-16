import { Test, TestingModule } from '@nestjs/testing';
import { BillingEventListenerService } from './billing-event-listener.event';
import { BillingService } from './billing.service';
import { PriceCatalogService } from './price-catalog.service';
import { PatientsService } from '../../patients/services/patients.service';
import { AppointmentCompletedEvent } from '../domain-events/appointment-completed.event';

const mockBillingService = {
  hasActiveInvoiceForAppointment: jest.fn(),
  create: jest.fn(),
};

const mockPriceCatalogService = {
  resolve: jest.fn(),
};

const mockPatientsService = {
  findOne: jest.fn(),
};

const makeEvent = (): AppointmentCompletedEvent =>
  new AppointmentCompletedEvent(
    'appt-1',
    'patient-1',
    'doctor-1',
    'CONSULTA_ROTINA',
    new Date('2026-06-15T10:00:00Z'),
  );

describe('BillingEventListenerService', () => {
  let service: BillingEventListenerService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingEventListenerService,
        { provide: BillingService, useValue: mockBillingService },
        { provide: PriceCatalogService, useValue: mockPriceCatalogService },
        { provide: PatientsService, useValue: mockPatientsService },
      ],
    }).compile();

    service = module.get<BillingEventListenerService>(BillingEventListenerService);
  });

  it('creates an invoice on appointment.completed', async () => {
    mockBillingService.hasActiveInvoiceForAppointment.mockResolvedValue(false);
    mockPatientsService.findOne.mockResolvedValue({ insurance_provider: null, insurance_number: null });
    mockPriceCatalogService.resolve.mockResolvedValue({ amount: 200, paymentMethod: 'PIX', dueDays: 5 });
    mockBillingService.create.mockResolvedValue({});

    await service.handleAppointmentCompleted(makeEvent());

    expect(mockBillingService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        patient_id: 'patient-1',
        appointment_id: 'appt-1',
        amount: 200,
        payment_method: 'PIX',
      }),
    );
  });

  it('skips auto-create when an active invoice already exists', async () => {
    mockBillingService.hasActiveInvoiceForAppointment.mockResolvedValue(true);

    await service.handleAppointmentCompleted(makeEvent());

    expect(mockBillingService.create).not.toHaveBeenCalled();
    expect(mockPatientsService.findOne).not.toHaveBeenCalled();
  });

  it('applies insurance discount path when patient has insurance', async () => {
    mockBillingService.hasActiveInvoiceForAppointment.mockResolvedValue(false);
    mockPatientsService.findOne.mockResolvedValue({
      insurance_provider: 'Unimed',
      insurance_number: '123456',
    });
    mockPriceCatalogService.resolve.mockResolvedValue({
      amount: 80,
      paymentMethod: 'HEALTH_INSURANCE',
      dueDays: 30,
    });
    mockBillingService.create.mockResolvedValue({});

    await service.handleAppointmentCompleted(makeEvent());

    expect(mockPriceCatalogService.resolve).toHaveBeenCalledWith(
      'APPOINTMENT',
      'CONSULTA_ROTINA',
      true,
    );
    expect(mockBillingService.create).toHaveBeenCalledWith(
      expect.objectContaining({ payment_method: 'HEALTH_INSURANCE', amount: 80 }),
    );
  });

  it('sets due_date based on completion time (new Date), not appointmentDate', async () => {
    mockBillingService.hasActiveInvoiceForAppointment.mockResolvedValue(false);
    mockPatientsService.findOne.mockResolvedValue({ insurance_provider: null, insurance_number: null });
    mockPriceCatalogService.resolve.mockResolvedValue({ amount: 200, paymentMethod: 'PIX', dueDays: 5 });
    mockBillingService.create.mockResolvedValue({});

    const before = new Date();
    await service.handleAppointmentCompleted(makeEvent());
    const after = new Date();

    const { due_date } = mockBillingService.create.mock.calls[0][0];
    const dueDay = new Date(due_date);
    const expectedMin = new Date(before);
    expectedMin.setDate(expectedMin.getDate() + 5);
    const expectedMax = new Date(after);
    expectedMax.setDate(expectedMax.getDate() + 5);

    expect(dueDay.getTime()).toBeGreaterThanOrEqual(expectedMin.setHours(0, 0, 0, 0));
    expect(dueDay.getTime()).toBeLessThanOrEqual(expectedMax.setHours(23, 59, 59, 999));
  });
});
