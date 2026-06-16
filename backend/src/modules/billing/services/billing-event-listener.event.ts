import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { BillingService } from './billing.service';
import { PriceCatalogService } from './price-catalog.service';
import { PatientsService } from '../../patients/services/patients.service';
import { AppointmentCompletedEvent } from '../domain-events/appointment-completed.event';
import { ExamCompletedEvent } from '../domain-events/exam-completed.event';
import { TenantContextService } from '../../../core/tenant/tenant-context.service';

@Injectable()
export class BillingEventListenerService {
  private readonly logger = new Logger(BillingEventListenerService.name);

  constructor(
    private readonly billingService:      BillingService,
    private readonly priceCatalogService: PriceCatalogService,
    private readonly patientsService:     PatientsService,
    private readonly tenantContext:       TenantContextService,
  ) {}

  @OnEvent('appointment.completed', { async: true })
  async handleAppointmentCompleted(event: AppointmentCompletedEvent): Promise<void> {
    await this.tenantContext.run({ clinicId: event.clinicId, isSuperAdmin: false }, async () => {
      try {
        const alreadyBilled = await this.billingService.hasActiveInvoiceForAppointment(event.appointmentId);
        if (alreadyBilled) {
          this.logger.warn(
            `[Billing] Fatura ativa já existe para appointment ${event.appointmentId} — auto-criação ignorada.`,
          );
          return;
        }

        const patient      = await this.patientsService.findOne(event.patientId);
        const hasInsurance = !!(patient.insurance_provider && patient.insurance_number);

        const { amount, paymentMethod, dueDays } = await this.priceCatalogService.resolve(
          'APPOINTMENT',
          event.appointmentType,
          hasInsurance,
        );

        const effectiveDueDays = dueDays > 0 ? dueDays : 3;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + effectiveDueDays);
        dueDate.setHours(23, 59, 59, 999);

        await this.billingService.create({
          patient_id:     event.patientId,
          appointment_id: event.appointmentId,
          amount,
          payment_method: paymentMethod,
          due_date:       dueDate,
          notes: `Fatura gerada automaticamente — ${event.appointmentType ?? 'consulta'} concluída em ${new Date().toLocaleDateString('pt-BR')}.`,
        });

        this.logger.log(
          `[Billing] ✓ Fatura criada | appointment ${event.appointmentId} ` +
          `| paciente ${event.patientId} | R$ ${amount.toFixed(2)} | ${paymentMethod}`,
        );
      } catch (err) {
        this.logger.error(
          `[Billing] ✗ Falha ao criar fatura para appointment ${event.appointmentId}`,
          err instanceof Error ? err.stack : String(err),
        );
      }
    });
  }

  @OnEvent('exam.completed', { async: true })
  async handleExamCompleted(event: ExamCompletedEvent): Promise<void> {
    await this.tenantContext.run({ clinicId: event.clinicId, isSuperAdmin: false }, async () => {
      try {
        const patient      = await this.patientsService.findOne(event.patientId);
        const hasInsurance = !!(patient.insurance_provider && patient.insurance_number);

        const { amount, paymentMethod, dueDays } = await this.priceCatalogService.resolve(
          'EXAM',
          event.examType,
          hasInsurance,
        );

        const effectiveDueDays = dueDays > 0 ? dueDays : 3;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + effectiveDueDays);
        dueDate.setHours(23, 59, 59, 999);

        await this.billingService.create({
          patient_id:     event.patientId,
          exam_id:        event.examId,
          amount,
          payment_method: paymentMethod,
          due_date:       dueDate,
          notes: `Fatura gerada automaticamente — ${event.examType} concluído em ${new Date().toLocaleDateString('pt-BR')}.`,
        });

        this.logger.log(
          `[Billing] ✓ Fatura criada | exam ${event.examId} ` +
          `| paciente ${event.patientId} | R$ ${amount.toFixed(2)} | ${paymentMethod}`,
        );
      } catch (err) {
        this.logger.error(
          `[Billing] ✗ Falha ao criar fatura para exam ${event.examId}`,
          err instanceof Error ? err.stack : String(err),
        );
      }
    });
  }
}
