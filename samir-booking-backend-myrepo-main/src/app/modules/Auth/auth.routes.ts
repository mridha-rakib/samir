import { UserRole } from "@prisma/client";
import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { AuthController } from "./auth.controller";
import { authValidation } from "./auth.validation";

const router = express.Router();

// login user
router.post("/login", AuthController.loginUser);

// create user and login facebook and google
router.post("/social-login", AuthController.socialLogin);

// website login after booking
router.post("/login-website", AuthController.loginWebsite);

// refresh token
router.post("/refresh-token", AuthController.refreshToken);

// user logout route
router.post(
  "/logout",
  auth(
    UserRole.USER,
    UserRole.PROPERTY_OWNER,
    UserRole.SERVICE_PROVIDER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  AuthController.logoutUser
);

//change password
router.put(
  "/change-password",
  auth(
    UserRole.USER,
    UserRole.PROPERTY_OWNER,
    UserRole.SERVICE_PROVIDER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validateRequest(authValidation.changePasswordValidationSchema),
  AuthController.changePassword
);

// forgot password
router.post("/forgot-password", AuthController.forgotPassword);

// verity otp
router.post("/verify-otp", AuthController.verifyOtp);

// reset password
router.post(
  "/reset-password",
  // auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validateRequest(authValidation.resetPasswordSchema),
  AuthController.resetPassword
);

// Airbnb Integration
router.get("/airbnb/connect", AuthController.connectAirbnb);
router.get("/airbnb/callback", AuthController.airbnbCallback);
router.get("/airbnb/success", AuthController.airbnbSuccess);
router.get(
  "/airbnb/status",
  auth(UserRole.PROPERTY_OWNER, UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  AuthController.getAirbnbStatus
);
router.post(
  "/airbnb/disconnect",
  auth(UserRole.PROPERTY_OWNER, UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  AuthController.disconnectAirbnb
);

export const authRoutes = router;
