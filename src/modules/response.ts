import * as express from 'express';
import httpStatus from 'http-status-codes';
import _ from 'underscore';
import exception from './exception';

/**
 * The register function.
 * @param {express.Response} resp The response.
 * @param {any} data The return data.
 */
function succ(resp: express.Response, data: any) {
  if (data) {
    resp.status(httpStatus.OK).json(data);
  } else {
    resp.status(httpStatus.OK).json();
  }
}

/**
 * The register function.
 * @param {express.Response} resp The response.
 * @param {any} err The return error.
 */
function fail(resp: express.Response, err: any) {
  if (!exception.isWebError(err)) {
    if (err instanceof Error) {
      err = exception.serverError('INTERNAL_SERVER_ERROR', err.message);
    } else if (typeof err === 'string') {
      err = exception.serverError('INTERNAL_SERVER_ERROR', err);
    } else {
      err = exception.serverError('INTERNAL_SERVER_ERROR', 'unknown error');
    }
  }

  const error = {
    code: err.code,
    message: err.message,
    data: {},
  };

  if (_.isNull(err.data) || _.isUndefined(err.data)) {
    error.data = {};
  } else if (!_.isObject(err.data)) {
    error.data = {extra: err.data};
  } else {
    error.data = err.data;
  }

  resp.status(err.statusCode).json(error);
}

export default {
  succ,
  fail,
};
