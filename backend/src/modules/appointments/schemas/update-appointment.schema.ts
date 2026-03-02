import * as yup from 'yup';
import { AppointmentStatusEnum } from '../enums/appointment-status.enum';

export const updateAppointmentSchema = yup.object().shape({
    patient_id: yup.string().uuid('ID do paciente inválido').nullable(),
    doctor_id: yup.string().uuid('ID do médico inválido').nullable(),
    appointment_date: yup.date()
        .nullable(),
    notes: yup.string().nullable(),
    status: yup.string().oneOf(Object.values(AppointmentStatusEnum)).nullable(),
});