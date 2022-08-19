import {Strategy as LocalStrategy} from 'passport-local';
import {Strategy as JWTStrategy, ExtractJwt} from 'passport-jwt';
import {Strategy as GoogleStrategy} from 'passport-google-oauth20';
import {Strategy as FacebookStrategy} from 'passport-facebook';
import bcrypt from 'bcrypt';
import _ from 'underscore';
import UserModel from './models/user';
import config from './config';
import sysEnum from './modules/enum';
import db from './database/database';

const userModel = new UserModel();

const local = new LocalStrategy({usernameField: 'email'},
    async (email: string, password: string, done: any) => {
      try {
        const user = await userModel.getVerifyUserByEmail(email);

        if (!user) {
          return done(null, false, {message: 'incorrect email or password'});
        }

        const match = await bcrypt.compare(password, user.hashed_password);

        if (!match) {
          return done(null, false, {message: 'incorrect email or password'});
        }

        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    },
);

const jwt = new JWTStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('jwt'),
  secretOrKey: config.JWT_SECRET_KEY,
}, async (jwtPayload: any, done: any) => {
  try {
    const user = await userModel.getUserByID(jwtPayload.id);

    if (!user) {
      return done(null, false, {message: 'wrong token'});
    }

    const exp = jwtPayload.exp;
    const current = new Date().getTime() / 1000;
    if (current > exp) {
      return done(null, false, {message: 'token expired'});
    }

    await userModel.updateUserActiveTime(user.id);

    return done(null, user);
  } catch (error) {
    return done(error, false);
  }
});

const google = new GoogleStrategy({
  clientID: config.GOOGLE_CLIENT_ID,
  clientSecret: config.GOOGLE_CLIENT_SECRET,
  callbackURL: `${config.URL}/user/login/google/callback`,
  scope: ['profile', 'email'],
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await userModel.getUserForProvider(profile.id,
        sysEnum.provider.GOOGLE);

    if (_.isEmpty(user)) {
      if (await userModel.checkEmailIsExist(db,
        <string>profile?.emails?.[0]?.value)) {
        return done(null, false, {message: 'exist email but other way'});
      }

      await userModel.insertUserForProvider(profile.id, sysEnum.provider.GOOGLE,
          profile?.emails?.[0]?.value, profile.displayName);

      user = await userModel.getUserForProvider(profile.id,
          sysEnum.provider.GOOGLE);
    }

    return done(null, user);
  } catch (error) {
    console.log(error);
    return done('fail to login with google', false);
  }
});

const facebook = new FacebookStrategy({
  clientID: config.FACEBOOK_CLIENT_ID,
  clientSecret: config.FACEBOOK_CLIENT_SECRET,
  callbackURL: `${config.URL}/user/login/facebook/callback`,
  profileFields: ['id', 'displayName', 'emails'],
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await userModel.getUserForProvider(profile.id,
        sysEnum.provider.FACEBOOK);

    if (_.isEmpty(user)) {
      if (await userModel.checkEmailIsExist(db,
        <string>profile?.emails?.[0]?.value)) {
        return done(null, false, {message: 'exist email but other way'});
      }

      await userModel.insertUserForProvider(profile.id,
          sysEnum.provider.FACEBOOK, profile?.emails?.[0]?.value,
          profile.displayName);

      user = await userModel.getUserForProvider(profile.id,
          sysEnum.provider.FACEBOOK);
    }

    return done(null, user);
  } catch (error) {
    console.log(error);
    return done('fail to login with facebook', false);
  }
});

export {
  local,
  jwt,
  google,
  facebook,
};
