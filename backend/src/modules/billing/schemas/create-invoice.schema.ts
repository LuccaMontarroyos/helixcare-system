import * as yup from 'yup';
import { PaymentMethodEnum } from '../enums/payment-method.enum';

export const createInvoiceSchema = yup.object().shape({
  patient_id: yup.string().uuid('ID do paciente inválido').required('O paciente é obrigatório'),
  appointment_id: yup.string().uuid('ID do agendamento inválido').nullable(),
  exam_id: yup.string().uuid('ID do exame inválido').nullable(),
  amount: yup.number()
    .typeError('O valor deve ser numérico')
    .positive('O valor da fatura deve ser maior que zero')
    .required('O valor é obrigatório'),
  payment_method: yup.string()
    .oneOf(Object.values(PaymentMethodEnum), 'Método de pagamento inválido')
    .required('O método de pagamento é obrigatório'),
  due_date: yup.date()
    .typeError('Data de vencimento inválida')
    .required('A data de vencimento é obrigatória'),
  notes: yup.string().nullable(),
}).test(
  'at-least-one-source',
  'A fatura deve estar vinculada a uma consulta (appointment_id) ou a um exame (exam_id)',
  function (value) {
    return !!(value.appointment_id || value.exam_id);
  }
);