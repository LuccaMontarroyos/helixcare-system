import * as yup from 'yup';

export const createMedicalRecordSchema = yup.object().shape({
  patient_id: yup.string().uuid('ID do paciente inválido').required('O ID do paciente é obrigatório'),
  anamnesis: yup.string().required('A anamnese é obrigatória para o registro médico').min(10),
  diagnosis: yup.string().nullable(),
  prescription: yup.string().nullable(),
  social_history: yup.object().shape({
    is_smoker: yup.boolean().required(),
    consumes_alcohol: yup.boolean().required(),
    notes: yup.string().nullable(),
  }).nullable(),
});