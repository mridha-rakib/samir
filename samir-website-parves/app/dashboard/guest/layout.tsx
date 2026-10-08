"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import { logout } from "@/redux/features/authSlice";
import { performLogout } from "@/lib/logoutCleanup";
import { useGetMyProfileQuery } from "@/redux/api/userApi";
import { useGetMyNotificationsQuery } from "@/redux/api/notificationApi";
import NotificationDrawer from "../components/NotificationDrawer";
import SocketProvider from "../components/SocketProvider";
import Toast from "../components/Toast";

interface GuestLayoutProps {
  children: React.ReactNode;
}

interface NotificationContextType {
  triggerNotification: (message: string, type?: "success" | "error") => void;
  openNotifications: () => void;
  unreadCount: number;
}

export const GuestNotificationContext = createContext<NotificationContextType | null>(null);

export function useNotification() {
  const context = useContext(GuestNotificationContext);
  if (context) return context;
  return {
    triggerNotification: (msg: string, type?: "success" | "error") => {
      console.warn("Notification triggered outside Guest Provider:", msg, type);
    },
    openNotifications: () => {},
    unreadCount: 0,
  };
}

export default function GuestLayout({ children }: GuestLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();

  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);

  // Redirect to login if no token is active
  useEffect(() => {
    if (!token) {
      router.replace("/");
    }
  }, [token, router]);

  // Fetch user profile dynamically
  const { data: profileResponse, isLoading: isLoadingProfile } = useGetMyProfileQuery(undefined, { skip: !token });

  const [notification, setNotification] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch notifications dynamically
  const { data: notificationsRes } = useGetMyNotificationsQuery(undefined, { skip: !token });

  const notifications = Array.isArray(notificationsRes?.data) ? notificationsRes.data : [];
  const unreadCount = typeof notificationsRes?.unreadNotification === "number"
    ? notificationsRes.unreadNotification
    : notifications.filter((n: any) => !n.isRead).length;

  const triggerNotification = (msg: string, type: "success" | "error" = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  let activeTab: "home" | "favorites" | "bookings" | "chat" | "profile" = "home";
  if (pathname.includes("/favorites")) activeTab = "favorites";
  else if (pathname.includes("/bookings")) activeTab = "bookings";
  else if (pathname.includes("/chat")) activeTab = "chat";
  else if (pathname.includes("/profile")) activeTab = "profile";

  const navigationItems = [
    {
      id: "home" as const,
      label: "Explore Properties",
      path: "/dashboard/guest/home",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      id: "favorites" as const,
      label: "Favorites",
      path: "/dashboard/guest/favorites",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      )
    },
    {
      id: "bookings" as const,
      label: "My Bookings",
      path: "/dashboard/guest/bookings",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: "chat" as const,
      label: "Messages",
      path: "/dashboard/guest/chat",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    },
    {
      id: "profile" as const,
      label: "My Profile",
      path: "/dashboard/guest/profile",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    }
  ];

  if (!token || isLoadingProfile) {
    return (
      <div className="min-h-screen w-full flex flex-col justify-center items-center bg-zinc-50 font-sans">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-bold text-zinc-500 animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <GuestNotificationContext.Provider value={{ triggerNotification, openNotifications: () => setShowNotifications(true), unreadCount }}>
      <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 flex flex-col relative antialiased selection:bg-blue-100 selection:text-blue-800">
        <SocketProvider />

        {/* Toast Notification Banner */}
        {notification && (
          <Toast
            message={notification.msg}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}

        {/* Main Container Layout */}
        <div className="flex-1 flex flex-col md:flex-row h-screen overflow-hidden">

          {/* DESKTOP SIDEBAR */}
          <aside className="hidden md:flex w-64 flex-col bg-white border-r border-zinc-200 py-8 px-6 justify-between shrink-0 h-screen sticky top-0">
            <div>
              {/* Logo & Notification Bell */}
              <div className="flex items-center justify-between mb-10 text-left w-full">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/dashboard/guest/home")}>
                  <div className="relative h-10 w-10 rounded-xl bg-blue-50 p-2 shadow-sm shrink-0">
                    <Image src="/Logo.png" alt="Hostibook Logo" fill className="object-contain p-0.5" />
                  </div>
                  <span className="text-xl font-extrabold tracking-tight text-blue-600">Hostibook</span>
                </div>

        
              </div>

              {/* Navigation Menus */}
              <nav className="space-y-1.5">
                {navigationItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => router.push(item.path)}
                      className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer ${isActive
                        ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                        : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Bottom user card / logout link */}
            <div className="border-t border-zinc-100 pt-6">
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full flex items-center gap-3.5 px-4 py-3 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-2xl text-sm font-bold transition-all cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </aside>

          {/* MAIN DISPLAY PORT */}
          <main className="flex-1 flex flex-col overflow-hidden w-full relative h-screen bg-zinc-50 pb-20 md:pb-0">

            {/* MOBILE NAVIGATION BAR (TOP) */}
            <div className="flex md:hidden items-center justify-between p-4 pb-3 border-b border-zinc-200 bg-white shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowMobileSidebar(true)}
                  className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-655 cursor-pointer"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div className="flex items-center gap-2" onClick={() => router.push("/dashboard/guest/home")}>
                  <div className="relative h-8 w-8 rounded-lg bg-blue-50 p-1.5 shrink-0">
                    <Image src="/Logo.png" alt="Hostibook Logo" fill className="object-contain" />
                  </div>
                  <span className="text-lg font-bold text-blue-600">Hostibook</span>
                </div>
              </div>
              <button
                onClick={() => setShowNotifications(true)}
                className="relative p-2 rounded-full border border-zinc-200 bg-white shadow-sm text-zinc-500 cursor-pointer hover:bg-zinc-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-extrabold text-white ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* MOBILE SIDEBAR DRAWER FOR GUEST */}
            {showMobileSidebar && (
              <div className="fixed inset-0 z-[150] flex md:hidden">
                <div
                  className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs transition-opacity duration-300"
                  onClick={() => setShowMobileSidebar(false)}
                />
                <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white pt-5 pb-4 shadow-2xl transition-transform duration-300 transform translate-x-0">
                  <div className="flex items-center justify-between px-6 mb-8">
                    <div className="flex items-center gap-3 text-left animate-fadeIn" onClick={() => { router.push("/dashboard/guest/home"); setShowMobileSidebar(false); }}>
                      <div className="relative h-10 w-10 rounded-xl bg-blue-50 p-2 shadow-sm shrink-0">
                        <Image src="/Logo.png" alt="Hostibook Logo" fill className="object-contain p-0.5" />
                      </div>
                      <span className="text-xl font-extrabold tracking-tight text-blue-600">Hostibook</span>
                    </div>
                    <button
                      type="button"
                      className="rounded-lg p-1 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                      onClick={() => setShowMobileSidebar(false)}
                    >
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex-1 h-0 overflow-y-auto px-4">
                    <nav className="space-y-1.5 text-left">
                      {navigationItems.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              router.push(item.path);
                              setShowMobileSidebar(false);
                            }}
                            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer ${isActive
                              ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                              : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                            }`}
                          >
                            {item.icon}
                            {item.label}
                          </button>
                        );
                      })}
                    </nav>
                  </div>

                  <div className="px-4 mt-auto">
                    <button
                      onClick={() => {
                        setShowMobileSidebar(false);
                        setShowLogoutConfirm(true);
                      }}
                      className="w-full flex items-center gap-3.5 px-4 py-3 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-2xl text-sm font-bold transition-all cursor-pointer text-left"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ACTIVE CONTENT CONTROLLER */}
            <div className="flex-1 overflow-y-auto relative h-full w-full">
              {children}
            </div>

            {/* MOBILE BOTTOM NAVIGATION BAR */}
            <footer className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-zinc-200 flex justify-around items-center px-2 z-[90] shadow-lg">
              {navigationItems.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => router.push(tab.path)}
                  className={`flex flex-col items-center gap-0.5 transition-all cursor-pointer ${activeTab === tab.id
                    ? "text-blue-600 font-black scale-105"
                    : "text-zinc-400 hover:text-zinc-650"
                  }`}
                >
                  {tab.icon}
                  <span className="text-[10px] font-bold">{tab.label}</span>
                </button>
              ))}
            </footer>

          </main>
        </div>

        {/* REUSEABLE SLIDING NOTIFICATION DRAWER */}
        <NotificationDrawer
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
          triggerNotification={triggerNotification}
          rolePathPrefix="/dashboard/guest"
        />

        {/* LOGOUT CONFIRM MODAL */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
            <div className="w-full max-w-[280px] bg-white border border-zinc-200 rounded-3xl p-6 shadow-2xl text-center space-y-4">
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-wider leading-relaxed">Do you want to Log out?</h3>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    performLogout(dispatch);
                    setShowLogoutConfirm(false);
                    triggerNotification("Logged out successfully");
                    router.push("/");
                  }}
                  className="flex-1 py-2.5 border-2 border-red-500 text-red-500 font-extrabold rounded-2xl text-xs hover:bg-red-50 transition-colors"
                >
                  Yes
                </button>
                <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-2.5 bg-blue-600 text-white font-extrabold rounded-2xl text-xs hover:bg-blue-700 transition-colors">No</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </GuestNotificationContext.Provider>
  );
}
