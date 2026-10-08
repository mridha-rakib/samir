import express from "express";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";
import { FavoriteController } from "./favorite.controller";

const router = express.Router();

router.post(
  "/toggle",
  auth(UserRole.PROPERTY_OWNER, UserRole.SERVICE_PROVIDER),
  FavoriteController.toggleFavorite
);

router.get(
  "/my-saved",
  auth(UserRole.PROPERTY_OWNER, UserRole.SERVICE_PROVIDER),
  FavoriteController.getMySavedUsers
);

router.get(
  "/my-clients",
  auth(UserRole.SERVICE_PROVIDER),
  FavoriteController.getMyClients
);

export const FavoriteRoutes = router;
