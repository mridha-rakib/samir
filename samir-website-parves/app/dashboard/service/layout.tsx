"use client";

import { useState, useEffect, createContext, useContext, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import { logout } from "@/redux/features/authSlice";
import { performLogout } from "@/lib/logoutCleanup";
import { useGetMyProfileQuery } from "@/redux/api/userApi";
import { useStripeAccountOnboardingMutation } from "@/redux/api/paymentApi";

// Modular Sub-Components
import SPOnboarding from "../provider/components/SPOnboarding";
import { useCreateServiceMutation } from "@/redux/api/serviceApi";
import { useGetMyNotificationsQuery } from "@/redux/api/notificationApi";
import NotificationDrawer from "../components/NotificationDrawer";
import SocketProvider from "../components/SocketProvider";
import Toast from "../components/Toast";

// SVGs and Icons
import {
  HomeIconComponent,
  ChatIconComponent,
  ProfileIconComponent,
} from "../provider/components/Icons";
import { LayoutDashboard, MessageSquare, User } from "lucide-react";

// Create Notification Context
interface NotificationContextType {
  triggerNotification: (message: string, type?: "success" | "error") => void;
  openNotifications: () => void;
  unreadCount: number;
}
const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
}

type FirstServiceData = {
  name: string;
  type: string;
  price: number;
  description?: string;
  isActive: boolean;
  coverImage?: File | null;
};

function isServiceProviderProfile(profile: { role?: unknown; isService?: boolean } | undefined) {
  const role = typeof profile?.role === "string" ? profile.role.toLowerCase() : "";
  return profile?.isService === true || role.includes("service") || role.includes("provider");
}

export default function ServiceLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);

  const [spPhase, setSpPhase] = useState<"welcome" | "add-service" | "congrats" | "dashboard">("welcome");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Profile RTK Query
  const { data: profileResponse, isLoading: isLoadingProfile, refetch: refetchProfile } = useGetMyProfileQuery(undefined, { skip: !token });
  const [createService] = useCreateServiceMutation();
  const [checkStripeOnboarding] = useStripeAccountOnboardingMutation();
  const [isCheckingStripe, setIsCheckingStripe] = useState(false);
  const hasCheckedStripe = useRef(false);

  const profile = profileResponse?.data as
    | { fullName?: string; country?: string; contactNumber?: string; role?: unknown; isService?: boolean; isStripeConnected?: boolean }
    | undefined;
  const isServiceProvider = isServiceProviderProfile(profile);
  const shouldShowDashboard = spPhase === "dashboard" || isServiceProvider;
  const shouldShowLoading = !token || (token && (isLoadingProfile || !profile)) || isCheckingStripe;

  // Global Notification
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const triggerNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Notification Drawer & Unread status
  const [showNotifications, setShowNotifications] = useState(false);
  const { data: notificationsRes } = useGetMyNotificationsQuery(undefined, { skip: !token });

  const notifications = Array.isArray(notificationsRes?.data) ? notificationsRes.data : [];
  const unreadCount = typeof notificationsRes?.unreadNotification === "number"
    ? notificationsRes.unreadNotification
    : notifications.filter((n: any) => !n.isRead).length;

  const openNotifications = () => {
    setShowNotifications(true);
  };

  const handleSaveFirstService = async (serviceData: FirstServiceData) => {
    try {
      const payload = {
        serviceName: serviceData.name,
        serviceType: serviceData.type,
        address: "Dhaka, Bangladesh",
        description: serviceData.description || "Premium service offering",
        experience: 2,
        offered_services: [
          {
            price: Number(serviceData.price),
            serviceTypeName: serviceData.type,
          },
        ],
        serviceStatus: serviceData.isActive ? "ACTIVE" : "INACTIVE",
        availability: [
          {
            day: "Monday",
            slots: [{ from: "09:00 AM", to: "05:00 PM" }],
          },
        ],
      };

      const formData = new FormData();
      formData.append("data", JSON.stringify(payload));
      if (serviceData.coverImage) {
        formData.append("coverImage", serviceData.coverImage);
      }

      await createService(formData).unwrap();
      refetchProfile();
      triggerNotification("Onboarding service saved!");
    } catch {
      triggerNotification("Failed to create onboarding service", "error");
    }
  };

  // Auth Guard
  useEffect(() => {
    if (!token) {
      router.replace("/");
    }
  }, [token, router]);

  // Stripe Connection Check
  useEffect(() => {
    if (token && profileResponse?.success && profileResponse?.data && !hasCheckedStripe.current) {
      const u = profileResponse.data as any;
      const userRole = u.role;

      // If Stripe is not connected for Service Provider, we must trigger Stripe onboarding redirect
      if (userRole === "SERVICE_PROVIDER" && !u.isStripeConnected) {
        hasCheckedStripe.current = true;
        const runStripeCheck = async () => {
          try {
            setIsCheckingStripe(true);
            const res = await checkStripeOnboarding(undefined).unwrap();
            if (res.success && res.data) {
              const stripeData = res.data;
              if (stripeData.status === "pending" || stripeData.status === "requirements_due") {
                if (stripeData.onboardingLink) {
                  window.location.href = stripeData.onboardingLink;
                }
              }
            }
          } catch (error) {
            console.error("Stripe onboarding check failed:", error);
          } finally {
            setIsCheckingStripe(false);
          }
        };
        runStripeCheck();
      }
    }
  }, [profileResponse, token, checkStripeOnboarding]);

  // Show loading while profile is being fetched OR hasn't been resolved yet
  if (shouldShowLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col justify-center items-center bg-zinc-50 font-sans">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-bold text-zinc-600 animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  // Onboarding screens — only show after profile data confirms user is NOT a service provider
  if (!shouldShowDashboard) {
    return (
      <NotificationContext.Provider value={{ triggerNotification, openNotifications: () => {}, unreadCount: 0 }}>
        {notification && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 bg-white border border-zinc-200 rounded-2xl shadow-xl font-bold text-sm text-center flex items-center gap-3 animate-bounce">
            <div className={`w-3.5 h-3.5 rounded-full ${notification.type === "success" ? "bg-emerald-500" : "bg-red-500"}`} />
            {notification.message}
          </div>
        )}
        <SPOnboarding
          onSaveFirstService={handleSaveFirstService}
          onFinishOnboarding={() => setSpPhase("dashboard")}
          triggerNotification={triggerNotification}
        />
      </NotificationContext.Provider>
    );
  }

  const navItems = [
    { href: "/dashboard/service", label: "Home", icon: <LayoutDashboard className="w-6 h-6" strokeWidth={2.5} /> },
    { href: "/dashboard/service/message", label: "Messages", icon: <MessageSquare className="w-6 h-6" strokeWidth={2.5} /> },
    { href: "/dashboard/service/myprofile", label: "My Profile", icon: <User className="w-6 h-6" strokeWidth={2.5} /> },
  ];

  return (
    <NotificationContext.Provider value={{ triggerNotification, openNotifications, unreadCount }}>
      <SocketProvider />
      <div className="min-h-screen bg-zinc-100 font-sans text-zinc-900 flex flex-col relative antialiased selection:bg-blue-100 selection:text-blue-800 w-full h-full">
        {/* Toast Notification */}
        {notification && (
          <Toast
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}

        <div className="flex-1 flex flex-col md:flex-row h-screen overflow-hidden bg-zinc-50 w-full relative">
          {/* DESKTOP SIDEBAR */}
          <aside className="hidden md:flex w-64 flex-col bg-white border-r border-zinc-200 py-8 px-6 justify-between shrink-0 h-screen sticky top-0 text-left">
            <div>
              <div className="flex items-center gap-3 mb-10">
                <div className="relative h-10 w-10 rounded-xl bg-blue-50 p-2 shadow-sm shrink-0">
                  <Image src="/Logo.png" alt="Hostibook Logo" fill className="object-contain p-0.5" />
                </div>
                <span className="text-xl font-extrabold tracking-tight text-blue-600 font-sans">Hostibook</span>
              </div>

              <nav className="space-y-1.5 font-sans">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                        isActive
                          ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                          : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full flex items-center gap-3.5 px-4 py-3 text-zinc-500 hover:text-red-650 hover:bg-red-50 rounded-2xl text-sm font-bold transition-all font-sans"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </aside>

          {/* MAIN PAGE AREA */}
          <main className="flex-1 flex flex-col overflow-hidden w-full relative h-screen bg-zinc-50">
            {/* MOBILE TOP NAVIGATION HEADER */}
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
                <div className="flex items-center gap-2">
                  <div className="relative h-8 w-8 rounded-lg bg-blue-50 p-1.5 shrink-0">
                    <Image src="/Logo.png" alt="Hostibook Logo" fill className="object-contain" />
                  </div>
                  <span className="text-lg font-bold text-blue-600 font-sans">Hostibook</span>
                </div>
              </div>
              <button
                onClick={openNotifications}
                className="relative p-2 rounded-full bg-white border border-zinc-150 text-zinc-650 hover:bg-zinc-50 shadow-sm cursor-pointer"
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

            {/* Render sub-page contents */}
            {children}
          </main>
        </div>

        {/* MOBILE SIDEBAR DRAWER */}
        {shouldShowDashboard && showMobileSidebar && (
          <div className="fixed inset-0 z-[150] flex md:hidden">
            <div
              className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs transition-opacity duration-300"
              onClick={() => setShowMobileSidebar(false)}
            />
            <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white pt-5 pb-4 shadow-2xl transition-transform duration-300 transform translate-x-0">
              <div className="flex items-center justify-between px-6 mb-8">
                <div className="flex items-center gap-3 text-left">
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
                <nav className="space-y-1.5 text-left font-sans">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setShowMobileSidebar(false)}
                        className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                          isActive
                            ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                            : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                        }`}
                      >
                        {item.icon}
                        {item.label}
                      </Link>
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
                  className="w-full flex items-center gap-3.5 px-4 py-3 text-zinc-500 hover:text-red-650 hover:bg-red-50 rounded-2xl text-sm font-bold transition-all font-sans cursor-pointer text-left"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* REUSEABLE SLIDING NOTIFICATION DRAWER */}
        <NotificationDrawer
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
          triggerNotification={triggerNotification}
          rolePathPrefix="/dashboard/service"
        />

        {/* LOGOUT CONFIRM MODAL */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl animate-scaleUp">
              <div className="w-14 h-14 rounded-full bg-red-50 text-red-650 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <h3 className="text-lg font-black text-zinc-950">Confirm Logout</h3>
              <p className="text-xs text-zinc-400 mt-2 font-semibold leading-relaxed">
                Are you sure you want to end your active session and log out of the dashboard?
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-650 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    performLogout(dispatch);
                    setShowLogoutConfirm(false);
                    router.push("/");
                  }}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs cursor-pointer"
                >
                  Log out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </NotificationContext.Provider>
  );
}
