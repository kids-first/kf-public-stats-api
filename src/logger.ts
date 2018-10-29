import * as winston from 'winston';
import * as env from './config';

const { combine, timestamp, json, printf } = winston.format;

const consoleFormatter = printf(data => {
  return `${data.timestamp} [${data.level}]  - ${data.message}`;
});

const consoleLogger = new winston.transports.Console({
  level: env.logLevel,
  format: combine(timestamp(), consoleFormatter),
});

const fileLogger = new winston.transports.File({
  level: env.logLevel,
  filename: `${env.logPath}/${env.nodeEnv}/server.log`,
  maxsize: env.logFileSize,
  maxFiles: env.logMaxFiles,
  format: combine(timestamp(), json()),
});

const logger = winston.createLogger({
  transports: [consoleLogger, fileLogger],
});

export default logger;
