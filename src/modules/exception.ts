import httpStatus from 'http-status-codes';

/**
 * A web error base class.
 */
class WebBaseError extends Error {
  statusCode: number;
  code: string;
  data: object | null;

  /**
   * A constructor do init function.
   * @param {number} statusCode The status code.
   * @param {string} code The code.
   * @param {string} message The message.
   * @param {object} data The data.
   */
  constructor(
      statusCode: number,
      code: string,
      message: string,
      data: object | null,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.data = data;
  }
}

/**
 * A sql error.
 */
class SqlError extends WebBaseError {
  /**
   * A constructor do init function.
   * @param {string} code The code.
   * @param {string} message The message.
   */
  constructor(code: string, message: string) {
    super(httpStatus.BAD_REQUEST, code, message, null); // 400
  }
}

/**
 * A bad request error.
 */
class BadRequestError extends WebBaseError {
  /**
   * A constructor do init function.
   * @param {string} code The code.
   * @param {string} message The message.
   * @param {object} data The data.
   */
  constructor(code: string, message: string, data: object | null) {
    super(httpStatus.BAD_REQUEST, code, message, data); // 400
  }
}

/**
 * A auth error.
 */
class AuthError extends WebBaseError {
  /**
   * A constructor do init function.
   * @param {string} code The code.
   * @param {string} message The message.
   */
  constructor(code: string, message: string) {
    super(httpStatus.METHOD_NOT_ALLOWED, code, message, null); // 401
  }
}

/**
 * A permission error.
 */
class PermissionError extends WebBaseError {
  /**
   * A constructor do init function.
   * @param {string} code The code.
   * @param {string} message The message.
   */
  constructor(code: string, message: string) {
    super(httpStatus.UNAUTHORIZED, code, message, null); // 401
  }
}

/**
 * A forbidden error.
 */
class ForbiddenError extends WebBaseError {
  /**
   * A constructor do init function.
   * @param {string} code The code.
   * @param {string} message The message.
   */
  constructor(code: string, message: string) {
    super(httpStatus.FORBIDDEN, code, message, null); // 403
  }
}

/**
 * A server error.
 */
class ServerError extends WebBaseError {
  /**
   * A constructor do init function.
   * @param {string} code The code.
   * @param {string} message The message.
   */
  constructor(code: string, message: string) {
    super(httpStatus.INTERNAL_SERVER_ERROR, code, message, null); // 500
  }
}

export default {
  isWebError: function(err: unknown) {
    if (err instanceof WebBaseError) {
      return true;
    }
    return false;
  },

  sqlError: function(code: string, message: string) {
    return new SqlError(code, message);
  },

  badRequestError: function(
      code: string,
      message: string,
      data: object | null = null,
  ) {
    return new BadRequestError(code, message, data);
  },

  authError: function(code: string, message: string) {
    return new AuthError(code, message);
  },

  permissionError: function(code: string, message: string) {
    return new PermissionError(code, message);
  },

  forbiddenError: function(code: string, message: string) {
    return new ForbiddenError(code, message);
  },

  serverError: function(code: string, message: string) {
    return new ServerError(code, message);
  },
};
