import {Router} from 'express';
import Joi from 'joi';
import passport from 'passport';
import {validate} from '../modules/schemaValidation';
import UserModel from '../models/user';
import response from '../modules/response';
import exception from '../modules/exception';
import config from '../config';

const router = Router();
const userModel = new UserModel();
const pwdReg = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

router.post('/sign-up', (req, resp) => {
  const _execute = async function() {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().regex(pwdReg).required(),
      confirmPassword: Joi.equal(Joi.ref('password')).required(),
    });

    await validate(schema, req.body);

    return await userModel.register({...req.body});
  };

  _execute()
      .then(function(result) {
        return response.succ(resp, result);
      })
      .catch(function(err) {
        return response.fail(resp, err);
      });
});

router.put('/verify-email', (req, resp) => {
  const _execute = async function() {
    const schema = Joi.object({
      verifyCode: Joi.string().required(),
    });

    await validate(schema, req.body);

    return await userModel.verifyEmail({...req.body});
  };

  _execute()
      .then(function(result) {
        return response.succ(resp, result);
      })
      .catch(function(err) {
        return response.fail(resp, err);
      });
});

router.post('/resend-email', (req, resp) => {
  const _execute = async function() {
    const schema = Joi.object({
      email: Joi.string().email().required(),
    });

    await validate(schema, req.body);

    return await userModel.resendEmail({...req.body});
  };

  _execute()
      .then(function(result) {
        return response.succ(resp, result);
      })
      .catch(function(err) {
        return response.fail(resp, err);
      });
});

router.post('/login', passport.authenticate('local',
    {session: false, failWithError: true}),
(req: any, resp: any) => {
  const _execute = async function() {
    return await userModel.login(req.user);
  };

  _execute()
      .then(function(result) {
        return response.succ(resp, result);
      })
      .catch(function(err) {
        return response.fail(resp, err);
      });
}, function(err: any, req: any, res: any, next: any) {
  if (err.message == 'USER_NOT_VERIFY') {
    return response.fail(res, exception.badRequestError(
        err.message, 'user not verify'));
  } else if (err.message == 'NOT_FOUND_USER') {
    return response.fail(res, exception.badRequestError(
        err.message, 'user not found'));
  }
  return response.fail(res, err);
});

router.get('/login/google', passport.authenticate('google',
    {session: false}));

router.get('/login/google/callback', passport.authenticate('google',
    {failureRedirect: `${config.WEB_URL}/login`, session: false}),
(req, resp) => {
  const _execute = async function() {
    return await userModel.login(req.user);
  };

  _execute()
      .then(function(result) {
        return resp.redirect(`${config.WEB_URL}/auth`+
        `?token=${result.token}&exp=${result.exp}`);
      })
      .catch(function(err) {
        return response.fail(resp, err);
      });
});

router.get('/login/facebook', passport.authenticate('facebook',
    {scope: ['email'], session: false}));

router.get('/login/facebook/callback', passport.authenticate('facebook',
    {failureRedirect: `${config.WEB_URL}/login`, session: false}),
(req, resp) => {
  const _execute = async function() {
    return await userModel.login(req.user);
  };

  _execute()
      .then(function(result) {
        return resp.redirect(`${config.WEB_URL}/auth`+
        `?token=${result.token}&exp=${result.exp}`);
      })
      .catch(function(err) {
        return response.fail(resp, err);
      });
});

router.get('/', passport.authenticate('jwt', {session: false}),
    (req, resp) => {
      const _execute = async function() {
        return await userModel.profile({...req.user, ...req.body});
      };

      _execute()
          .then(function(result) {
            return response.succ(resp, result);
          })
          .catch(function(err) {
            return response.fail(resp, err);
          });
    });

router.put('/name', passport.authenticate('jwt', {session: false}),
    (req, resp) => {
      const _execute = async function() {
        const schema = Joi.object({
          name: Joi.string().required(),
        });

        await validate(schema, req.body);

        return await userModel.modifyName({...req.user, ...req.body});
      };

      _execute()
          .then(function(result) {
            return response.succ(resp, result);
          })
          .catch(function(err) {
            return response.fail(resp, err);
          });
    });

router.put('/reset-password', passport.authenticate('jwt', {session: false}),
    (req, resp) => {
      const _execute = async function() {
        const schema = Joi.object({
          oldPassword: Joi.string().pattern(pwdReg).required(),
          newPassword: Joi.string().pattern(pwdReg).
              invalid(Joi.ref('oldPassword')).required(),
          confirmPassword: Joi.equal(Joi.ref('newPassword')).required(),
        });

        await validate(schema, req.body);

        return await userModel.resetPassword({...req.user, ...req.body});
      };

      _execute()
          .then(function(result) {
            return response.succ(resp, result);
          })
          .catch(function(err) {
            return response.fail(resp, err);
          });
    });

router.get('/dashboard', passport.authenticate('jwt', {session: false}),
    (req, resp) => {
      const _execute = async function() {
        const schema = Joi.object({
          page: Joi.number().required(),
          pageSize: Joi.number().required(),
        });

        await validate(schema, req.query);

        return await userModel.dashboard({page: Number(req.query.page),
          pageSize: Number(req.query.pageSize)});
      };

      _execute()
          .then(function(result) {
            return response.succ(resp, result);
          })
          .catch(function(err) {
            return response.fail(resp, err);
          });
    });

export default router;
