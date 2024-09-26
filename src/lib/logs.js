const winston = require('winston');
const chalk = require('chalk'); // Necesitas instalar 'chalk' para aplicar colores

// Define colores para cada parte del log
const colors = {
  timestamp: chalk.cyan.bold,
  id: chalk.blue.bold,
  level: chalk.bold,
  message: chalk.white.bold
};

// Añade colores personalizados a los niveles
winston.addColors({
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'cyan'
});

const logCounter = { count: 0 };

function getNextLogId() {
  logCounter.count += 1;
  return logCounter.count;
}

const customFormat = winston.format.printf(({ level, message, timestamp }) => {
  const logId = getNextLogId();
  return `${colors.timestamp(`[${timestamp}]`)} ${colors.id(`[${logId}]`)} ${colors.level(`[${level}]`)} ${colors.message(message)}`;
});

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize({ all: false }), // Desactiva la colorización global
    customFormat
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: __dirname + '/combined.log' })
  ]
});

module.exports = logger;
