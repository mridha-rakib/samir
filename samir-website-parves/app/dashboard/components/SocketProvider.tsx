"use client";

import { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import { baseApi } from "@/redux/api/baseApi";
import socketService from "@/lib/socketService";

/**
 * SocketProvider - Connects to the backend Socket.io server
 * and listens for real-time notification events.
 *
 * When a notification arrives:
 * 1. Invalidates the RTK Query "Notification" tag so the drawer auto-refetches.
 * 2. Shows a toast popup at the top of the screen.
 *
 * Mount this inside each dashboard layout so it's active while the user is logged in.
 */
export default function SocketProvider() {
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);
  const connectedRef = useRef(false);

  // Toast state
  const [toast, setToast] = useState<{ title: string; body: string } | null>(null);

  useEffect(() => {
    if (!token || !user?.id) {
      // Not logged in, disconnect if previously connected
      if (connectedRef.current) {
        socketService.disconnect();
        connectedRef.current = false;
      }
      return;
    }

    // Connect the socket
    socketService.init(user.id, token);
    connectedRef.current = true;

    // Listen for notification events
    socketService.onNotification((data: any) => {
      // 1. Invalidate RTK Query notification cache so drawer auto-refetches
      dispatch(baseApi.util.invalidateTags(["Notification"]));

      // 2. Show toast popup
      const title = data?.title || "New Notification";
      const body = data?.body || data?.message || "";
      setToast({ title, body });
    });

    return () => {
      socketService.offNotification();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.id]);

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Render toast notification popup
  if (!toast) return null;

  return (
    <div
      className="fixed top-4 right-4 z-[9999] w-[360px] max-w-[calc(100vw-2rem)]"
      style={{
        animation: "socketToastSlideDown 0.3s ease-out",
      }}
    >
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-2xl p-4 flex items-start gap-3">
        {/* Bell Icon */}
        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h5 className="text-xs font-black text-zinc-900 truncate">{toast.title}</h5>
          <p className="text-[11px] text-zinc-500 font-bold mt-0.5 line-clamp-2">{toast.body}</p>
        </div>

        {/* Dismiss */}
        <button
          onClick={() => setToast(null)}
          className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors shrink-0 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
