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

const logger = winston.createLogger({
  transports: [consoleLogger],
});

export default logger;
