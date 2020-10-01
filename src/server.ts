import 'babel-polyfill';

import { egoApi, arrangerApi, searchMembersApi } from './config';
import * as packageJson from '../package.json';
import logger from './logger';
import router from './routes/router';
import cache from './middleware/cache';
import { clear as cacheClear } from './middleware/cache';
// @ts-ignore
import egoTokenMiddleware from 'kfego-token-middleware';
// @ts-ignore
import * as express from 'express';
// @ts-ignore
import * as cors from 'cors';
import * as path from 'path';

const startTime = new Date();

const adminGate = (req, res, next) => {
  const token = req.jwt;
  const isApp =
    (token?.context?.application?.status || '').toLowerCase() === 'approved';
  const isAdmin =
    (token?.context?.user?.roles || []).filter(
      (role) => role.toLowerCase() === 'admin',
    ).length >= 1;
  if (isApp || isAdmin) {
    next();
  } else {
    res.status(403).send({
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
  app.use((req, res, _) => {
    res.status(404).send({
      error: true,
      message: 'Not Found',
    });
  });

  // define last - error handler
  app.use(function (err, req, res, _) {
    logger.error(err.stack);
    res.status(err.status || 500).send({ error: true, message: err.message });
  });

  return app;
};
