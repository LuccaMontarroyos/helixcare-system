import * as yup from 'yup';

export const updatePatientSchema = yup.object().shape({
  name: yup.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  cpf: yup.string().matches(/^\d{11}$/, 'O CPF deve conter exatamente 11 números'),
  birth_date: yup.date(),
  gender: yup.string().nullable(),
  blood_type: yup.string().max(3).nullable(),
  allergies: yup.string().nullable(),
  contact_info: yup.object().shape({
    phone: yup.string(),
    emergency_contact: yup.string(),
    emergency_phone: yup.string(),
  }).nullable(),
  address: yup.object().shape({
    zip_code: yup.string(),
    street: yup.string(),
    number: yup.string(),
    city: yup.string(),
    state: yup.string().max(2),
  }).nullable(),
  
  insurance_provider: yup.string().nullable(),
  insurance_number: yup.string().nullable().when('insurance_provider', {
    is: (val: string) => val && val.length > 0,
    then: (schema) => schema.required('O número da carteirinha é obrigatório quando o plano de saúde é informado.'),
    otherwise: (schema) => schema.nullable(),
  }),
});