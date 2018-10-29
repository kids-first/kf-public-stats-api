import 'babel-polyfill';

import { egoApi, arrangerApi } from './config';
import studiesRouter from './routes/studies';
import * as packageJson from '../package.json';

import * as express from 'express';

const startTime = new Date();

export default async ({ ego }) => {
  const app = express();

  app.get('/status', (req, res) =>
    res.send({
      version: (<any>packageJson || {}).version,
      started: startTime.toISOString(),
      ego: egoApi,
      arranger: arrangerApi,
    }),
  );

  app.use('/studies', studiesRouter);

  return app;
};
