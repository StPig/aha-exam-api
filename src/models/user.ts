import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../config';
import db from '../database/database';
import exception from '../modules/exception';
import sysEnum from '../modules/enum';
import {v4 as uuidv4} from 'uuid';
import sgMail from '@sendgrid/mail';

interface registerPayload {
  email: string;
  password: string;
}

interface verifyEmailPayload{
  verifyCode: string;
}

interface resendEmailPayload{
  email: string;
}

interface profilePayload{
  id: number;
}

interface modifyNamePayload{
  id: number;
  name: string;
}

interface resetPasswordPayload{
  id: number;
  oldPassword: string;
  newPassword: string;
}

interface dashboardPayload{
  page: number;
  pageSize: number;
}

/**
 * A user class.
 */
class User {
  /**
   * The get verify user by email function.
   * @param {string} email The email.
   * @return {any} user object.
   */
  public async getVerifyUserByEmail(email: string) {
    const sql = `
      SELECT
        id,
        hashed_password,
        is_verify
      FROM users
      WHERE email = $1
    `;

    const params = [email];
    const result = await db.query(sql, params);
    if (result.rows.length == 0) {
      throw new Error('NOT_FOUND_USER');
    } else if (result.rows[0].is_verify != sysEnum.isVerify.PASS) {
      throw new Error('USER_NOT_VERIFY');
    }

    return result.rows[0];
  }

  /**
   * The get user for provider function.
   * @param {string} ID The ID.
   * @param {any} provider The provider.
   * @return {any} user object.
   */
  public async getUserForProvider(ID: string, provider: any) {
    const sql = `
      SELECT
        id
      FROM users
      WHERE subject = $1
      AND provider = $2
    `;

    const params = [ID, provider];
    const result = await db.query(sql, params);
    if (result.rows.length == 0) {
      return {};
    }

    return result.rows[0];
  }

  /**
   * The insert user for provider function.
   * @param {string} ID The ID.
   * @param {any} provider The provider.
   * @param {any} email The email.
   * @param {any} name The name.
   */
  public async insertUserForProvider(ID: string, provider: any, email: any,
      name: any) {
    const sql = `
      INSERT INTO users
        (email, name, provider, subject, is_verify)
      VALUES
        ($1, $2, $3, $4, $5)
    `;

    const params = [email, name, provider, ID, sysEnum.isVerify.PASS];
    await db.query(sql, params);

    return;
  }

  /**
   * The update user active time function.
   * @param {string} ID The ID.
   */
  public async updateUserActiveTime(ID: string) {
    const sql = `
      UPDATE users
      SET last_active_time = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    const params = [ID];
    await db.query(sql, params);

    return;
  }

  /**
   * The get user by ID function.
   * @param {number} userID The user ID.
   * @return {any} user detail.
   */
  public async getUserByID(userID: number) {
    const sql = `
      SELECT
        id,
        email,
        name,
        hashed_password
      FROM users
      WHERE id = $1
    `;

    const params = [userID];
    const result = await db.query(sql, params);
    if (result.rows.length == 0) {
      throw new Error('NOT_FOUND_USER');
    }

    return result.rows[0];
  }

  /**
   * The check email is exist function.
   * @param {any} trans The transaction.
   * @param {string} email The email.
   * @return {boolean} is exist.
   */
  public async checkEmailIsExist(trans: any, email: string) {
    const sql = `
      SELECT
        COUNT(1) AS count
      FROM users
      WHERE email = $1
    `;

    const params = [email];
    const result = await trans.query(sql, params);
    if (result.rows[0].count != 0) {
      return true;
    }

    return false;
  }

  /**
   * The get user ID by email function.
   * @param {any} trans The transaction.
   * @param {string} email The email.
   * @return {number} user ID.
   */
  private async getUserIDByEmail(trans: any, email: string) {
    const sql = `
      SELECT
        id
      FROM users
      WHERE email = $1
    `;

    const params = [email];
    const result = await trans.query(sql, params);
    if (result.rows.length == 0) {
      throw exception.badRequestError('NOT_FOUND_USER',
          'not found user');
    }

    return result.rows[0].id;
  }

  /**
   * The get user and lock by ID function.
   * @param {any} trans The transaction.
   * @param {number} userID The user ID.
   * @return {any} user detail.
   */
  private async getUserAndLockByID(trans: any, userID: number) {
    const sql = `
      SELECT
        id,
        email,
        name,
        hashed_password
      FROM users
      WHERE id = $1
      FOR UPDATE
    `;

    const params = [userID];
    const result = await trans.query(sql, params);
    if (result.rows.length == 0) {
      throw exception.badRequestError('NOT_FOUND_USER',
          'not found user');
    }

    return result.rows[0];
  }

  /**
   * The register function.
   * @param {registerPayload} payload The register payload.
   */
  public async register(payload:registerPayload) {
    const trans = await db.getClient();

    try {
      await trans.query('BEGIN');
      if (await this.checkEmailIsExist(trans, payload.email)) {
        throw exception.badRequestError('EMAIL_EXIST', 'has same email exist');
      }

      const salt = bcrypt.genSaltSync(config.SALT_ROUNDS);
      const hash = bcrypt.hashSync(payload.password, salt);

      const sql = `
        INSERT INTO users
          (email, hashed_password, provider, is_verify)
        VALUES
          ($1, $2, $3, $4)
      `;

      const params = [payload.email, hash, sysEnum.provider.LOCAL,
        sysEnum.isVerify.NOT_YET];
      await trans.query(sql, params);

      const userID = await this.getUserIDByEmail(trans, payload.email);

      // verify email
      const verifyCode = uuidv4();
      const verifySQL = `
        INSERT INTO verify_email
          (user_id, hash)
        VALUES
          ($1, $2)
      `;

      const verifyParams = [userID, verifyCode];
      await trans.query(verifySQL, verifyParams);
      await this.sendVerifyEmail(payload.email, verifyCode);

      await trans.query('COMMIT');
    } catch (error) {
      await trans.query('ROLLBACK');
      throw error;
    } finally {
      trans.release();
    }
  }

  /**
   * The send verify email function.
   * @param {string} email The email.
   * @param {string} verifyCode The verify code.
   */
  private async sendVerifyEmail(email: string, verifyCode: string) {
    sgMail.setApiKey(config.SENDGRID_API_KEY);
    const msg = {
      to: email,
      from: 'hswu3838@gmail.com',
      subject: 'Email verification',
      html: '<p>You requested for email verificationkindly use this <a href="' +
        config.WEB_URL + '/verify-email?token=' + verifyCode +
        '">link</a> to verify your email address</p>',
    };
    sgMail
        .send(msg)
        .then(() => {
          console.log('Email sent');
        })
        .catch((error) => {
          console.error(error);
        });
  }

  /**
   * The verify email function.
   * @param {verifyEmailPayload} payload The verify email payload.
   */
  public async verifyEmail(payload:verifyEmailPayload) {
    const trans = await db.getClient();

    try {
      await trans.query('BEGIN');
      const sql = `
        SELECT
          user_id
        FROM verify_email
        WHERE hash = $1
        FOR UPDATE
      `;

      const params = [payload.verifyCode];
      const result = await trans.query(sql, params);
      if (result.rows.length == 0) {
        throw exception.badRequestError('NOT_FOUND_VERIFY_EMAIL',
            'not found verify email');
      }

      const updateSQL = `
        UPDATE users
        SET is_verify = $1
        WHERE id = $2
      `;

      const updateParams = [sysEnum.isVerify.PASS, result.rows[0].user_id];
      await trans.query(updateSQL, updateParams);
      await trans.query('COMMIT');
    } catch (error) {
      await trans.query('ROLLBACK');
      throw error;
    } finally {
      trans.release();
    }
  }

  /**
   * The resend email function.
   * @param {resendEmailPayload} payload The resend mail payload.
   */
  public async resendEmail(payload:resendEmailPayload) {
    const sql = `
      SELECT
        u.is_verify,
        e.hash
      FROM users u
      LEFT JOIN verify_email e ON e.user_id = u.id
      WHERE email = $1
    `;

    const params = [payload.email];
    const result = await db.query(sql, params);
    if (result.rows.length == 0) {
      throw exception.badRequestError('NOT_FOUND_VERIFY_EMAIL',
          'not found verify email');
    } else if (result.rows[0].is_verify != sysEnum.isVerify.NOT_YET) {
      throw exception.badRequestError('EMAIL_ALREADY_VERIFY',
          'email is already verify');
    }

    await this.sendVerifyEmail(payload.email, result.rows[0].hash);
  }

  /**
   * The login function.
   * @param {any} user The user object.
   */
  public async login(user: any) {
    const iat = Math.floor(Date.now() / 1000);
    const expTime = config.TOKEN_EXPIRE_TIME;
    const token = {
      id: user.id,
      iat: iat,
      exp: iat + expTime,
    };
    const signedToken = jwt.sign(token, config.JWT_SECRET_KEY);

    const updateSql = `
      UPDATE users
      SET last_login_time = $1,
          login_times = login_times + 1,
          last_active_time = CURRENT_TIMESTAMP
      WHERE id = $2
    `;

    const updateParams = [new Date(iat), user.id];
    await db.query(updateSql, updateParams);

    return {
      iat: token.iat,
      exp: token.exp,
      token: signedToken,
    };
  }

  /**
   * The profile function.
   * @param {profilePayload} payload The profile payload.
   */
  public async profile(payload:profilePayload) {
    const sql = `
      SELECT
        email,
        name
      FROM users
      WHERE id = $1
    `;

    const params = [payload.id];
    const result = await db.query(sql, params);
    if (result.rows.length == 0) {
      throw exception.badRequestError('NOT_FOUND_USER',
          'not found user');
    }

    return {
      email: result.rows[0].email,
      name: result.rows[0].name,
    };
  }

  /**
   * The modify name function.
   * @param {modifyNamePayload} payload The modify name payload.
   */
  public async modifyName(payload:modifyNamePayload) {
    const trans = await db.getClient();

    try {
      await trans.query('BEGIN');
      const user = await this.getUserAndLockByID(trans, payload.id);

      const sql = `
        UPDATE users
        SET name = $1
        WHERE id = $2
      `;

      const params = [payload.name, user.id];
      await trans.query(sql, params);
      await trans.query('COMMIT');
    } catch (error) {
      await trans.query('ROLLBACK');
      throw error;
    } finally {
      trans.release();
    }
  }

  /**
   * The reset password function.
   * @param {resetPasswordPayload} payload The reset password payload.
   */
  public async resetPassword(payload:resetPasswordPayload) {
    const trans = await db.getClient();

    try {
      await trans.query('BEGIN');
      const user = await this.getUserAndLockByID(trans, payload.id);

      const match = await bcrypt.compare(payload.oldPassword,
          user.hashed_password);

      if (!match) {
        throw exception.badRequestError('INCORRECT_OLD_PASSWORD',
            'incorrect old password');
      }

      const salt = bcrypt.genSaltSync(config.SALT_ROUNDS);
      const hash = bcrypt.hashSync(payload.newPassword, salt);

      const sql = `
        UPDATE users
        SET hashed_password = $1
        WHERE id = $2
      `;

      const params = [hash, user.id];
      await trans.query(sql, params);
      await trans.query('COMMIT');
    } catch (error) {
      await trans.query('ROLLBACK');
      throw error;
    } finally {
      trans.release();
    }
  }

  /**
   * The dashboard function.
   * @param {dashboardPayload} payload The dashboard payload.
   */
  public async dashboard(payload:dashboardPayload) {
    const today = new Date();
    const [userList, totalUser, totalActiveToday, average] = await Promise.all([
      (async () => {
        let sql = `
          SELECT
            email,
            name,
            create_time,
            login_times,
            last_active_time
          FROM users 
          ORDER BY create_time DESC
        `;

        sql = db.getPagination(payload.page, sql, payload.pageSize);
        console.log(sql);
        const result = await db.query(sql, []);
        return result.rows.length == 0 ? [] : result.rows;
      })(),
      (async () => {
        const sql = `
          SELECT
            COUNT(1) AS count
          FROM users
        `;

        const result = await db.query(sql, []);
        return result.rows[0].count;
      })(),
      (async () => {
        const sql = `
          SELECT
            COUNT(1) AS count
          FROM users
          WHERE last_active_time >= $1
        `;
        ;
        const params = [`${today.toISOString().split('T')[0]} 00:00:00`];

        const result = await db.query(sql, params);
        return result.rows[0].count;
      })(),
      (async () => {
        const sql = `
          SELECT
            COUNT(1) AS count
          FROM users
          WHERE last_active_time >= $1
        `;

        const year = today.getFullYear();
        const month = ('0' + (today.getMonth() + 1)).slice(-2);
        const date = ('0' + today.getDate()).slice(-2);
        const params = [`${year}-${month}-${Number(date)-6} 00:00:00`];

        const result = await db.query(sql, params);
        return result.rows[0].count;
      })(),
    ]);

    return {
      userList: userList,
      totalUser: totalUser,
      totalActiveToday: totalActiveToday,
      average: average,
    };
  }
}

export default User;
