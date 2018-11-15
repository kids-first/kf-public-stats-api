import 'babel-polyfill';

import { egoApi, arrangerApi } from './config';
import * as packageJson from '../package.json';
import logger from './logger';
import router from './routes/router';
import cache from './middleware/cache';

import * as express from 'express';
import * as cors from 'cors';
import * as path from 'path';

const startTime = new Date();

export default () => {
  const app = express();

  app.use(cors());

  //swagger
  app.use('/docs', (req, res) => {
    res.sendFile(path.join(__dirname, '../redoc.html'));
  });
  app.use('/swagger', (req, res) => {
    res.sendFile(path.join(__dirname, '../swagger.json'));
  });

  app.use('/v1', cache(), router);

  router.get('/status', (req, res) =>
    res.send({
      version: (<any>packageJson || {}).version,
      started: startTime.toISOString(),
      ego: egoApi,
      arranger: arrangerApi,
    }),
  );

  // 404 Handler
  app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
  });

  // define last - error handler
  app.use(function(err, req, res, next) {
    logger.error(err.stack);
    res.status(err.status || 500).send({ error: true, message: err.message });
  });

  return app;
};
