import * as yup from 'yup';

export const updateMedicalRecordSchema = yup.object().shape({
  patient_id: yup.string().uuid('ID do paciente inválido').nullable(),
  anamnesis: yup.string().min(10, 'A anamnese deve ter pelo menos 10 caracteres').nullable(),
  diagnosis: yup.string().nullable(),
  prescription: yup.string().nullable(),
  social_history: yup.object().shape({
    is_smoker: yup.boolean(),
    consumes_alcohol: yup.boolean(),
    notes: yup.string().nullable(),
  }).nullable(),
});