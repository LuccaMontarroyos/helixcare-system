import { BadRequestException } from '@nestjs/common';
import { AppointmentStatusEnum } from '../enums/appointment-status.enum';

const VALID_TRANSITIONS: Partial<Record<AppointmentStatusEnum, AppointmentStatusEnum[]>> = {
  [AppointmentStatusEnum.SCHEDULED]: [AppointmentStatusEnum.CONFIRMED, AppointmentStatusEnum.WAITING, AppointmentStatusEnum.IN_PROGRESS, AppointmentStatusEnum.RESCHEDULED, AppointmentStatusEnum.CANCELED],
  [AppointmentStatusEnum.CONFIRMED]: [AppointmentStatusEnum.WAITING, AppointmentStatusEnum.IN_PROGRESS, AppointmentStatusEnum.NO_SHOW, AppointmentStatusEnum.RESCHEDULED, AppointmentStatusEnum.CANCELED],
  [AppointmentStatusEnum.WAITING]: [AppointmentStatusEnum.IN_PROGRESS, AppointmentStatusEnum.CANCELED],
  [AppointmentStatusEnum.IN_PROGRESS]: [AppointmentStatusEnum.COMPLETED, AppointmentStatusEnum.CANCELED],
  [AppointmentStatusEnum.COMPLETED]: [],
  [AppointmentStatusEnum.NO_SHOW]: [],
  [AppointmentStatusEnum.RESCHEDULED]: [],
  [AppointmentStatusEnum.CANCELED]: [],
};

export const NON_REMOVABLE_STATUSES = [
  AppointmentStatusEnum.COMPLETED,
  AppointmentStatusEnum.IN_PROGRESS,
  AppointmentStatusEnum.NO_SHOW,
];

export function validateStatusTransition(current: AppointmentStatusEnum, next: AppointmentStatusEnum): void {
  const allowed = VALID_TRANSITIONS[current];

  if (!allowed || allowed.length === 0) {
    throw new BadRequestException(`Consultas com status "${current}" já foram finalizadas e não podem ser alteradas.`);
  }

  if (!allowed.includes(next)) {
    throw new BadRequestException(`Transição inválida: Não é possível mudar de "${current}" para "${next}". Permitidos: ${allowed.join(', ')}.`);
  }
}