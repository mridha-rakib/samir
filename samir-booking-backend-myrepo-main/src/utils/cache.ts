import NodeCache from "node-cache";

// stdTTL: (default: 0) the standard ttl as number in seconds for every generated cache element. 0 = unlimited
// checkperiod: (default: 600) The period in seconds for the used check-up function to delete expired keys. 0 = no periodic check.
// maxKeys: (default: -1) maximum amount of keys that can be stored in the cache. -1 = unlimited
const myCache = new NodeCache({ 
  stdTTL: 600, // 10 minutes default TTL
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false, // For better performance and less memory usage
});

export const cache = {
  get: <T>(key: string): T | undefined => {
    return myCache.get<T>(key);
  },
  set: <T>(key: string, value: T, ttl?: number): boolean => {
    // Basic memory protection: if heap used is > 180MB (leaving some room for 200MB limit)
    // We might want to be careful here as process.memoryUsage().heapUsed is just one part.
    // However, the user asked for it not to take more than 200MB.
    const memoryUsage = process.memoryUsage().rss / 1024 / 1024;
    if (memoryUsage > 180) {
      // If we are close to the 200MB limit, clear the cache to free up memory
      if (memoryUsage > 190) {
        myCache.flushAll();
        console.warn("Cache flushed due to high memory usage:", memoryUsage.toFixed(2), "MB");
      }
    }
    
    return ttl ? myCache.set(key, value, ttl) : myCache.set(key, value);
  },
  del: (key: string): number => {
    return myCache.del(key);
  },
  removeByPrefix: (prefix: string): void => {
    const keys = myCache.keys();
    const filteredKeys = keys.filter(key => key.includes(prefix));
    if (filteredKeys.length > 0) {
      myCache.del(filteredKeys);
    }
  },
  flush: (): void => {
    myCache.flushAll();
  },
  getStats: () => {
    return myCache.getStats();
  }
};
