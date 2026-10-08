export interface ApiLog {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  query: any;
  body: any;
  status?: number;
  duration?: number;
  responseBody?: any;
  error?: any;
}

export const apiLogs: ApiLog[] = [];
const MAX_LOGS = 50;

export function maskSensitive(obj: any): any {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(maskSensitive);

  const result: any = {};
  for (const key of Object.keys(obj)) {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes("password") ||
      lowerKey.includes("token") ||
      lowerKey.includes("secret") ||
      lowerKey.includes("authorization") ||
      lowerKey.includes("cookie")
    ) {
      result[key] = "********";
    } else {
      result[key] = maskSensitive(obj[key]);
    }
  }
  return result;
}

export const addLog = (log: Partial<ApiLog>) => {
  const newLog: ApiLog = {
    id: Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
    method: log.method || "GET",
    url: log.url || "/",
    query: maskSensitive(log.query) || {},
    body: maskSensitive(log.body) || {},
    status: log.status,
    duration: log.duration,
    responseBody: maskSensitive(log.responseBody),
    error: maskSensitive(log.error),
  };
  apiLogs.unshift(newLog);
  if (apiLogs.length > MAX_LOGS) {
    apiLogs.pop();
  }
  return newLog;
};

export const clearLogs = () => {
  apiLogs.length = 0;
};
