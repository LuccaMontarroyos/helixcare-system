import * as yup from 'yup';
import { AppointmentTypeEnum } from '../enums/appointment-type.enum';

const validTypes = Object.values(AppointmentTypeEnum);

export const createAppointmentSchema = yup.object().shape({

  patient_id: yup
    .string()
    .uuid('ID do paciente inválido')
    .required('O ID do paciente é obrigatório'),

  doctor_id: yup
    .string()
    .uuid('ID do médico inválido')
    .required('O ID do médico é obrigatório'),

  appointment_date: yup
    .date()
    .min(new Date(), 'Não é possível agendar uma consulta no passado')
    .required('A data e hora do agendamento são obrigatórias'),

  appointment_type: yup
    .string()
    .oneOf(
      validTypes,
      `Tipo de consulta inválido. Valores aceitos: ${validTypes.join(', ')}`,
    )
    .nullable()
    .optional(),

  duration_minutes: yup
    .number()
    .integer('A duração deve ser um número inteiro de minutos')
    .min(5, 'A duração mínima é de 5 minutos')
    .max(480, 'A duração máxima é de 8 horas (480 minutos)')
    .nullable()
    .optional()
    .when('appointment_type', {
      is: AppointmentTypeEnum.OUTRO,
      then: (schema) =>
        schema
          .required('Para o tipo "Outro", a duração em minutos é obrigatória')
          .min(5, 'A duração mínima é de 5 minutos'),
      otherwise: (schema) => schema.optional(),
    }),

  notes: yup
    .string()
    .max(1000, 'As observações não podem ter mais de 1000 caracteres')
    .nullable()
    .optional(),
});