"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import {
  useGetMyNotificationsQuery,
  useMarkAllAsReadMutation,
  useMarkAsReadMutation,
  useDeleteNotificationMutation,
  useDeleteAllNotificationsMutation,
} from "@/redux/api/notificationApi";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  triggerNotification: (message: string, type?: "success" | "error") => void;
  rolePathPrefix: string; // e.g. "/dashboard/service" or "/dashboard/owner"
}

// Relative time formatter helper
function formatTimeAgo(dateString: string | Date) {
  if (!dateString) return "";
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.max(0, Math.floor(diffMs / 1000));
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export default function NotificationDrawer({
  isOpen,
  onClose,
  triggerNotification,
  rolePathPrefix,
}: NotificationDrawerProps) {
  const router = useRouter();
  const token = useSelector((state: RootState) => state.auth.token);

  // RTK Query & Mutation Hooks
  const { data: notificationsRes } = useGetMyNotificationsQuery(undefined, { skip: !token });
  const [markAllAsRead] = useMarkAllAsReadMutation();
  const [markAsRead] = useMarkAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();
  const [deleteAllNotifications] = useDeleteAllNotificationsMutation();

  const notifications = Array.isArray(notificationsRes?.data) ? notificationsRes.data : [];
  const unreadCount = typeof notificationsRes?.unreadNotification === "number"
    ? notificationsRes.unreadNotification
    : notifications.filter((n: any) => !n.isRead).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex justify-end transition-opacity duration-300">
      {/* Backdrop click to close */}
      <div 
        className="absolute inset-0 cursor-pointer"
        onClick={onClose}
      />
      
      {/* Drawer Content */}
      <div className="relative w-full sm:w-[440px] bg-white h-full shadow-2xl flex flex-col z-[201] animate-slideLeft text-left">
        {/* Header */}
        <div className="p-5 border-b border-zinc-150 flex items-center justify-between bg-zinc-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <h3 className="text-lg font-black text-zinc-900 tracking-tight">Notifications</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-extrabold">
                {unreadCount} new
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Actions Header */}
        {notifications.length > 0 && (
          <div className="px-5 py-3 border-b border-zinc-100 flex items-center justify-between bg-white text-xs shrink-0 font-bold">
            <button
              onClick={async () => {
                try {
                  await markAllAsRead(undefined).unwrap();
                  triggerNotification("Marked all notifications as read");
                } catch (err: any) {
                  triggerNotification("Failed to mark all as read", "error");
                }
              }}
              className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Mark all read
            </button>
            <button
              onClick={async () => {
                try {
                  await deleteAllNotifications(undefined).unwrap();
                  triggerNotification("All notifications cleared");
                } catch (err: any) {
                  triggerNotification("Failed to clear notifications", "error");
                }
              }}
              className="text-red-550 hover:text-red-750 transition-colors cursor-pointer flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear all
            </button>
          </div>
        )}

        {/* List Container */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 bg-zinc-50/50">
          {notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-500 flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h4 className="text-sm font-black text-zinc-950">No notifications yet</h4>
              <p className="text-xs text-zinc-400 mt-1 font-bold">We will notify you when something happens!</p>
            </div>
          ) : (
            notifications.map((item: any) => {
              // Determine icon and color based on notification type/title
              const lowerType = (item.type || "").toLowerCase();
              const lowerTitle = (item.title || "").toLowerCase();
              let iconBg = "bg-blue-50 text-blue-600";
              let iconSvg = (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              );

              if (lowerType.includes("payment") || lowerTitle.includes("pay") || lowerTitle.includes("earn")) {
                iconBg = "bg-emerald-50 text-emerald-600";
                iconSvg = (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                );
              } else if (lowerType.includes("review") || lowerTitle.includes("star") || lowerTitle.includes("review")) {
                iconBg = "bg-amber-50 text-amber-600";
                iconSvg = (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                );
              } else if (lowerType.includes("booking") || lowerTitle.includes("job") || lowerTitle.includes("booking")) {
                iconBg = "bg-purple-50 text-purple-600";
                iconSvg = (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                );
              }

              return (
                <div 
                  key={item.id}
                  onClick={async () => {
                    if (!item.isRead) {
                      try {
                        await markAsRead(item.id).unwrap();
                      } catch (err: any) {
                        console.error("Failed to mark notification as read", err);
                      }
                    }
                    // Redirect to details if bookingId exists
                    if (item.bookingId) {
                      onClose();
                      if (rolePathPrefix.includes("propertyowner")) {
                        if (item.serviceTypes === "HOTEL" || item.type === "property_owner") {
                          router.push(`${rolePathPrefix}/guests?bookingId=${item.bookingId}`);
                        } else {
                          router.push(`${rolePathPrefix}/bookings?bookingId=${item.bookingId}`);
                        }
                      } else {
                        router.push(`${rolePathPrefix}/${item.bookingId}`);
                      }
                    }
                  }}
                  className={`p-4 flex gap-3.5 transition-all hover:bg-zinc-100/70 relative group cursor-pointer ${
                    !item.isRead ? "bg-blue-50/20" : "bg-white"
                  }`}
                >
                  {/* Unread indicator dot */}
                  {!item.isRead && (
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-600" />
                  )}

                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-2xl ${iconBg} flex items-center justify-center shrink-0`}>
                    {iconSvg}
                  </div>

                  {/* Text details */}
                  <div className="flex-1 space-y-0.5">
                    <div className="flex justify-between items-start gap-2">
                      <h5 className={`text-xs text-zinc-900 tracking-tight leading-snug font-extrabold ${!item.isRead ? "font-black" : ""}`}>
                        {item.title}
                      </h5>
                      <span className="text-[10px] text-zinc-400 font-bold shrink-0">
                        {formatTimeAgo(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 font-bold leading-normal">
                      {item.body || item.message}
                    </p>
                  </div>

                  {/* Delete Single Action */}
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        await deleteNotification(item.id).unwrap();
                        triggerNotification("Notification deleted");
                      } catch (err: any) {
                        triggerNotification("Failed to delete notification", "error");
                      }
                    }}
                    className="self-center p-1.5 rounded-lg hover:bg-red-50 text-zinc-300 hover:text-red-500 transition-colors cursor-pointer shrink-0 ml-1"
                    title="Delete notification"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
