import { Pool, PoolConfig } from 'pg';
import { env } from './env.js';

export const pool = new Pool({
  connectionString: env.databaseUrl,
  max: env.pgPoolMax,
});

export const checkHealth = async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return { status: 'up' };
  } catch (error) {
    throw error;
  }
};