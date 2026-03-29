const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
	adapter,
	log: [
		{ emit: 'event', level: 'query' },
		{ emit: 'event', level: 'error' },
		{ emit: 'event', level: 'info' },
		{ emit: 'event', level: 'warn' },
	],
});

prisma.$on('query', (e) => {
	// Use debug or info level for DB queries depending on verbosity preference
	// Sticking with debug helps avoid noise in production info logs
	logger.debug(`DB Query: ${e.query} - Duration: ${e.duration}ms`);
});

prisma.$on('error', (e) => {
	logger.error(`DB Error: ${e.message}`);
});

prisma.$on('info', (e) => {
	logger.info(`DB Info: ${e.message}`);
});

prisma.$on('warn', (e) => {
	logger.warn(`DB Warn: ${e.message}`);
});

module.exports = prisma;
