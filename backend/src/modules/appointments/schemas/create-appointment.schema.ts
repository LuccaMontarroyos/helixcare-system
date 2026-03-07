import * as yup from 'yup';

export const createAppointmentSchema = yup.object().shape({
  patient_id: yup.string().uuid('ID do paciente inválido').required('O ID do paciente é obrigatório'),
  doctor_id: yup.string().uuid('ID do médico inválido').required('O ID do médico é obrigatório'),
  appointment_date: yup.date()
    .min(new Date(), 'Não é possível agendar uma consulta no passado')
    .required('A data e hora do agendamento são obrigatórias'),
    
  notes: yup.string().nullable(),
});