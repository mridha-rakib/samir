import { NextFunction, Request, Response } from "express";

export const parseBodyData = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.body.data) {
    try {
      req.body = JSON.parse(req.body.data);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid JSON format in bodyData",
      });
    }
  }
  // Debug log for hotel endpoints to see incoming raw and parsed data
  if (req.originalUrl.includes("/hotels")) {
    console.log("=== parseBodyData Middleware ===");
    console.log("Path:", req.originalUrl);
    console.log("Body:", JSON.stringify(req.body, null, 2));
    console.log("================================");
  }
  next();
};
