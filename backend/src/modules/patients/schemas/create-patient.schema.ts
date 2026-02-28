import * as yup from 'yup';

export const createPatientSchema = yup.object().shape({
  name: yup.string().required('O nome completo é obrigatório').min(3),
  cpf: yup.string().matches(/^\d{11}$/, 'O CPF deve conter exatamente 11 números').required('CPF é obrigatório'),
  birth_date: yup.date().required('A data de nascimento é obrigatória'),
  gender: yup.string().nullable(),
  blood_type: yup.string().max(3).nullable(),
  allergies: yup.string().nullable(),
  contact_info: yup.object().shape({
    phone: yup.string().required('O telefone de contato é obrigatório'),
    emergency_contact: yup.string().required('O nome do contato de emergência é obrigatório'),
    emergency_phone: yup.string().required('O telefone de emergência é obrigatório'),
  }).required('As informações de contato são obrigatórias'),
  address: yup.object().shape({
    zip_code: yup.string(),
    street: yup.string(),
    number: yup.string(),
    city: yup.string(),
    state: yup.string().max(2),
  }).nullable(),
});