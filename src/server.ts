import express from 'express';
import bodyParser from 'body-parser';
import logger from 'morgan';
import createError from 'http-errors';
import helmet from 'helmet';
import cors from 'cors';
import passport from 'passport';
import config from './config';
import {local, jwt, google, facebook} from './passport';
import user from './routers/user';

/**
 * A server class.
 * @param {int} port The server port number.
 * @return {object} The server instance.
 */
class Server {
  private app;

  /**
   * A constructor do init function.
   */
  constructor() {
    this.app = express();
    this.init();
    this.initPassport();
    this.initRoutes();
    this.add404Handle();
  }

  /**
   * A function of init.
   */
  private init() {
    this.app.use(express.json());
    this.app.use(bodyParser.urlencoded({extended: true}));
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(logger('dev'));
  }

  /**
   * A function of init passport.
   */
  private initPassport() {
    passport.use(local);
    passport.use(jwt);
    passport.use(google);
    passport.use(facebook);
  }

  /**
   * A function of init router.
   */
  private initRoutes() {
    this.app.use(config.API_USER, user);
  };

  /**
   * A function of add 404 handle.
   */
  private add404Handle() {
    this.app.use(function(req, res, next) {
      next(createError(404));
    });
  }

  public start = (port: number) => {
    return new Promise((resolve, reject) => {
      this.app.listen(port, () => {
        resolve(port);
      }).on('error', (err: Object) => reject(err));
    });
  };
}

export default Server;
