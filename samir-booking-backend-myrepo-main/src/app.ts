import express, { Application, NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import bodyParser from "body-parser";
import router from "./app/routes";
import GlobalErrorHandler from "./app/middlewares/globalErrorHandler";
import { getSystemStats } from "./utils/systemStats";
import { cache } from "./utils/cache";
import { generateStatsHtml } from "./utils/generateStatsHtml";
import { addLog, clearLogs, apiLogs } from "./utils/logger";

declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}

const app: Application = express();

export const corsOptions = {
  // origin: [
  //   "http://localhost:5173",
  //   "http://localhost:3000",
  //   "https://timothy-dashboard.netlify.app",
  //   "https://temothy-dashboard.vercel.app",
  // ],
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// app.use(
//   bodyParser.json({
//     verify: function (
//       req: express.Request,
//       res: express.Response,
//       buf: Buffer,
//     ) {
//       req.rawBody = buf;
//     },
//   }),
// );

// middleware setup
app.use(cors(corsOptions));
app.use(cookieParser());

app.use((req: Request, res: Response, next: NextFunction) => {
  const originalUrl = req.url;
  req.url = req.url.replace(/\/\/+/g, "/");
  
  if (originalUrl !== req.url) {
    console.log(`[URL Normalize] ${originalUrl} => ${req.url}`);
  }

  const start = Date.now();
  const originalSend = res.send;
  res.send = function (body) {
    const duration = Date.now() - start;
    console.log(`\n=== [RESPONSE] ===`);
    console.log(`Method: ${req.method}`);
    console.log(`URL: ${req.originalUrl}`);
    console.log(`Status: ${res.statusCode}`);
    console.log(`Duration: ${duration}ms`);
    
    let parsedResponse: any = null;
    if (body && typeof body === 'string') {
      try {
        parsedResponse = JSON.parse(body);
        console.log(`Response Body: ${JSON.stringify(parsedResponse, null, 2)}`);
      } catch {
        parsedResponse = body;
        console.log(`Response Body: ${body.substring(0, 500)}${body.length > 500 ? "..." : ""}`);
      }
    }
    console.log(`==================\n`);
    
    const isStaticOrLogRoute = 
      req.originalUrl === "/" || 
      req.originalUrl.includes("/terminal-logs") || 
      req.originalUrl.startsWith("/uploads/") || 
      req.originalUrl.startsWith("/public/");
      
    if (!isStaticOrLogRoute) {
      addLog({
        method: req.method,
        url: req.originalUrl,
        query: req.query,
        body: req.body,
        status: res.statusCode,
        duration: duration,
        responseBody: parsedResponse
      });
    }
    
    return originalSend.apply(res, arguments as any);
  };

  next();
});

app.use(
  bodyParser.json({
    verify: function (
      req: express.Request,
      res: express.Response,
      buf: Buffer,
    ) {
      req.rawBody = buf;
      if (req.url.includes("webhook")) {
        console.log(`[BodyParser] Captured rawBody for ${req.url}, length: ${buf.length}`);
      }
    },
  }),
);

app.use(bodyParser.urlencoded({ extended: true }));

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`\n=== [REQUEST] ===`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Method: ${req.method}`);
  console.log(`URL: ${req.originalUrl}`);
  if (Object.keys(req.query).length) {
    console.log(`Query: ${JSON.stringify(req.query, null, 2)}`);
  }
  if (req.body && Object.keys(req.body).length) {
    const loggedBody = { ...req.body };
    if (loggedBody.password) loggedBody.password = "********";
    console.log(`Body: ${JSON.stringify(loggedBody, null, 2)}`);
  }
  console.log(`=================\n`);
  next();
});

app.use(express.static("public"));

// route handler for the root endpoint
app.get("/", (req: Request, res: Response) => {
  const stats = getSystemStats(cache.getStats());
  
  // Return HTML if requested by browser, otherwise JSON
  if (req.headers.accept && req.headers.accept.includes("text/html")) {
    res.setHeader("Content-Type", "text/html");
    return res.send(generateStatsHtml(stats, apiLogs));
  }
  
  res.send(stats);
});

// app.use("/uploads", express.static(path.join("/var/www/uploads")));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads"))); // Serve static files from the "uploads" directory

// terminal logs endpoints
app.get("/api/v1/terminal-logs", (req: Request, res: Response) => {
  res.json(apiLogs);
});

app.delete("/api/v1/terminal-logs", (req: Request, res: Response) => {
  clearLogs();
  res.json({ success: true, message: "Logs cleared successfully" });
});

// setup API routes
app.use("/api/v1", router);

// error handling middleware
app.use(GlobalErrorHandler);

// 404 not found handler
app.use((req: Request, res: Response, next: NextFunction) => {
  console.error(`[404 Error] Requested Path: ${req.originalUrl} | Method: ${req.method}`);
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    message: "API NOT FOUND!",
    error: {
      path: req.originalUrl,
      message: "Your requested path is not found!",
    },
  });
});

export default app;
