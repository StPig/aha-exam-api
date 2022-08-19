import 'dotenv/config';

interface Config {
    [propName: string]: any;
}
const config: Config = {};

config.URL = process.env.URL;
config.PORT = process.env.PORT;
config.WEB_URL = process.env.WEB_URL;

config.DB_NAME = process.env.DB_NAME;
config.DB_PASSWORD = process.env.DB_PASSWORD;
config.DB_URL = process.env.DB_URL;
config.DB_DATABASE = process.env.DB_DATABASE;
config.DB_POOL_MAX = 20;
config.DB_TIMEOUT = 30000;

config.SALT_ROUNDS = 10;
config.JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
config.TOKEN_EXPIRE_TIME = 60 * 60 * 5;

config.API_USER = '/user';

config.SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

config.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
config.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

config.FACEBOOK_CLIENT_ID = process.env.FACEBOOK_CLIENT_ID;
config.FACEBOOK_CLIENT_SECRET = process.env.FACEBOOK_CLIENT_SECRET;

export default config;
