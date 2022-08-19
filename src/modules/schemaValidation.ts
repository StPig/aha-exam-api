import exception from './exception';
import Joi from 'joi';

export const validate = async (
    schema: Joi.ObjectSchema,
    payload: unknown,
    options: object = {},
) => {
  const defaultOptions = {
    allowUnknown: true,
    errors: {
      wrap: {
        label: '',
      },
    },
  };
  try {
    return await schema.validateAsync(
        payload,
        Object.assign(defaultOptions, options),
    );
  } catch (err: any) {
    throw exception.badRequestError(err.code || 'BAD_REQUEST', err);
  }
};
