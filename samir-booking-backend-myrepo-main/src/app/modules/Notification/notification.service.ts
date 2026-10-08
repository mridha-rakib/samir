import { Notifications } from "@prisma/client";
import prisma from "../../../shared/prisma";
import SocketHelper from "../../../helpars/socketHelper";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";

const createNotification = async (data: Partial<Notifications>) => {
  const result = await prisma.notifications.create({
    data: data as any,
  });

  if (result && result.receiverId) {
    // 1. Send Real-time Socket Notification (for active app users)
    SocketHelper.emitToUser(result.receiverId, "notification", result);
  }

  return result;
};

const getMyNotifications = async (userId: string, query: any) => {
  const { page = 1, limit = 10 } = query;
  const skip = (Number(page) - 1) * Number(limit);

  const result = await prisma.notifications.findMany({
    where: {
      receiverId: userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take: Number(limit),
  });

  const total = await prisma.notifications.count({
    where: {
      receiverId: userId,
    },
  });

  const unreadNotification = await prisma.notifications.count({
    where: {
      receiverId: userId,
      isRead: false,
    },
  });

  return {
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
    },
    unreadNotification,
    data: result,
  };
};

const markAsRead = async (notificationId: string) => {
  const result = await prisma.notifications.update({
    where: {
      id: notificationId,
    },
    data: {
      isRead: true,
    },
  });

  return result;
};

const markAsUnread = async (notificationId: string) => {
  const result = await prisma.notifications.update({
    where: {
      id: notificationId,
    },
    data: {
      isRead: false,
    },
  });

  return result;
};

const markAllAsRead = async (userId: string) => {
  const result = await prisma.notifications.updateMany({
    where: {
      receiverId: userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  return result;
};

const deleteNotification = async (userId: string, notificationId: string) => {
  const notification = await prisma.notifications.findUnique({
    where: {
      id: notificationId,
    },
  });

  if (!notification) {
    throw new ApiError(httpStatus.NOT_FOUND, "Notification not found");
  }

  if (notification.receiverId !== userId) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You do not have permission to delete this notification"
    );
  }

  const result = await prisma.notifications.delete({
    where: {
      id: notificationId,
    },
  });

  return result;
};

const deleteAllNotifications = async (userId: string) => {
  const result = await prisma.notifications.deleteMany({
    where: {
      receiverId: userId,
    },
  });

  return result;
};

export const NotificationService = {
  createNotification,
  getMyNotifications,
  markAsRead,
  markAsUnread,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
};
