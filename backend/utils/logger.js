const winston = require('winston');
const path = require('path');

// Define your severity levels. 
// With them, You can create log files, 
// see or hide levels based on the running ENV.
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// This method set the current severity based on 
// the current NODE_ENV: show all the log levels 
// if the server was run in development mode; otherwise, 
// if it was run in production, show only warn and error messages.
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'info'; // changed warn to info so we can see stuff in production if needed, or stick to warn
};

// Define different colors for each level. 
// Colors make the log message more visible,
// adding the ability to focus or ignore messages.
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'cyan',
};

// Tell winston that you want to link the colors 
// defined above to the severity levels.
winston.addColors(colors);

// Create a custom format to extract the filename and line number
const errorStackFormat = winston.format((info) => {
  const stack = new Error().stack.split('\n');
  let callerLine = '';

  // Loop through stack lines, skip Winston internals and the logger itself
  for (let i = 0; i < stack.length; i++) {
    if (stack[i].includes('at ') && !stack[i].includes('node_modules') && !stack[i].includes('logger.js')) {
      callerLine = stack[i];
      break;
    }
  }

  // Extract filename and line using Regex
  const match = callerLine.match(/\((.*):(\d+):(\d+)\)/) || callerLine.match(/at (.*):(\d+):(\d+)/);
  if (match) {
    info.caller = `${path.basename(match[1])}:${match[2]}`;
  } else {
    info.caller = 'unknown:0';
  }
  
  return info;
});

// Chose the aspect of your log customizing the log format.
const format = winston.format.combine(
  errorStackFormat(),
  // Add the message timestamp with the preferred format
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  // Tell Winston that the logs must be colored
  winston.format.colorize({ all: true }),
  // Define the format of the message showing the timestamp, the level and the message
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level} [${info.caller}]: ${info.message}`,
  ),
);

// Define which transports the logger must use to print out messages. 
// In this example, we are using three different transports 
const transports = [
  // Allow the use the console to print the messages
  new winston.transports.Console(),
  // Allow to print all the error level messages inside the error.log file
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: winston.format.uncolorize() // Strip colors for files
  }),
  // Allow to print all the error message inside the all.log file
  // (also the error log that are also printed inside the error.log(
  new winston.transports.File({ 
    filename: 'logs/all.log',
    format: winston.format.uncolorize() // Strip colors for files
  }),
];

// Create the logger instance that has to be exported 
// and used to log messages.
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});

module.exports = logger;
