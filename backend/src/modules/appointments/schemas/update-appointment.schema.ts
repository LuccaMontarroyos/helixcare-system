import * as yup from 'yup';
import { AppointmentStatusEnum } from '../enums/appointment-status.enum';
import { AppointmentTypeEnum } from '../enums/appointment-type.enum';

export const updateAppointmentSchema = yup.object().shape({
    patient_id: yup.string().uuid('ID do paciente inválido').nullable(),
    doctor_id: yup.string().uuid('ID do médico inválido').nullable(),
    appointment_date: yup.date()
        .nullable(),
    appointment_type: yup.string().oneOf(Object.values(AppointmentTypeEnum)).nullable(),
    duration_minutes: yup.number().positive().nullable(),
    notes: yup.string().nullable(),
    status: yup.string().oneOf(Object.values(AppointmentStatusEnum)).nullable(),
});
