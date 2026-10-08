"use client";

import React, { useState, useRef, useEffect, createContext, useContext } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import { logout } from "@/redux/features/authSlice";
import { performLogout } from "@/lib/logoutCleanup";
import { useGetMyProfileQuery, useUpdateProfileMutation, useDeleteMyAccountMutation } from "@/redux/api/userApi";
import { useChangePasswordMutation } from "@/redux/api/authApi";
import { useStripeAccountOnboardingMutation } from "@/redux/api/paymentApi";
import {
  useGetAllSubscriptionsPlanQuery,
  useCreateCheckoutSessionForSubscriptionMutation
} from "@/redux/api/subscriptionApi";
import {
  CheckIcon,
  ShieldLockIcon,
  TrashIcon
} from "./Icons";
import { LayoutDashboard, Building2, Briefcase, CalendarCheck, Users, Wallet, MessageSquare, User } from "lucide-react";
import { useGetMyNotificationsQuery } from "@/redux/api/notificationApi";
import NotificationDrawer from "../../components/NotificationDrawer";
import SocketProvider from "../../components/SocketProvider";
import Toast from "../../components/Toast";

interface PropertyOwnerLayoutProps {
  children: React.ReactNode;
}

interface NotificationContextType {
  triggerNotification: (message: string, type?: "success" | "error") => void;
  openNotifications: () => void;
  unreadCount: number;
  navigateTab: (tab: string) => void;
}
export const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context) return context;
  return {
    triggerNotification: (msg: string, type?: "success" | "error") => {
      console.warn("Notification triggered outside Provider:", msg, type);
    },
    openNotifications: () => { },
    unreadCount: 0,
    navigateTab: (tab: string) => {
      console.warn("navigateTab triggered outside Provider:", tab);
    },
  };
}

export default function PropertyOwnerLayout({ children }: PropertyOwnerLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();

  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);

  // Determine active tab from URL path
  let activeTab: "home" | "properties" | "services" | "bookings" | "guests" | "earnings" | "chat" | "profile" = "home";
  if (pathname.includes("/my_properties")) activeTab = "properties";
  else if (pathname.includes("/services")) activeTab = "services";
  else if (pathname.includes("/bookings")) activeTab = "bookings";
  else if (pathname.includes("/guests")) activeTab = "guests";
  else if (pathname.includes("/earnings")) activeTab = "earnings";
  else if (pathname.includes("/chat")) activeTab = "chat";
  else if (pathname.includes("/profile")) activeTab = "profile";

  // Redirect to login if no token is active
  useEffect(() => {
    if (!token) {
      router.replace("/");
    }
  }, [token, router]);

  // Fetch user profile dynamically
  const { data: profileResponse, isLoading: isLoadingProfile, isFetching: isFetchingProfile } = useGetMyProfileQuery(undefined, { skip: !token });
  const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();
  const [deleteAccount] = useDeleteMyAccountMutation();

  // Subscription plans and checkout API queries
  const { data: plansRes } = useGetAllSubscriptionsPlanQuery(undefined, { skip: !token });
  const [createCheckoutSession, { isLoading: isCreatingSession }] = useCreateCheckoutSessionForSubscriptionMutation();
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const plans = plansRes?.data || [];
  const selectedPlan = plans.find((p: any) => p.id === selectedPlanId) || plans[0];

  useEffect(() => {
    if (plans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(plans[0].id);
    }
  }, [plans, selectedPlanId]);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [checkStripeOnboarding] = useStripeAccountOnboardingMutation();
  const [isCheckingStripe, setIsCheckingStripe] = useState(false);
  const hasCheckedStripe = useRef(false);

  // App Phases: "paywall", "checkout", "dashboard"
  const [phase, setPhase] = useState<"paywall" | "checkout" | "dashboard">(
    user?.isSubscribed ? "dashboard" : "paywall"
  );

  useEffect(() => {
    if (token && profileResponse?.success && profileResponse?.data && !hasCheckedStripe.current) {
      const u = profileResponse.data;
      const userRole = u.role;

      // If Stripe is not connected, we must trigger Stripe onboarding redirect
      if (userRole === "PROPERTY_OWNER" && !u.isStripeConnected) {
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

  useEffect(() => {
    console.log("[PropertyOwnerLayout] profileResponse changed:", profileResponse);
    if (profileResponse?.success && profileResponse?.data) {
      const u = profileResponse.data;
      console.log(`[PropertyOwnerLayout] User Profile data - role: ${u.role}, isSubscribed: ${u.isSubscribed}, isStripeConnected: ${u.isStripeConnected}`);
      if (u.role === "PROPERTY_OWNER") {
        if (u.isSubscribed) {
          console.log("[PropertyOwnerLayout] User is subscribed, setting phase to 'dashboard'");
          setPhase("dashboard");
        } else {
          console.log("[PropertyOwnerLayout] User is NOT subscribed, setting phase to 'paywall'");
          setPhase("paywall");
        }
      }
    }
  }, [profileResponse]);

  // Toast Notification state
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

  // Checkout process simulation
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [billingName, setBillingName] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  const handleProceedToSubscriptionCheckout = async () => {
    const planId = selectedPlanId || (plans[0]?.id);
    if (!planId) {
      triggerNotification("No subscription plan available", "error");
      return;
    }
    try {
      const res = await createCheckoutSession({ planId }).unwrap();
      if (res.success && res.data?.url) {
        window.open(res.data.url, "_blank");
      } else {
        triggerNotification(res.message || "Failed to create subscription checkout session", "error");
      }
    } catch (err: any) {
      console.error("Subscription checkout error:", err);
      triggerNotification(err?.data?.message || "Failed to direct to Stripe gateway", "error");
    }
  };

  // Modals state
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const handleLogout = () => {
    performLogout(dispatch);
    router.push("/");
  };

  const handleTabClick = (tabId: string) => {
    let roleParam = "property owner";
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      roleParam = searchParams.get("role") || "property owner";
    }
    if (tabId === "home") {
      router.push(`/dashboard/propertyowner/home?role=${encodeURIComponent(roleParam)}`);
    } else if (tabId === "properties") {
      router.push(`/dashboard/propertyowner/my_properties?role=${encodeURIComponent(roleParam)}`);
    } else {
      router.push(`/dashboard/propertyowner/${tabId}?role=${encodeURIComponent(roleParam)}`);
    }
  };

  const isProfileLoadingOrVerifying = 
    isLoadingProfile || 
    (isFetchingProfile && !profileResponse?.data?.isSubscribed);

  console.log("[PropertyOwnerLayout Render] State:", {
    isMounted,
    hasToken: !!token,
    isLoadingProfile,
    isFetchingProfile,
    isProfileLoadingOrVerifying,
    isCheckingStripe,
    profileResponseData: profileResponse?.data,
    phase,
    activeTab
  });

  if (!isMounted || (token && isProfileLoadingOrVerifying)) {
    console.log("[PropertyOwnerLayout Render] Showing Loading Guard Spinner Screen");
    return (
      <div className="min-h-screen w-full flex flex-col justify-center items-center bg-zinc-50 font-sans">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-bold text-zinc-500 animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  if (isCheckingStripe) {
    console.log("[PropertyOwnerLayout Render] Showing Stripe Onboarding Verification Screen");
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-zinc-50 font-sans">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-bold text-zinc-655">Verifying payment integration...</p>
      </div>
    );
  }

  const derivedPhase = profileResponse?.data?.isSubscribed ? "dashboard" : "paywall";
  console.log(`[PropertyOwnerLayout Render] Rendering Main Portal with derivedPhase: ${derivedPhase}`);
  return (
    <NotificationContext.Provider value={{ triggerNotification, openNotifications, unreadCount, navigateTab: handleTabClick }}>
      <SocketProvider />
      <div className="min-h-screen bg-zinc-100 font-sans text-zinc-900 flex flex-col relative antialiased selection:bg-blue-100 selection:text-blue-800">

        {/* Toast Notification */}
        {notification && (
          <Toast
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}

        {/* PAYWALL PHASE */}
        {derivedPhase === "paywall" && (
          <div className="flex-1 flex flex-col justify-center items-center px-4 py-12">
            <div className="w-full max-w-[420px] bg-white border border-zinc-150 rounded-3xl shadow-2xl p-6 sm:p-8 text-center flex flex-col justify-between relative overflow-hidden">
              <div>
                <div className="w-full flex justify-center mb-4">
                  <div className="relative h-12 w-12 rounded-xl bg-blue-50 p-2 shadow-sm">
                    <Image src="/Logo.png" alt="Hostibook Logo" fill className="object-contain p-0.5" />
                  </div>
                </div>
                <h1 className="text-2xl font-black text-zinc-900 tracking-tight text-center">Get Started with Hostibook</h1>
                <p className="mt-2 text-xs font-semibold text-zinc-400 max-w-xs mx-auto leading-relaxed text-center">
                  To unlock property management features, complete a one-time setup payment.
                </p>
              </div>

              {plans.length > 1 && (
                <div className="mb-4 text-left">
                  <label className="block text-[10px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">Select Subscription Plan</label>
                  <select
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-zinc-200 outline-none text-xs font-bold bg-zinc-50 cursor-pointer"
                  >
                    {plans.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - ${p.price?.amount || 50} / {p.validity?.value} {p.validity?.type || "year"}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedPlan ? (
                <div className="my-6 p-5 border border-zinc-150 rounded-2xl bg-zinc-50/50 text-left">
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-extrabold uppercase tracking-wider border border-blue-100">
                    {selectedPlan.name}
                  </span>
                  <h2 className="text-3xl font-black text-blue-600 mt-3 text-center">
                    ${selectedPlan.price?.amount || 50} / {selectedPlan.validity?.value} {selectedPlan.validity?.type || "year"}
                  </h2>
                  <p className="text-xs text-zinc-400 font-semibold mt-1.5 text-center">
                    Includes full property management features and hosting tools.
                  </p>
                </div>
              ) : (
                <div className="my-6 p-5 border border-zinc-150 rounded-2xl bg-zinc-50/50">
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-extrabold uppercase tracking-wider border border-blue-100">
                    Property Owner Plan
                  </span>
                  <h2 className="text-3xl font-black text-blue-600 mt-3 text-center">$ 50 / year</h2>
                  <p className="text-xs text-zinc-400 font-semibold mt-1 text-center">
                    Includes unlimited listings, guard coordination, and chat support.
                  </p>
                </div>
              )}

              <div className="space-y-3.5 text-left mb-6">
                {(selectedPlan?.features && selectedPlan.features.length > 0
                  ? selectedPlan.features
                  : [
                    "Manage multiple properties",
                    "Assign security guards",
                    "Automated WhatsApp alerts",
                    "Direct payment to service providers",
                    "24/7 assistant support",
                  ]
                ).map((text: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckIcon />
                    <span className="text-xs font-bold text-zinc-700">{text}</span>
                  </div>
                ))}
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-start gap-3 text-left mb-6">
                <ShieldLockIcon />
                <div className="flex-1">
                  <p className="text-[11px] font-bold text-blue-800 leading-tight">Secure Payment Gateway</p>
                  <p className="text-[10px] font-medium text-blue-600/90 mt-0.5 leading-normal">
                    Your payment is secured and encrypted via Stripe.
                  </p>
                </div>
              </div>

              <div>
                <button
                  onClick={handleProceedToSubscriptionCheckout}
                  disabled={isCreatingSession}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/10 active:scale-[0.99] transition-all text-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  {isCreatingSession ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Directing to Stripe...
                    </>
                  ) : (
                    "Proceed to Payment"
                  )}
                </button>
                <p className="mt-3 text-[10px] font-semibold text-zinc-400 text-center">
                  Powered by Stripe • Secure & Encrypted Payments
                </p>
              </div>
            </div>
          </div>
        )}

        {/* MAIN PORTAL DASHBOARD PHASE */}
        {derivedPhase === "dashboard" && (
          <div className="flex-1 flex flex-col md:flex-row h-screen overflow-hidden bg-zinc-50">

            {/* DESKTOP SIDEBAR */}
            <aside className="hidden md:flex w-64 flex-col bg-white border-r border-zinc-200 py-8 px-6 justify-between shrink-0 h-screen sticky top-0">
              <div>
                <div className="flex items-center gap-3 mb-10 text-left">
                  <div className="relative h-10 w-10 rounded-xl bg-blue-50 p-2 shadow-sm shrink-0">
                    <Image src="/Logo.png" alt="Hostibook Logo" fill className="object-contain p-0.5" />
                  </div>
                  <span className="text-xl font-extrabold tracking-tight text-blue-600">Hostibook</span>
                </div>

                <nav className="space-y-1.5 text-left">
                  {[
                    { id: "home", label: "Home", icon: <LayoutDashboard className="w-6 h-6" strokeWidth={2.5} /> },
                    { id: "properties", label: "My Properties", icon: <Building2 className="w-6 h-6" strokeWidth={2.5} /> },
                    { id: "services", label: "Find Services", icon: <Briefcase className="w-6 h-6" strokeWidth={2.5} /> },
                    { id: "bookings", label: "Service Bookings", icon: <CalendarCheck className="w-6 h-6" strokeWidth={2.5} /> },
                    { id: "guests", label: "Manage Guest", icon: <Users className="w-6 h-6" strokeWidth={2.5} /> },
                    { id: "earnings", label: "My Earnings", icon: <Wallet className="w-6 h-6" strokeWidth={2.5} /> },
                    { id: "chat", label: "Messages", icon: <MessageSquare className="w-6 h-6" strokeWidth={2.5} /> },
                    { id: "profile", label: "My Profile", icon: <User className="w-6 h-6" strokeWidth={2.5} /> },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer ${activeTab === item.id
                          ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                          : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                        }`}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  ))}
                </nav>
              </div>

              <div>
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="w-full flex items-center gap-3.5 px-4 py-3 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-2xl text-sm font-bold transition-all cursor-pointer"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
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
                    className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-650 cursor-pointer"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  <div className="flex items-center gap-2">
                    <div className="relative h-8 w-8 rounded-lg bg-blue-50 p-1.5 shrink-0">
                      <Image src="/Logo.png" alt="Hostibook Logo" fill className="object-contain" />
                    </div>
                    <span className="text-lg font-bold text-blue-600">Hostibook</span>
                  </div>
                </div>
                <button
                  onClick={openNotifications}
                  className="relative p-2 rounded-full bg-white border border-zinc-150 text-zinc-650 hover:bg-zinc-50 shadow-sm cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-extrabold text-white ring-2 ring-white">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>

              {/* RENDER THE CHILD PAGE COMPONENT */}
              {React.cloneElement(children as any, {
                profName: profileResponse?.data?.fullName || user?.fullName || "Owner",
                triggerNotification,
                onNavigateTab: handleTabClick,
                onStartWizard: () => {
                  let roleParam = "property owner";
                  if (typeof window !== "undefined") {
                    const searchParams = new URLSearchParams(window.location.search);
                    roleParam = searchParams.get("role") || "property owner";
                  }
                  router.push(`/dashboard/propertyowner/my_properties?role=${encodeURIComponent(roleParam)}&wizard=true`);
                }
              })}
            </main>
          </div>
        )}

        {/* MOBILE SIDEBAR DRAWER */}
        {phase === "dashboard" && showMobileSidebar && (
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
                <nav className="space-y-1.5 text-left">
                  {[
                    { id: "home", label: "Home", icon: <LayoutDashboard className="w-6 h-6" strokeWidth={2.5} /> },
                    { id: "properties", label: "My Properties", icon: <Building2 className="w-6 h-6" strokeWidth={2.5} /> },
                    { id: "services", label: "Find Services", icon: <Briefcase className="w-6 h-6" strokeWidth={2.5} /> },
                    { id: "bookings", label: "Service Bookings", icon: <CalendarCheck className="w-6 h-6" strokeWidth={2.5} /> },
                    { id: "guests", label: "Manage Guest", icon: <Users className="w-6 h-6" strokeWidth={2.5} /> },
                    { id: "earnings", label: "My Earnings", icon: <Wallet className="w-6 h-6" strokeWidth={2.5} /> },
                    { id: "chat", label: "Messages", icon: <MessageSquare className="w-6 h-6" strokeWidth={2.5} /> },
                    { id: "profile", label: "My Profile", icon: <User className="w-6 h-6" strokeWidth={2.5} /> },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        handleTabClick(item.id);
                        setShowMobileSidebar(false);
                      }}
                      className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer ${activeTab === item.id
                          ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                          : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                        }`}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  ))}
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
          rolePathPrefix="/dashboard/propertyowner"
        />

        {/* LOGOUT CONFIRM MODAL */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs">
            <div className="w-full max-w-sm bg-white border border-zinc-150 p-6 rounded-3xl shadow-2xl text-center">
              <h3 className="text-lg font-black text-zinc-900 tracking-tight">Logout</h3>
              <p className="text-xs font-semibold text-zinc-400 mt-2 leading-relaxed">
                Are you sure you want to log out of your session?
              </p>
              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="py-3.5 border border-zinc-200 hover:bg-zinc-50 text-zinc-650 rounded-2xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="py-3.5 bg-red-500 hover:bg-red-650 text-white rounded-2xl font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </NotificationContext.Provider>
  );
}
