import 'babel-polyfill';

import { egoApi, arrangerApi, searchMembersApi } from './config';
import * as packageJson from '../package.json';
import logger from './logger';
import router from './routes/router';
import cache from './middleware/cache';
import { clear as cacheClear } from './middleware/cache';

import egoTokenMiddleware from 'kfego-token-middleware';

import * as express from 'express';
import * as cors from 'cors';
import * as path from 'path';
const _ = require('lodash');

const startTime = new Date();

const adminGate = (req, res, next) => {
  const token = req.jwt;
  const isApp =
    _.get(token, 'context.application.status', '').toLowerCase() === 'approved';
  const isAdmin =
    _.get(token, 'context.user.roles', []).filter(
      role => role.toLowerCase() === 'admin',
    ).length >= 1;

  if (isApp || isAdmin) {
    next();
  } else {
    res
      .status(403)
      .send({
        error: true,
        message: 'Forbidden: Only available to applications or admin users',
      });
  }
};

const egoMiddleware = egoTokenMiddleware({
  egoURL: egoApi,
});

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
  app.post('/cache/bust', egoMiddleware, adminGate, cacheClear);

  router.get('/status', (req, res) =>
    res.send({
      version: (<any>packageJson || {}).version,
      started: startTime.toISOString(),
      ego: egoApi,
      arranger: arrangerApi,
      searchMembers: searchMembersApi,
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
