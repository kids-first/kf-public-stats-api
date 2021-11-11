import 'babel-polyfill';
import * as Keycloak from 'keycloak-connect';
import { keycloakApi, arrangerApi, searchMembersApi, keycloakRealm, keycloakApiClientId } from './config';
import * as packageJson from '../package.json';
import logger from './logger';
import router from './routes/router';
import cache from './middleware/cache';
import { clear as cacheClear } from './middleware/cache';
// @ts-ignore
import * as express from 'express';
// @ts-ignore
import * as cors from 'cors';
import * as path from 'path';

const startTime = new Date();

const keycloakConfig = {
  realm: keycloakRealm,
  'confidential-port': 0,
  'bearer-only': true,
  'auth-server-url': keycloakApi,
  'ssl-required': 'external',
  resource: keycloakApiClientId,
} as Keycloak.KeycloakConfig;

const keycloak = new Keycloak({}, keycloakConfig);

export default () => {
  const app = express();

  app.use(cors());
  app.use(
    keycloak.middleware({
        logout: '/logout',
        admin: '/',
    }),
);

  //swagger
  app.use('/docs', (req, res) => {
    res.sendFile(path.join(__dirname, '../redoc.html'));
  });

  app.use('/swagger', (req, res) => {
    res.sendFile(path.join(__dirname, '../swagger.json'));
  });

  app.use('/v1', cache(), router);

  app.post('/cache/bust', keycloak.protect('realm:ADMIN'), cacheClear);

  router.get('/status', (req, res) =>
    res.send({
      version: (<any>packageJson || {}).version,
      started: startTime.toISOString(),
      keycloak: keycloakApi,
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
