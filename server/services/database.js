// db/index.js
const { Pool } = require('pg');
const dotenv = require('dotenv');
const Logger = require('../../utils/Logger.js');
const {logError, logProcess} = Logger('bevops.database', null, true);

dotenv.config();

const poolConfig = {
  host: process.env.PG_HOST,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
  port: process.env.PG_PORT ? parseInt(process.env.PG_PORT, 10) : 5432,
  max: process.env.PG_MAX ? parseInt(process.env.PG_MAX, 10) : 20,
  idleTimeoutMillis: process.env.PG_IDLE_TIMEOUT ? parseInt(process.env.PG_IDLE_TIMEOUT, 10) : 30000,
  connectionTimeoutMillis: process.env.PG_CONN_TIMEOUT ? parseInt(process.env.PG_CONN_TIMEOUT, 10) : 2000,
};

const pool = new Pool(poolConfig);


pool.on('error', (err, client) => {
    logError('Unexpected error on idle PostgreSQL client', { error: err });
  // Depending on your application’s resiliency requirements,
  // you might want to exit the process if a critical error occurs.
  process.exit(-1);
});

/**
 * Executes a query against the PostgreSQL database.
 *
 * @param {string} text - The SQL query text.
 * @param {Array} params - The parameters for the SQL query.
 * @returns {Promise<Object>} - The result of the query.
 */
const query = async (text, params) => {
  const startTime = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - startTime;
    logProcess('Executed query', `duration: ${duration}ms,rowCount: ${result.rowCount}`, new Date());
    return result;
  } catch (error) {
    logError('Error executing query', { query: text, error: error.message });
    throw error;
  }
};

/**
 * Runs a series of queries as a single transaction.
 *
 * @param {Function} transactionCallback - An async function that receives a client
 *                                           to execute queries within the transaction.
 * @returns {Promise<*>} - Returns whatever the transaction callback returns.
 * @throws Will throw an error if the transaction fails.
 */
const transaction = async (transactionCallback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await transactionCallback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logError('Transaction failed', { error: error.message });
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  query,
  transaction,
  pool,
};