const { Pool } = require('pg');
const logger = require('../utils/logger');

// Create a new connection pool
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'postgres',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

// Test the connection with exponential backoff
const connectWithRetry = (retries = 5, delay = 1000) => {
  pool.connect()
    .then((client) => {
      logger.info('Connected to PostgreSQL successfully!');
      client.release(); // release the client back to the pool
    })
    .catch((err) => {
      logger.error(`Error connecting to PostgreSQL: ${err.message}`);
      if (retries === 0) {
        logger.error('Could not connect to PostgreSQL after multiple retries. Exiting...');
        // Exit process if it fails completely
        process.exit(1);
      }
      logger.info(`Retrying connection in ${delay / 1000} seconds... (${retries} retries left)`);
      // Retry connection with exponential backoff delay (doubling each time)
      setTimeout(() => connectWithRetry(retries - 1, delay * 2), delay);
    });
};

connectWithRetry();

// Catch unexpected errors on idle clients
pool.on('error', (err) => {
  logger.error(`Unexpected error on idle database client: ${err.message}`);
  process.exit(-1);
});

// Export a generic query method for routes/controllers to use
module.exports = {
  query: (text, params) => pool.query(text, params),
};
