import { Request, Response, NextFunction } from "express";
import { cache } from "../../utils/cache";

export const cacheMiddleware = (duration: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    const key = `__express__${req.originalUrl || req.url}`;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      return res.send(cachedResponse);
    } else {
      // Monkey patch res.send to store the response in cache
      const originalSend = res.send;
      res.send = (body: any): Response => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cache.set(key, body, duration);
        }
        return originalSend.call(res, body);
      };
      next();
    }
  };
};
