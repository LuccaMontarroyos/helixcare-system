import * as yup from 'yup';

export const gatewayWebhookSchema = yup.object().shape({
  event_id: yup.string().required('event_id é obrigatório'),
  event_type: yup.string().required('event_type é obrigatório'),
  provider: yup.string().required('provider é obrigatório'),
  occurred_at: yup.string().optional(),
  data: yup
    .object()
    .shape({
      invoice_id: yup.string().uuid('invoice_id inválido').required('invoice_id é obrigatório'),
      provider_payment_id: yup.string().optional(),
      provider_checkout_session_id: yup.string().optional(),
      status: yup.string().optional(),
    })
    .required('data é obrigatório'),
});
