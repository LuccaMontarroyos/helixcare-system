import * as yup from 'yup';

export const analyticsQuerySchema = yup.object().shape({
  start_date: yup.date()
    .typeError('Data inicial inválida')
    .nullable(),
  end_date: yup.date()
    .typeError('Data final inválida')
    .min(yup.ref('start_date'), 'A data final não pode ser anterior à data inicial')
    .nullable(),
});