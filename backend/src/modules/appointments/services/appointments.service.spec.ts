import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppointmentsService } from './appointments.service';
import { Appointment } from '../entities/appointment.entity';
import { PatientsService } from '../../patients/services/patients.service';
import { UsersService } from '../../users/services/users.service';
import { AppointmentStatusEnum } from '../enums/appointment-status.enum';
import { AppointmentCompletedEvent } from '../../billing/domain-events/appointment-completed.event';
import { Sequelize } from 'sequelize-typescript';

const mockTransaction = {
  commit: jest.fn(),
  rollback: jest.fn(),
};

const mockSequelize = {
  transaction: jest.fn().mockResolvedValue(mockTransaction),
};

const makeAppointment = (status: AppointmentStatusEnum) =>
  ({
    id: 'appt-1',
    patient_id: 'patient-1',
    doctor_id: 'doctor-1',
    appointment_type: 'CONSULTA_ROTINA',
    appointment_date: new Date('2026-06-15T10:00:00Z'),
    duration_minutes: 40,
    status,
    update: jest.fn().mockImplementation(function (data) {
      return Promise.resolve({ ...this, ...data });
    }),
  } as unknown as Appointment);

const mockModel = {
  findByPk: jest.fn(),
  findOne: jest.fn(),
};

const mockEventEmitter = { emit: jest.fn() };
const mockPatientsService = { findOne: jest.fn() };
const mockUsersService = { findOne: jest.fn() };

describe('AppointmentsService — completion event', () => {
  let service: AppointmentsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: getModelToken(Appointment), useValue: mockModel },
        { provide: Sequelize, useValue: mockSequelize },
        { provide: PatientsService, useValue: mockPatientsService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
  });

  it('emits appointment.completed when transitioning IN_PROGRESS → COMPLETED', async () => {
    const appointment = makeAppointment(AppointmentStatusEnum.IN_PROGRESS);
    const updated = {
      ...appointment,
      status: AppointmentStatusEnum.COMPLETED,
      id: 'appt-1',
      patient_id: 'patient-1',
      doctor_id: 'doctor-1',
      appointment_type: 'CONSULTA_ROTINA',
      appointment_date: new Date('2026-06-15T10:00:00Z'),
    };
    appointment.update = jest.fn().mockResolvedValue(updated);
    mockModel.findByPk.mockResolvedValue(appointment);
    mockModel.findOne.mockResolvedValue(null);

    await service.update('appt-1', { status: AppointmentStatusEnum.COMPLETED });

    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      'appointment.completed',
      expect.any(AppointmentCompletedEvent),
    );
    const emittedEvent: AppointmentCompletedEvent = mockEventEmitter.emit.mock.calls[0][1];
    expect(emittedEvent.appointmentId).toBe('appt-1');
    expect(emittedEvent.patientId).toBe('patient-1');
  });

  it('does NOT emit for non-completion transitions', async () => {
    const appointment = makeAppointment(AppointmentStatusEnum.CONFIRMED);
    const updated = { ...appointment, status: AppointmentStatusEnum.WAITING };
    appointment.update = jest.fn().mockResolvedValue(updated);
    mockModel.findByPk.mockResolvedValue(appointment);
    mockModel.findOne.mockResolvedValue(null);

    await service.update('appt-1', { status: AppointmentStatusEnum.WAITING });

    expect(mockEventEmitter.emit).not.toHaveBeenCalled();
  });

  it('does NOT emit appointment.arrived (event was retired)', async () => {
    const appointment = makeAppointment(AppointmentStatusEnum.CONFIRMED);
    const updated = { ...appointment, status: AppointmentStatusEnum.WAITING };
    appointment.update = jest.fn().mockResolvedValue(updated);
    mockModel.findByPk.mockResolvedValue(appointment);
    mockModel.findOne.mockResolvedValue(null);

    await service.update('appt-1', { status: AppointmentStatusEnum.WAITING });

    const arrivedCall = mockEventEmitter.emit.mock.calls.find(
      ([event]) => event === 'appointment.arrived',
    );
    expect(arrivedCall).toBeUndefined();
  });
});
