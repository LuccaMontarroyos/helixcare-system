import * as yup from 'yup';

export const createCheckoutSchema = yup.object().shape({
  force_refresh: yup.boolean().optional(),
});
