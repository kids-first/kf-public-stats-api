import * as winston from 'winston';
import * as env from './config';

const { colorize, combine, timestamp, json, printf } = winston.format;

let count = 0;

const consoleFormatter = printf(data => {
  count += 1;
  return `(${count}) ${data.timestamp} [${data.level}]  -\n ${data.message}`;
});

const consoleLogger = new winston.transports.Console({
  level: env.logLevel,
  format: combine(colorize(), timestamp(), consoleFormatter),
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
