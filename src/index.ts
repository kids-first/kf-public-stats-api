import * as env from './config';
import logger from './logger';
import server from './server';

const start = async () => {
  const app = server();

  app.listen(env.expressPort, () => {
    logger.info(
      `PUBLIC-STATS-API STARTED SUCCESSFULLY! - LISTENING ON PORT: ${
        env.expressPort
      }`,
      'test',
    );
  });
};

start();
