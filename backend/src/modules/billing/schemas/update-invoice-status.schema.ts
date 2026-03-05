import * as yup from 'yup';
import { InvoiceStatusEnum } from '../enums/invoice-status.enum';

export const updateInvoiceStatusSchema = yup.object().shape({
  status: yup.string()
    .oneOf(Object.values(InvoiceStatusEnum), 'Status inválido')
    .required('O status é obrigatório para dar baixa na fatura'),
  paid_at: yup.date().nullable().typeError('Data de pagamento inválida'),
  notes: yup.string().nullable(),
});