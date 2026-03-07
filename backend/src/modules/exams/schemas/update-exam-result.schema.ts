import * as yup from 'yup';
import { ExamStatusEnum } from '../enums/exam-status.enum';

export const updateExamResultSchema = yup.object().shape({
  status: yup.string().oneOf(Object.values(ExamStatusEnum)).required('O status é obrigatório para a atualização'),
  result_text: yup.string().nullable(),
});