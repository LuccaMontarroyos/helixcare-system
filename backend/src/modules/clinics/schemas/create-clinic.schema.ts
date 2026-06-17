import * as yup from 'yup';

export const createClinicSchema = yup.object({
  name: yup.string().trim().min(2).max(150).required(),
  first_admin_name: yup.string().trim().min(2).max(150).required(),
  first_admin_email: yup.string().trim().email().required(),
  first_admin_password: yup.string().min(8).required(),
});
