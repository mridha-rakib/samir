import { Router } from "express";
import { ShowUserInfoController } from "./showUserInfo.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { cacheMiddleware } from "../../middlewares/cacheMiddleware";

const router = Router();

// get all service provider for property owner
router.get(
  "/service-providers-for-property-owner",
  auth(UserRole.PROPERTY_OWNER),
  cacheMiddleware(120),
  ShowUserInfoController.getAllServiceProvidersForPropertyOwner,
);

export const showUserInfoRoutes = router;