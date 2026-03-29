require('dotenv/config');
const express = require('express');
const logger = require('./utils/logger');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const prisma = require('./dbs/db');
const router = require('./routes/router');

const app = express();
const port = process.env.PORT || 5000;
const uploadsPath = path.join(__dirname, 'uploads');

fs.mkdirSync(uploadsPath, { recursive: true });

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.on('finish', () => {
    logger.http(`${req.method} ${req.originalUrl} ${res.statusCode}`);
  });
  next();
});

app.use('/uploads', express.static(uploadsPath));
app.use('/api', router);

const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info('Successfully connected to the database');

    app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
    });
  } catch (error) {
    logger.error(`Failed to connect to the database: ${error.message}`);
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  logger.info('Shutting down server...');
  try {
    await prisma.$disconnect();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error(`Error closing database connection: ${error.message}`);
  }
  process.exit(0);
});

startServer();
