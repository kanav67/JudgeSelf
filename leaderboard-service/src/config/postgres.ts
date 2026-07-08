import pg from 'pg';
import { env } from './env';

export const pgPool = new pg.Pool({
  connectionString: env.databaseUrl,
});

export const InitPostgres = async () => {
  await pgPool.query('SELECT 1');
  console.log('PostgreSQL Pool initialized successfully');
}