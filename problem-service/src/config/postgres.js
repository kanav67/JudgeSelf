const { Pool } = require('pg');
const { env } = require('./env');

const postgresConfig = {
  connectionString: env.databaseUrl,
  max: env.pgPoolMax,
};

const pool = new Pool(postgresConfig);

module.exports = {
  pool,
  postgresConfig,
};