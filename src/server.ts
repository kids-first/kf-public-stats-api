import 'babel-polyfill';

import { egoApi, arrangerApi } from './config';
import * as packageJson from '../package.json';
import router from './routes/router';

import * as express from 'express';
import * as swagger from 'swagger-ui-express';
const swaggerDoc = require('../swagger.json');

const startTime = new Date();

export default () => {
  const app = express();

  //swagger
  app.use('/docs', swagger.serve, swagger.setup(swaggerDoc));

  app.get('/status', (req, res) =>
    res.send({
      version: (<any>packageJson || {}).version,
      started: startTime.toISOString(),
      ego: egoApi,
      arranger: arrangerApi,
    }),
  );

  app.use('/', router);

  return app;
};
