require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const logger = require('./utils/logger');
const db = require('./dbs/db'); // This simply imports and initiates the connection
const app = express();
const port = process.env.PORT || 3000;

// Connect Morgan to Winston
const morganMiddleware = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  { stream: { write: (message) => logger.http(message.trim()) } }
);

app.use(morganMiddleware);
app.use(express.json());

const routes = require('./routes/router');

// Mount the central router at the /api prefix
app.use('/api', routes);

app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});
