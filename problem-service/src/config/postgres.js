const { Pool } = require('pg');
const { env } = require('./env');

const postgresConfig = {
  connectionString: env.databaseUrl,
  max: env.pgPoolMax,
};

const pool = new Pool(postgresConfig);

const checkHealth = async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return { status: 'up' };
  } catch (error) {
    throw error;
  }
}

module.exports = {
  pool,
  postgresConfig,
  checkHealth,
};