require('dotenv/config');
const express = require('express');
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
app.use('/uploads', express.static(uploadsPath));
app.use('/api', router);

const startServer = async () => {
  await prisma.$connect();

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
};

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
