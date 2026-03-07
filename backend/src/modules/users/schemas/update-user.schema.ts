import * as yup from 'yup';

export const updateUserSchema = yup.object().shape({
  name: yup.string().min(3, 'O nome deve ter no mínimo 3 caracteres').nullable(),
  role_id: yup.string().uuid('ID de cargo inválido').nullable(),
});