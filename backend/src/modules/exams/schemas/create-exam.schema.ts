import * as yup from 'yup';

export const createExamSchema = yup.object().shape({
  patient_id: yup.string().uuid('ID do paciente inválido').required('O ID do paciente é obrigatório'),
  exam_type: yup.string().required('O tipo de exame é obrigatório').min(3).max(150),
  observations: yup.string().nullable(),
});