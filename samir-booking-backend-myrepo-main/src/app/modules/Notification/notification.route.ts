import express from "express";
import { NotificationController } from "./notification.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.get(
  "/",
  auth(UserRole.USER, UserRole.PROPERTY_OWNER, UserRole.SERVICE_PROVIDER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  NotificationController.getMyNotifications,
);

router.get(
  "/all-notifications",
  auth(UserRole.USER, UserRole.PROPERTY_OWNER, UserRole.SERVICE_PROVIDER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  NotificationController.getMyNotifications,
);

router.patch(
  "/mark-all-as-read",
  auth(UserRole.USER, UserRole.PROPERTY_OWNER, UserRole.SERVICE_PROVIDER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  NotificationController.markAllAsRead,
);

router.patch(
  "/mark-as-read/:id",
  auth(UserRole.USER, UserRole.PROPERTY_OWNER, UserRole.SERVICE_PROVIDER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  NotificationController.markAsRead,
);

router.patch(
  "/mark-as-unread/:id",
  auth(UserRole.USER, UserRole.PROPERTY_OWNER, UserRole.SERVICE_PROVIDER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  NotificationController.markAsUnread,
);

router.patch(
  "/:id",
  auth(UserRole.USER, UserRole.PROPERTY_OWNER, UserRole.SERVICE_PROVIDER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  NotificationController.markAsRead,
);

router.delete(
  "/",
  auth(UserRole.USER, UserRole.PROPERTY_OWNER, UserRole.SERVICE_PROVIDER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  NotificationController.deleteAllNotifications,
);

router.delete(
  "/:id",
  auth(UserRole.USER, UserRole.PROPERTY_OWNER, UserRole.SERVICE_PROVIDER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  NotificationController.deleteNotification,
);

export const notificationsRoute = router;
