import * as mcache from 'memory-cache';
import { RequestHandlerParams } from 'express-serve-static-core';
import { RequestHandler, Request, Response, NextFunction, Send } from 'express';

export default (
  duration: number = 3600000,
  autoRefresh: boolean = false,
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): any => {
    const key = `__express__${req.originalUrl || req.url}`;

    const cacheHeader = req.get('Cache-Control');
    const noCache = cacheHeader === 'no-cache';

    const cachedResponse = mcache.get(key);
    if (!noCache && cachedResponse) {
      res.send(cachedResponse);
      return; //ensure no next()
    } else {
      res.__send = res.send;

      res.send = (body): Response => {
        if (!res.__end) {
          res.__end = res.end;
        }

        res.end = (
          chunk?: any | Function,
          encoding?: string | Function,
          cb?: Function,
        ): void => {
          if (res.statusCode !== 200 || body.error) {
            // can't cache at this point because everything is stringified by now,
            //  but we also don't know the statusCode until this point. So we cache always
            //  during 'send', but remove during 'end' if we have an error
            mcache.del(key);
          }
          if (typeof res.__end !== 'undefined') {
            res.__end(chunk, encoding, cb);
          }
        };

        // If we don't have something cached, we can cache this response
        // This is required because res.send is called multiple times, first loop with the original body,
        //  and additional times with the body stringified - we want to cache in the format returned by the
        //  service, and not a stringified version if the original was json
        if (!mcache.get(key)) {
          mcache.put(key, body, duration);
        }

        if (typeof res.__send !== 'undefined') {
          res.__send(body);
        }
        return res;
      };

      next();
    }
  };
};

export const clear: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
): any => {
  mcache.clear();
  res.status(200).send();
};
