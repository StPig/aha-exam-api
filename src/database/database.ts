import {Pool} from 'pg';
import config from '../config';

const pool = new Pool({
  max: config.DB_POOL_MAX,
  connectionString: `postgres://${config.DB_NAME}:${config.DB_PASSWORD}@${config.DB_URL}/${config.DB_DATABASE}`,
  idleTimeoutMillis: config.DB_TIMEOUT,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on('error', (err) => {
  console.error('unexpected error on idle client', err);
  process.exit(-1);
});

export default {
  async getClient() {
    return await pool.connect();
  },
  async query(sql: string, params: any) {
    const start = Date.now();
    const results = await pool.query(sql, params);
    const duration = Date.now() - start;
    console.log('executed query', {sql, duration, rows: results.rowCount});
    return results;
  },
  getPagination(page: number, sql: string, pageSize: number) {
    sql += ` LIMIT ${pageSize}`;
    if ((page - 1) > 0) {
      sql += ` OFFSET ${(pageSize - 1) * page}`;
    }

    return sql;
  },
};
