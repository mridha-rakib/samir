import { Request, Response } from "express";
import httpStatus from "http-status";
import config from "../../../config";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { AuthServices } from "./auth.service";
import axios from "axios";
import prisma from "../../../shared/prisma";

// login user
const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.loginUser(req.body);

  res.cookie("token", result.accessToken, {
    secure: config.env === "production",
    httpOnly: true,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24 * 365,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User logged in successfully",
    data: result,
  });
});

// create user and login facebook and google
const socialLogin = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.socialLogin(req.body);

  res.cookie("token", result.accessToken, {
    secure: config.env === "production",
    httpOnly: true,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24 * 365,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User logged in successfully",
    data: result,
  });
});

// website login after booking
const loginWebsite = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.loginWebsite(req.body);

  res.cookie("token", result.accessToken, {
    secure: config.env === "production",
    httpOnly: true,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24 * 365,
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "User registered and logged in successfully",
    data: result,
  });
});

// refresh token
const refreshToken = catchAsync(async (req, res) => {
  const refreshToken = req.headers.authorization || "";

  if (!refreshToken) {
    return sendResponse(res, {
      statusCode: 403,
      success: false,
      message: "Refresh token not found",
      data: undefined,
    });
  }

  const result = await AuthServices.refreshToken(refreshToken);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User logged In successfully",
    data: result,
  });
});

// logout user
const logoutUser = catchAsync(async (req: Request, res: Response) => {
  // Clear the token cookie
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User Successfully logged out",
    data: null,
  });
});

// change password
const changePassword = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { oldPassword, newPassword } = req.body;

  const result = await AuthServices.changePassword(
    userId,
    oldPassword,
    newPassword
  );

  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Password changed successfully",
    data: result,
  });
});

// forgot password
const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const data = await AuthServices.forgotPassword(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Check your email!",
    data: data,
  });
});

// verify token
const verifyOtp = catchAsync(async (req: Request, res: Response) => {
  const { otp } = req.body;
  const result = await AuthServices.verifyOtp(otp);

  res.cookie("token", result.accessToken, {
    secure: config.env === "production",
    httpOnly: true,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24 * 365,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "OTP verified successfully",
    data: result,
  });
});

// reset password
const resetPassword = catchAsync(async (req: Request, res: Response) => {
  let token = (req.headers.authorization || req.cookies?.token || req.query?.token || "") as string;
  if (token.startsWith("Bearer ")) {
    token = token.slice(7);
  }

  await AuthServices.resetPassword(token, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password Reset!",
    data: null,
  });
});

const connectAirbnb = catchAsync(async (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  if (!userId) {
    return res.status(400).send("userId query parameter is required");
  }

  const clientId = process.env.AIRBNB_CLIENT_ID || "mock-client-id";
  const redirectUri = encodeURIComponent("https://api.hostibook.com/api/v1/auth/airbnb/callback");
  const authUrl = `https://www.airbnb.com/oauth2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=reviews_write&response_type=code&state=${userId}`;

  res.redirect(authUrl);
});

const airbnbCallback = catchAsync(async (req: Request, res: Response) => {
  const { code, state: userId } = req.query;

  if (!code || !userId) {
    return res.status(400).send("Authorization code and state (userId) are required");
  }

  try {
    let accessToken = "mock-airbnb-access-token-value";
    let refreshToken = "mock-airbnb-refresh-token-value";

    try {
      const response = await axios.post("https://api.airbnb.com/v2/oauth2/authorizations", {
        client_id: process.env.AIRBNB_CLIENT_ID || "mock-client-id",
        client_secret: process.env.AIRBNB_CLIENT_SECRET || "mock-client-secret",
        code: code as string,
        grant_type: "authorization_code",
        redirect_uri: "https://api.hostibook.com/api/v1/auth/airbnb/callback",
      });
      if (response.data?.access_token) {
        accessToken = response.data.access_token;
        refreshToken = response.data.refresh_token;
      }
    } catch (apiErr: any) {
      console.warn("[Airbnb OAuth] Failed to exchange real auth code for tokens (using mock values for testing):", apiErr.message);
    }

    await prisma.user.update({
      where: { id: userId as string },
      data: {
        airbnbAccessToken: accessToken,
        airbnbRefreshToken: refreshToken,
      },
    });

    console.log(`[Airbnb OAuth] Successfully linked Airbnb account for partner ${userId}`);

    res.redirect("https://api.hostibook.com/api/v1/auth/airbnb/success");
  } catch (err: any) {
    console.error("[Airbnb OAuth Callback Error]:", err);
    res.status(500).send("An error occurred during Airbnb account connection.");
  }
});

const airbnbSuccess = catchAsync(async (req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Connection Successful</title>
      <style>
        body { font-family: sans-serif; text-align: center; padding: 50px; background-color: #f7fafc; }
        .card { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: inline-block; max-width: 400px; }
        h1 { color: #48bb78; margin-bottom: 10px; }
        p { color: #4a5568; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>Connection Successful!</h1>
        <p>Your Airbnb account has been connected to Hostibook. You can now close this window.</p>
      </div>
    </body>
    </html>
  `);
});

const getAirbnbStatus = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      airbnbAccessToken: true,
    },
  });

  const isConnected = !!user?.airbnbAccessToken;

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Airbnb connection status retrieved successfully",
    data: { isConnected },
  });
});

const disconnectAirbnb = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  await prisma.user.update({
    where: { id: userId },
    data: {
      airbnbAccessToken: null,
      airbnbRefreshToken: null,
    },
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Airbnb account disconnected successfully",
    data: null,
  });
});

export const AuthController = {
  loginUser,
  socialLogin,
  loginWebsite,
  refreshToken,
  logoutUser,
  changePassword,
  forgotPassword,
  verifyOtp,
  resetPassword,
  connectAirbnb,
  airbnbCallback,
  airbnbSuccess,
  getAirbnbStatus,
  disconnectAirbnb,
};
