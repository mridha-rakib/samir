"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

// Modular Property Owner Sub-Components
import OwnerHome from "./owner/components/OwnerHome";
import OwnerProperties from "./owner/components/OwnerProperties";
import OwnerBookings from "./owner/components/OwnerBookings";
import OwnerGuests from "./owner/components/OwnerGuests";
import OwnerEarnings from "./owner/components/OwnerEarnings";
import {
  CheckIcon,
  ShieldLockIcon,
  TrashIcon
} from "./owner/components/Icons";
import { LayoutDashboard, Building2, Briefcase, CalendarCheck, Users, Wallet, MessageSquare, User } from "lucide-react";
import Toast from "./components/Toast";

// Initial mock conversations
const initialChats = [
  {
    id: 1,
    name: "John Smith",
    role: "Property Manager",
    lastMsg: "Hello, are you here?",
    time: "1:20 PM",
    unread: true,
    status: "active",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80",
    history: [
      { text: "Hello, are you here?", type: "received", time: "1:18 PM" },
      { text: "Yes, I am reviewing the setup now.", type: "sent", time: "1:19 PM" },
      { text: "Great, please let me know if you need help.", type: "received", time: "1:20 PM" },
    ],
  },
  {
    id: 2,
    name: "Jhonson",
    role: "House Keeper",
    lastMsg: "Integer mauris nibh, tristique fringilla?",
    time: "10:00 AM",
    unread: false,
    status: "active",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
    history: [
      { text: "Cras eget placerat diam. Aliquam mauris libero, semper vel nisi non, suscipit.", type: "sent", time: "09:55 AM" },
      { text: "Sed ac ante dolor. Mauris nec erat vitae felis pharetra molestie vitae a nibh.", type: "received", time: "09:57 AM" },
      { text: "Duis eleifend, quam eu tristique egestas, justo justo vulputate?", type: "sent", time: "09:58 AM" },
      { text: "Integer mauris nibh, tristique fringilla?", type: "received", time: "10:00 AM" },
    ],
  },
  {
    id: 3,
    name: "Rahim Plumbing",
    role: "Plumber",
    lastMsg: "I will arrive at 4 PM.",
    time: "Yesterday",
    unread: false,
    status: "away",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",
    history: [
      { text: "Are you free today for fixing the pipe?", type: "sent", time: "Yesterday" },
      { text: "Yes, I will arrive at 4 PM.", type: "received", time: "Yesterday" },
    ],
  },
];

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Role detection
  const roleParam = searchParams.get("role") || "";

  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);

  const authRole = user?.role || "";
  const isServiceProvider = authRole === "SERVICE_PROVIDER" || roleParam.toLowerCase().includes("service") || roleParam.toLowerCase().includes("provider");
  const isGuest = authRole === "USER" || roleParam.toLowerCase().includes("guest");

  // Auto-redirect to login if no token is active
  useEffect(() => {
    if (!token) {
      router.replace("/");
    }
  }, [token, router]);

  // Redirect service providers to the folder-based route
  useEffect(() => {
    if (isServiceProvider) {
      router.replace("/dashboard/service");
    }
  }, [isServiceProvider, router]);

  // Redirect guests to the folder-based route
  useEffect(() => {
    if (isGuest) {
      router.replace("/dashboard/guest/home");
    }
  }, [isGuest, router]);

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

  // isMounted prevents the SSR flash: on the server localStorage/cookies
  // are unavailable, so user is null and isServiceProvider is false.
  // We hold on a loading screen until the client has hydrated.
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [checkStripeOnboarding] = useStripeAccountOnboardingMutation();
  const [isCheckingStripe, setIsCheckingStripe] = useState(false);
  const hasCheckedStripe = useRef(false);

  useEffect(() => {
    if (token && profileResponse?.success && profileResponse?.data && !hasCheckedStripe.current) {
      const u = profileResponse.data;
      const userRole = u.role;

      // If Stripe is not connected, we must trigger Stripe onboarding redirect
      if ((userRole === "SERVICE_PROVIDER" || userRole === "PROPERTY_OWNER") && !u.isStripeConnected) {
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

  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // App Phases: "paywall", "checkout", "dashboard"
  const [phase, setPhase] = useState<"paywall" | "checkout" | "dashboard">(
    user?.isSubscribed ? "dashboard" : "paywall"
  );

  // Dashboard Active Tab: "home", "properties", "bookings", "guests", "earnings", "chat", "profile"
  const [activeTab, setActiveTab] = useState<"home" | "properties" | "bookings" | "guests" | "earnings" | "chat" | "profile">("home");

  // Load active tab from localStorage on mount
  useEffect(() => {
    const savedTab = localStorage.getItem("ownerActiveTab");
    if (savedTab === "home" || savedTab === "properties" || savedTab === "bookings" || savedTab === "guests" || savedTab === "earnings" || savedTab === "chat" || savedTab === "profile") {
      setActiveTab(savedTab as any);
    }
  }, []);

  // Persist active tab to localStorage on change
  useEffect(() => {
    localStorage.setItem("ownerActiveTab", activeTab);
  }, [activeTab]);

  // Add Property Wizard State: "list" (shows properties grid) vs "wizard" (multi-step form)
  const [wizardActive, setWizardActive] = useState(false);

  // checkout inputs
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [billingName, setBillingName] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  // ==========================================
  // REFINED CHAT STATES
  // ==========================================
  const [chats, setChats] = useState(initialChats);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [typedMessage, setTypedMessage] = useState("");
  const [searchChatQuery, setSearchChatQuery] = useState("");
  const messageEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat history
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChatId, chats]);

  // Send message handler
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || activeChatId === null) return;

    setChats(
      chats.map((c) => {
        if (c.id === activeChatId) {
          return {
            ...c,
            lastMsg: typedMessage.trim(),
            time: "1:20 PM",
            history: [
              ...c.history,
              { text: typedMessage.trim(), type: "sent", time: "1:20 PM" },
            ],
          };
        }
        return c;
      })
    );
    setTypedMessage("");
  };

  // ==========================================
  // REFINED PROFILE STATES
  // ==========================================
  const [profileSubView, setProfileSubView] = useState<"main" | "edit" | "settings" | "password" | "terms" | "privacy" | "about" | "payment">("main");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Edit profile fields state
  const [profName, setProfName] = useState("");
  const [profDob, setProfDob] = useState("28/11/1997");
  const [profCountry, setProfCountry] = useState("");
  const [profPhone, setProfPhone] = useState("");

  // Populate fields dynamically from backend response
  useEffect(() => {
    console.log("[page.tsx] profileResponse changed:", profileResponse);
    if (profileResponse?.success && profileResponse?.data) {
      const u = profileResponse.data;
      if (u.fullName) setProfName(u.fullName);
      if (u.country) setProfCountry(u.country);
      if (u.contactNumber) setProfPhone(u.contactNumber);

      console.log(`[page.tsx] User Profile data - role: ${u.role}, isSubscribed: ${u.isSubscribed}, isStripeConnected: ${u.isStripeConnected}`);
      if (u.role === "PROPERTY_OWNER") {
        if (u.isSubscribed) {
          console.log("[page.tsx] User is subscribed, redirecting to propertyowner/home");
          router.replace(`/dashboard/propertyowner/home?role=${encodeURIComponent(roleParam || "property owner")}`);
        } else {
          console.log("[page.tsx] User is NOT subscribed, setting phase to 'paywall'");
          setPhase("paywall");
        }
      }
    }
  }, [profileResponse]);

  const handleSaveProfile = async () => {
    try {
      const formData = new FormData();
      const bodyData = {
        fullName: profName,
        contactNumber: profPhone,
        country: profCountry,
      };
      formData.append("data", JSON.stringify(bodyData));
      if (profileImageFile) {
        formData.append("profileImage", profileImageFile);
      }

      const response = await updateProfile(formData).unwrap();
      if (response.success) {
        triggerNotification("Profile details saved successfully!");
        setProfileSubView("main");
      } else {
        triggerNotification(response.message || "Failed to update profile", "error");
      }
    } catch (err: any) {
      console.error("Save profile error:", err);
      triggerNotification(err?.data?.message || err?.message || "Failed to update profile", "error");
    }
  };

  const handleChangePassword = async () => {
    if (!currPass || !newPass || !confPass) {
      triggerNotification("Please fill in fields", "error");
      return;
    }
    if (newPass !== confPass) {
      triggerNotification("Passwords do not match", "error");
      return;
    }
    try {
      const response = await changePassword({
        oldPassword: currPass,
        newPassword: newPass,
      }).unwrap();

      if (response.success) {
        triggerNotification("Password updated successfully!");
        setProfileSubView("settings");
        setCurrPass("");
        setNewPass("");
        setConfPass("");
      } else {
        triggerNotification(response.message || "Failed to change password", "error");
      }
    } catch (err: any) {
      console.error("Change password error:", err);
      triggerNotification(err?.data?.message || err?.message || "Incorrect current password!", "error");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const response = await deleteAccount(undefined).unwrap();
      if (response.success) {
        performLogout(dispatch);
        setShowDeleteConfirm(false);
        setProfileSubView("main");
        triggerNotification("Account deleted successfully!");
        router.push("/");
      } else {
        triggerNotification(response.message || "Failed to delete account", "error");
      }
    } catch (err: any) {
      console.error("Delete account error:", err);
      triggerNotification(err?.data?.message || err?.message || "Failed to delete account", "error");
    }
  };

  // Passwords
  const [currPass, setCurrPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confPass, setConfPass] = useState("");
  const [showCurrPass, setShowCurrPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfPass, setShowConfPass] = useState(false);

  // Global Notification
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const triggerNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Payment process simulation
  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !cardExpiry || !cardCvc || !billingName || !billingEmail) {
      triggerNotification("Please fill in card and billing details", "error");
      return;
    }
    if (!agreeTerms) {
      triggerNotification("Please agree to the Terms & Privacy Policy", "error");
      return;
    }
    setIsPaying(true);
    setTimeout(() => {
      setIsPaying(false);
      triggerNotification("Payment of $ 1,499 successful! Welcome to Hostibook.");
      router.replace(`/dashboard/propertyowner/home?role=${encodeURIComponent(roleParam || "property owner")}`);
    }, 2000);
  };

  const handleProceedToSubscriptionCheckout = async () => {
    const planId = selectedPlanId || (plans[0]?.id);
    if (!planId) {
      triggerNotification("No subscription plan available", "error");
      return;
    }
    try {
      const res = await createCheckoutSession({ planId }).unwrap();
      if (res.success && (res.data?.url || res.data?.checkoutUrl)) {
        window.open(res.data.url || res.data.checkoutUrl, "_blank");
      } else {
        triggerNotification(res.message || "Failed to create subscription checkout session", "error");
      }
    } catch (err: any) {
      console.error("Subscription checkout error:", err);
      triggerNotification(err?.data?.message || "Failed to direct to Stripe gateway", "error");
    }
  };

  // ─── Loading guard ────────────────────────────────────────────────────────
  // Show a spinner until:
  //  1. The component has mounted on the client (avoids SSR→client flash), AND
  //  2. The profile API call has finished (so we know the real role).
  // This prevents the property-owner paywall from briefly appearing for
  // service providers on page refresh.
  const isProfileLoadingOrVerifying = 
    isLoadingProfile || 
    (isFetchingProfile && !profileResponse?.data?.isSubscribed);

  const derivedPhase = phase === "checkout" ? "checkout" : (profileResponse?.data?.isSubscribed ? "dashboard" : "paywall");

  console.log("[page.tsx Render] State:", {
    isMounted,
    hasToken: !!token,
    isLoadingProfile,
    isFetchingProfile,
    isProfileLoadingOrVerifying,
    isCheckingStripe,
    profileResponseData: profileResponse?.data,
    phase,
    derivedPhase,
    isServiceProvider,
    isGuest
  });

  if (!isMounted || (token && isProfileLoadingOrVerifying)) {
    console.log("[page.tsx Render] Showing Loading Guard Spinner Screen");
    return (
      <div className="min-h-screen w-full flex flex-col justify-center items-center bg-zinc-50 font-sans">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-bold text-zinc-500 animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  // Render service provider & guest dashboards immediately — they don't go through
  // the property-owner paywall/checkout flow at all.
  if (isServiceProvider) {
    return (
      <div className="min-h-screen w-full flex flex-col justify-center items-center bg-zinc-50 font-sans">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-bold text-zinc-550 animate-pulse">Redirecting to service dashboard...</p>
      </div>
    );
  }

  if (isGuest) {
    return (
      <div className="min-h-screen w-full flex flex-col justify-center items-center bg-zinc-50 font-sans">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-bold text-zinc-550 animate-pulse">Redirecting to guest dashboard...</p>
      </div>
    );
  }

  if (isCheckingStripe) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-zinc-50 font-sans">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-bold text-zinc-650">Verifying payment integration...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 font-sans text-zinc-900 flex flex-col relative antialiased selection:bg-blue-100 selection:text-blue-800">

      {/* Toast Notification */}
      {notification && (
        <Toast
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {/* ==========================================
          PHASE 1: SUBSCRIPTION PAYWALL
          ========================================== */}
      {derivedPhase === "paywall" && (
        <div className="flex-1 flex flex-col justify-center items-center px-4 py-12">
          {/* Card shell */}
          <div className="w-full max-w-[420px] bg-white border border-zinc-150 rounded-3xl shadow-2xl p-6 sm:p-8 text-center flex flex-col justify-between relative overflow-hidden">
            {/* Header */}
            <div>
              <div className="w-full flex justify-center mb-4">
                <div className="relative h-12 w-12 rounded-xl bg-blue-50 p-2.5 shadow-sm">
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

            {/* Benefits Checklist */}
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

            {/* Secured box */}
            <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-start gap-3 text-left mb-6">
              <ShieldLockIcon />
              <div className="flex-1">
                <p className="text-[11px] font-bold text-blue-800 leading-tight">Secure Payment Gateway</p>
                <p className="text-[10px] font-medium text-blue-600/90 mt-0.5 leading-normal">
                  Your payment is secured and encrypted via Stripe.
                </p>
              </div>
            </div>

            {/* Action */}
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

      {/* ==========================================
          PHASE 2: CREDIT CARD CHECKOUT
          ========================================== */}
      {derivedPhase === "checkout" && (
        <div className="flex-1 flex flex-col justify-center items-center px-4 py-12">
          {/* Card shell */}
          <div className="w-full max-w-[420px] bg-white border border-zinc-150 rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col justify-between relative">
            {/* Back button */}
            <button
              onClick={() => setPhase("paywall")}
              className="absolute top-6 left-6 p-2 rounded-full hover:bg-zinc-100 text-zinc-600 transition-colors cursor-pointer"
              aria-label="Go back"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>

            {/* Header */}
            <div className="text-center mt-6 mb-6">
              <h1 className="text-xl font-black text-zinc-800 uppercase tracking-wide">Complete Your Payment</h1>
            </div>

            {/* Checkout Form */}
            <form onSubmit={handlePayment} className="space-y-4">
              {/* Card Details */}
              <div className="text-left">
                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-2.5">Card Details</h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">Card Number</label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        required
                        placeholder="1234 1234 1234 1234"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full px-4 py-3.5 rounded-2xl border border-zinc-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-zinc-50/50 outline-none text-sm transition-all"
                      />
                      <span className="absolute right-4 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        VISA
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">MM/YY</label>
                      <input
                        type="text"
                        required
                        placeholder="12/25"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full px-4 py-3.5 rounded-2xl border border-zinc-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-zinc-50/50 outline-none text-sm transition-all text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">CVC</label>
                      <input
                        type="text"
                        required
                        placeholder="123"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        className="w-full px-4 py-3.5 rounded-2xl border border-zinc-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-zinc-50/50 outline-none text-sm transition-all text-center"
                      />
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-zinc-400 font-semibold mt-2.5 text-right flex items-center justify-end gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Secured by Stripe
                </p>
              </div>

              {/* Billing Information */}
              <div className="text-left">
                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-2.5">Billing Information</h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter your full name"
                      value={billingName}
                      onChange={(e) => setBillingName(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl border border-zinc-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-zinc-50/50 outline-none text-sm transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="Enter your email"
                      value={billingEmail}
                      onChange={(e) => setBillingEmail(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl border border-zinc-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-zinc-50/50 outline-none text-sm transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">Country</label>
                    <select className="w-full px-4 py-3.5 rounded-2xl border border-zinc-200 focus:border-blue-500 bg-zinc-50/50 outline-none text-sm appearance-none font-bold">
                      <option>🇧🇩 Bangladesh</option>
                      <option>🇺🇸 United States</option>
                      <option>🇬🇧 United Kingdom</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="border-t border-zinc-150 pt-4 text-left">
                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-2.5">Payment Summary</h3>
                <div className="space-y-1.5 text-xs font-bold">
                  <div className="flex justify-between text-zinc-500">
                    <span>Plan</span>
                    <span className="text-zinc-800">Hostibook Owner Plan</span>
                  </div>
                  <div className="flex justify-between text-zinc-500">
                    <span>Price</span>
                    <span className="text-zinc-800">$50</span>
                  </div>
                  <div className="flex justify-between text-zinc-500">
                    <span>Tax</span>
                    <span className="text-zinc-800">—</span>
                  </div>
                  <div className="flex justify-between text-zinc-800 text-sm font-black border-t border-zinc-150 pt-1.5 mt-1.5">
                    <span>Total</span>
                    <span>$50</span>
                  </div>
                </div>
              </div>

              {/* Checkbox */}
              <div className="flex items-start gap-2.5 pt-2 text-left">
                <input
                  type="checkbox"
                  id="agree"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded border-zinc-300 focus:ring-blue-500"
                />
                <label htmlFor="agree" className="text-[11px] font-semibold text-zinc-500 leading-normal">
                  I agree to the <a href="#" className="text-blue-600 hover:underline">Terms</a> & <Link href="/privacy-policy" className="text-blue-600 hover:underline" target="_blank">Privacy Policy</Link>
                </label>
              </div>

              {/* Pay button */}
              <button
                type="submit"
                disabled={isPaying}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/10 active:scale-[0.99] transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {isPaying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  "Pay $ 1,499"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          PHASE 3: THE MAIN PORTAL DASHBOARD
          ========================================== */}
      {derivedPhase === "dashboard" && (
        <div className="flex-1 flex flex-col md:flex-row h-screen overflow-hidden bg-zinc-50">

          {/* DESKTOP SIDEBAR (Visible on md and above) */}
          <aside className="hidden md:flex w-64 flex-col bg-white border-r border-zinc-200 py-8 px-6 justify-between shrink-0 h-screen sticky top-0">
            <div>
              <div className="flex items-center gap-3 mb-10 text-left">
                <div className="relative h-10 w-10 rounded-xl bg-blue-50 p-2 shadow-sm shrink-0">
                  <Image src="/Logo.png" alt="Hostibook Logo" fill className="object-contain p-0.5" />
                </div>
                <span className="text-xl font-extrabold tracking-tight text-blue-600">Hostibook</span>
              </div>

              {/* Menu items */}
              <nav className="space-y-1.5 text-left">
                {[
                  { id: "home", label: "Home", icon: <LayoutDashboard className="w-6 h-6" strokeWidth={2.5} /> },
                  { id: "properties", label: "My Properties", icon: <Building2 className="w-6 h-6" strokeWidth={2.5} /> },
                  { id: "bookings", label: "Service Bookings", icon: <CalendarCheck className="w-6 h-6" strokeWidth={2.5} /> },
                  { id: "guests", label: "Manage Guest", icon: <Users className="w-6 h-6" strokeWidth={2.5} /> },
                  { id: "earnings", label: "My Earnings", icon: <Wallet className="w-6 h-6" strokeWidth={2.5} /> },
                  { id: "chat", label: "Messages", icon: <MessageSquare className="w-6 h-6" strokeWidth={2.5} /> },
                  { id: "profile", label: "My Profile", icon: <User className="w-6 h-6" strokeWidth={2.5} /> },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as any);
                      setWizardActive(false);
                      setProfileSubView("main");
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

            {/* Logout bottom */}
            <div>
              <button
                onClick={() => {
                  setShowLogoutConfirm(true);
                }}
                className="w-full flex items-center gap-3.5 px-4 py-3 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-2xl text-sm font-bold transition-all cursor-pointer"
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
              <div className="flex items-center gap-2">
                <div className="relative h-8 w-8 rounded-lg bg-blue-50 p-1.5 shrink-0">
                  <Image src="/Logo.png" alt="Hostibook Logo" fill className="object-contain" />
                </div>
                <span className="text-lg font-bold text-blue-600">Hostibook</span>
              </div>
              <button
                onClick={() => triggerNotification("No new notifications")}
                className="relative p-2 rounded-full bg-white border border-zinc-150 text-zinc-650 hover:bg-zinc-50 shadow-sm cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
            </div>

            {/* TAB VIEW: HOME OVERVIEW */}
            {activeTab === "home" && (
              <OwnerHome
                profName={profName || user?.fullName || "Owner"}
                onNavigateTab={(tab) => {
                  setActiveTab(tab);
                  setWizardActive(false);
                }}
                onStartWizard={() => {
                  setActiveTab("properties");
                  setWizardActive(true);
                }}
                triggerNotification={triggerNotification}
              />
            )}

            {/* TAB VIEW: PROPERTIES */}
            {activeTab === "properties" && (
              <OwnerProperties
                wizardActive={wizardActive}
                setWizardActive={setWizardActive}
                triggerNotification={triggerNotification}
              />
            )}

            {/* TAB VIEW: BOOKINGS */}
            {activeTab === "bookings" && (
              <OwnerBookings
                triggerNotification={triggerNotification}
              />
            )}

            {/* TAB VIEW: GUESTS */}
            {activeTab === "guests" && (
              <OwnerGuests
                triggerNotification={triggerNotification}
              />
            )}

            {/* TAB VIEW: EARNINGS */}
            {activeTab === "earnings" && (
              <OwnerEarnings
                triggerNotification={triggerNotification}
              />
            )}

            {/* TAB VIEW: REFINED CHAT (MESSAGES SPLIT WINDOW) */}
            {activeTab === "chat" && (
              <div className="flex-1 flex flex-col lg:flex-row bg-white overflow-hidden w-full h-full pb-20 lg:pb-0 border-t border-zinc-200">

                {/* LEFT SIDEBAR: THREADS LIST */}
                <div className={`w-full lg:w-80 border-r border-zinc-150 flex flex-col justify-between h-full ${activeChatId !== null ? "hidden lg:flex" : "flex"
                  }`}>
                  <div className="p-4 border-b border-zinc-150 flex flex-col gap-3 shrink-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black tracking-tight text-zinc-955">Messages</h3>
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchChatQuery}
                        onChange={(e) => setSearchChatQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl text-xs font-bold bg-zinc-50 focus:bg-white focus:border-blue-500 outline-none transition-all text-zinc-800"
                      />
                      <svg className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>

                  {/* Threads scroll */}
                  <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
                    {chats
                      .filter((c) =>
                        c.name.toLowerCase().includes(searchChatQuery.toLowerCase()) ||
                        c.role.toLowerCase().includes(searchChatQuery.toLowerCase())
                      )
                      .map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setActiveChatId(c.id)}
                          className={`w-full p-4 text-left flex items-start gap-3 transition-colors cursor-pointer ${activeChatId === c.id
                              ? "bg-blue-600 text-white"
                              : "hover:bg-zinc-50"
                            }`}
                        >
                          {/* Avatar */}
                          <div className="relative w-12 h-12 rounded-full overflow-hidden bg-zinc-200 shrink-0 shadow-inner">
                            <img src={c.avatar} alt={c.name} className="w-full h-full object-cover" />
                            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${c.status === "active" ? "bg-emerald-500" : "bg-amber-400"
                              }`} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex justify-between items-baseline mb-0.5">
                              <h4 className={`text-sm font-bold truncate ${activeChatId === c.id ? "text-white" : "text-zinc-900"
                                }`}>
                                {c.name}
                              </h4>
                              <span className={`text-[10px] font-semibold ${activeChatId === c.id ? "text-blue-100" : "text-zinc-400"
                                }`}>
                                {c.time}
                              </span>
                            </div>
                            <p className={`text-xs truncate font-medium ${activeChatId === c.id ? "text-blue-100" : "text-zinc-500"
                              }`}>
                              {c.lastMsg}
                            </p>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>

                {/* RIGHT WINDOW: ACTIVE CHAT CONVERSATION */}
                <div className={`flex-1 flex flex-col justify-between bg-zinc-50/30 h-full ${activeChatId === null ? "hidden lg:flex" : "flex"
                  }`}>

                  {/* EMPTY STATE */}
                  {activeChatId === null ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-sm mx-auto">
                      <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4 shadow-sm">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" />
                        </svg>
                      </div>
                      <h3 className="text-base font-black text-zinc-950">Start your message</h3>
                      <p className="text-xs text-zinc-400 mt-1 font-semibold leading-relaxed">
                        Select a thread from the side panel to coordinate with your home assistants, plumbers, or managers.
                      </p>
                    </div>
                  ) : (
                    // ACTIVE CONVERSATION
                    <>
                      {/* Chat Header */}
                      {(() => {
                        const chat = chats.find(c => c.id === activeChatId)!;
                        return (
                          <div className="p-4 bg-white border-b border-zinc-150 flex items-center justify-between shadow-sm shrink-0">
                            <div className="flex items-center gap-3">
                              {/* Mobile close conversation button */}
                              <button
                                onClick={() => setActiveChatId(null)}
                                className="lg:hidden p-1.5 rounded-full hover:bg-zinc-100 text-zinc-500 transition-colors cursor-pointer"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                                </svg>
                              </button>

                              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-zinc-200 shadow-inner">
                                <img src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" />
                              </div>
                              <div className="text-left">
                                <h4 className="text-sm font-bold text-zinc-900 leading-tight">{chat.name}</h4>
                                <p className="text-[10px] text-zinc-400 font-semibold">{chat.role} • Active Now</p>
                              </div>
                            </div>

                            <button
                              onClick={() => triggerNotification("Settings menu clicked")}
                              className="p-2 rounded-full hover:bg-zinc-100 text-zinc-450 hover:text-zinc-650 transition-colors cursor-pointer"
                            >
                              •••
                            </button>
                          </div>
                        );
                      })()}

                      {/* Message History list */}
                      <div className="flex-1 p-5 overflow-y-auto space-y-4">
                        {chats.find(c => c.id === activeChatId)!.history.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`flex flex-col max-w-[80%] ${msg.type === "sent" ? "ml-auto items-end" : "mr-auto items-start"
                              }`}
                          >
                            <div className={`p-4 rounded-2xl text-xs font-bold leading-relaxed text-left ${msg.type === "sent"
                                ? "bg-blue-600 text-white rounded-br-none shadow-sm shadow-blue-500/10"
                                : "bg-zinc-150 text-zinc-800 rounded-bl-none border border-zinc-200"
                              }`}>
                              {msg.text}
                            </div>
                            <span className="text-[9px] font-semibold text-zinc-400 mt-1">{msg.time}</span>
                          </div>
                        ))}
                        <div ref={messageEndRef} />
                      </div>

                      {/* Input send bar */}
                      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-zinc-150 flex items-center gap-3 shrink-0">
                        <div className="flex-1 relative flex items-center">
                          <input
                            type="text"
                            value={typedMessage}
                            onChange={(e) => setTypedMessage(e.target.value)}
                            placeholder="Type something..."
                            className="w-full pl-4 pr-12 py-3 rounded-2xl border border-zinc-200 focus:border-blue-500 outline-none text-xs font-bold bg-zinc-50/50"
                          />
                          <button
                            type="button"
                            onClick={() => triggerNotification("Attachments modal triggered")}
                            className="absolute right-4 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                        <button
                          type="submit"
                          className="h-10 w-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center shadow-md active:scale-[0.98] transition-all shrink-0 cursor-pointer"
                          aria-label="Send message"
                        >
                          <svg className="w-4 h-4 -rotate-0" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                          </svg>
                        </button>
                      </form>
                    </>
                  )}
                </div>

              </div>
            )}

            {/* TAB VIEW: REFINED MY PROFILE (MULTI-LEVEL PAGES) */}
            {activeTab === "profile" && (
              <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8 lg:p-10 pb-24 md:pb-8 flex flex-col overflow-y-auto lg:overflow-hidden lg:h-full">

                {/* MOBILE VIEW (Hidden on desktop) */}
                <div className="lg:hidden w-full max-w-xl mx-auto bg-white border border-zinc-150 p-6 sm:p-8 rounded-3xl shadow-sm min-h-[500px] flex flex-col justify-between transition-all duration-300">
                  {/* 1. MAIN PROFILE PAGE */}
                  {profileSubView === "main" && (
                    <div className="space-y-6 flex-1 flex flex-col">
                      <div className="flex items-center gap-3 text-left">
                        <h2 className="text-xl sm:text-2xl font-black text-zinc-955 tracking-tight">My Profile</h2>
                      </div>

                      {/* Card overview */}
                      <div className="flex items-center gap-4 border-b border-zinc-150 pb-6 text-left">
                        <div className="w-20 h-20 rounded-full bg-zinc-200 overflow-hidden relative shadow-inner shrink-0 border-2 border-zinc-100">
                          <img
                            src={profileResponse?.data?.profileImage || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80"}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="text-left">
                          <h3 className="text-lg font-black text-zinc-955">{profName || profileResponse?.data?.fullName || user?.fullName || "Guest User"}</h3>
                          <p className="text-xs font-bold text-zinc-400 mt-0.5 leading-none">
                            Property Owner
                          </p>
                        </div>
                      </div>

                      {/* Options list */}
                      <div className="space-y-3.5 flex-1 pt-2">
                        {[
                          { label: "Edit Profile", desc: "Manage phone, country, and dob", icon: "👤", key: "edit" },
                          { label: "Account Settings", desc: "Change password, terms, and about", icon: "⚙️", key: "settings" },
                          { label: "Payment Settings", desc: "Review registered Stripe payment card", icon: "💳", key: "payment" },
                        ].map((item) => (
                          <button
                            key={item.key}
                            onClick={() => {
                              if (item.key === "payment") {
                                triggerNotification("Payment Settings are configured via Stripe Checkout");
                              } else {
                                setProfileSubView(item.key as any);
                              }
                            }}
                            className="w-full p-4 border border-zinc-150 rounded-2xl text-left hover:border-blue-400 hover:shadow-sm transition-all flex items-center justify-between cursor-pointer"
                          >
                            <div className="flex items-start gap-4 text-left">
                              <span className="text-xl shrink-0 mt-0.5">{item.icon}</span>
                              <div>
                                <h4 className="text-sm font-bold text-zinc-950">{item.label}</h4>
                                <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">{item.desc}</p>
                              </div>
                            </div>
                            <span className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                              →
                            </span>
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => setShowLogoutConfirm(true)}
                        className="w-full py-4 border-2 border-red-50 hover:bg-red-50 text-red-600 rounded-2xl font-bold transition-all text-sm mt-4 text-center shrink-0 cursor-pointer"
                      >
                        Logout
                      </button>
                    </div>
                  )}

                  {/* 2. EDIT PROFILE VIEW */}
                  {profileSubView === "edit" && (
                    <div className="space-y-6 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Back header */}
                        <div className="flex items-center gap-3 border-b border-zinc-150 pb-4 mb-4 text-left">
                          <button onClick={() => setProfileSubView("main")} className="text-zinc-400 hover:text-zinc-605 cursor-pointer font-bold text-lg">
                            ←
                          </button>
                          <h3 className="text-base font-black text-zinc-950">Edit Profile</h3>
                        </div>

                        {/* Fields */}
                        <div className="space-y-4 text-left">
                          {/* Avatar */}
                          <div className="flex justify-center mb-4">
                            <label className="relative w-20 h-20 rounded-full overflow-hidden bg-zinc-200 cursor-pointer block">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    const file = e.target.files[0];
                                    setProfileImageFile(file);
                                    setAvatarPreview(URL.createObjectURL(file));
                                  }
                                }}
                                className="hidden"
                              />
                              <img
                                src={avatarPreview || profileResponse?.data?.profileImage || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80"}
                                alt="Avatar"
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute bottom-0 inset-x-0 py-1 bg-black/40 text-[8px] font-black text-white text-center">Change</span>
                            </label>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">Name</label>
                            <input
                              type="text"
                              value={profName}
                              onChange={(e) => setProfName(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50/50 outline-none text-xs font-bold text-zinc-800"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">Date of Birth</label>
                            <input
                              type="text"
                              value={profDob}
                              onChange={(e) => setProfDob(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50/50 outline-none text-xs font-bold text-zinc-800"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">Country</label>
                            <input
                              type="text"
                              value={profCountry}
                              onChange={(e) => setProfCountry(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50/50 outline-none text-xs font-bold text-zinc-800"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">Phone number</label>
                            <input
                              type="text"
                              value={profPhone}
                              onChange={(e) => setProfPhone(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50/50 outline-none text-xs font-bold text-zinc-800"
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleSaveProfile}
                        disabled={isUpdatingProfile}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-2xl font-bold shadow-md text-sm mt-6 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isUpdatingProfile ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Saving...
                          </>
                        ) : (
                          "Save"
                        )}
                      </button>
                    </div>
                  )}

                  {/* 3. ACCOUNT SETTINGS */}
                  {profileSubView === "settings" && (
                    <div className="space-y-6 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Back header */}
                        <div className="flex items-center gap-3 border-b border-zinc-150 pb-4 mb-4 text-left">
                          <button onClick={() => setProfileSubView("main")} className="text-zinc-400 hover:text-zinc-600 cursor-pointer font-bold text-lg">
                            ←
                          </button>
                          <h3 className="text-base font-black text-zinc-950">Account Settings</h3>
                        </div>

                        {/* Links list */}
                        <div className="space-y-1 text-left">
                          {[
                            { label: "Change Password", key: "password" },
                            { label: "Terms of services", key: "terms" },
                            { label: "Privacy Policy", key: "privacy" },
                            { label: "About us", key: "about" },
                          ].map((link) => (
                            <button
                              key={link.key}
                              onClick={() => setProfileSubView(link.key as any)}
                              className="w-full py-3.5 px-2 border-b border-zinc-100 flex items-center justify-between text-xs font-bold text-zinc-700 hover:text-zinc-955 transition-colors cursor-pointer"
                            >
                              <span>{link.label}</span>
                              <span className="text-zinc-350 font-bold">→</span>
                            </button>
                          ))}

                          <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="w-full py-4 px-2 text-left text-xs font-extrabold text-red-500 hover:underline pt-6 cursor-pointer"
                          >
                            Delete Account
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 4. CHANGE PASSWORD */}
                  {profileSubView === "password" && (
                    <div className="space-y-6 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Back header */}
                        <div className="flex items-center gap-3 border-b border-zinc-150 pb-4 mb-4 text-left">
                          <button onClick={() => setProfileSubView("settings")} className="text-zinc-400 hover:text-zinc-600 cursor-pointer font-bold text-lg">
                            ←
                          </button>
                          <h3 className="text-base font-black text-zinc-950">Change Password</h3>
                        </div>

                        {/* Form inputs */}
                        <div className="space-y-4 text-left">
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">Current Password</label>
                            <div className="relative">
                              <input
                                type={showCurrPass ? "text" : "password"}
                                value={currPass}
                                onChange={(e) => setCurrPass(e.target.value)}
                                placeholder="••••••"
                                className="w-full px-4 py-3 pr-10 rounded-xl border border-zinc-200 bg-zinc-50/50 outline-none text-xs font-bold text-zinc-800"
                              />
                              <button type="button" onClick={() => setShowCurrPass(!showCurrPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-650 cursor-pointer font-bold text-lg">
                                {showCurrPass ? (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                )}
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">New Password</label>
                            <div className="relative">
                              <input
                                type={showNewPass ? "text" : "password"}
                                value={newPass}
                                onChange={(e) => setNewPass(e.target.value)}
                                placeholder="••••••"
                                className="w-full px-4 py-3 pr-10 rounded-xl border border-zinc-200 bg-zinc-50/50 outline-none text-xs font-bold text-zinc-800"
                              />
                              <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-650 cursor-pointer font-bold text-lg">
                                {showNewPass ? (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                )}
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">Confirm Password</label>
                            <div className="relative">
                              <input
                                type={showConfPass ? "text" : "password"}
                                value={confPass}
                                onChange={(e) => setConfPass(e.target.value)}
                                placeholder="••••••"
                                className="w-full px-4 py-3 pr-10 rounded-xl border border-zinc-200 bg-zinc-50/50 outline-none text-xs font-bold text-zinc-800"
                              />
                              <button type="button" onClick={() => setShowConfPass(!showConfPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-650 cursor-pointer font-bold text-lg">
                                {showConfPass ? (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleChangePassword}
                        disabled={isChangingPassword}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-2xl font-bold shadow-md text-sm mt-6 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isChangingPassword ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Updating...
                          </>
                        ) : (
                          "Update Password"
                        )}
                      </button>
                    </div>
                  )}

                  {/* 5. TERMS OF SERVICES VIEW */}
                  {profileSubView === "terms" && (
                    <div className="space-y-6 flex-1 flex flex-col justify-between text-left">
                      <div>
                        {/* Back header */}
                        <div className="flex items-center gap-3 border-b border-zinc-150 pb-4 mb-4">
                          <button onClick={() => setProfileSubView("settings")} className="text-zinc-400 hover:text-zinc-600 cursor-pointer font-bold text-lg">
                            ←
                          </button>
                          <h3 className="text-base font-black text-zinc-950">Terms of Conditions</h3>
                        </div>

                        {/* Text content */}
                        <div className="space-y-3.5 text-xs text-zinc-500 font-semibold leading-relaxed max-h-[350px] overflow-y-auto pr-1">
                          <p>1. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Imperdiet iaculis convallis elementum diam egestas suspendisse. Imperdiet convallis eget nunc hendrerit.</p>
                          <p>2. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Imperdiet iaculis convallis elementum diam egestas suspendisse. Imperdiet convallis eget nunc hendrerit.</p>
                          <p>3. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Imperdiet iaculis convallis elementum diam egestas suspendisse. Imperdiet convallis eget nunc hendrerit.</p>
                          <p>4. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Imperdiet iaculis convallis elementum diam egestas suspendisse. Imperdiet convallis eget nunc hendrerit.</p>
                          <p>5. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Imperdiet iaculis convallis elementum diam egestas suspendisse. Imperdiet convallis eget nunc hendrerit.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 6. PRIVACY POLICY VIEW */}
                  {profileSubView === "privacy" && (
                    <div className="space-y-6 flex-1 flex flex-col justify-between text-left">
                      <div>
                        {/* Back header */}
                        <div className="flex items-center gap-3 border-b border-zinc-150 pb-4 mb-4">
                          <button onClick={() => setProfileSubView("settings")} className="text-zinc-400 hover:text-zinc-600 cursor-pointer font-bold text-lg">
                            ←
                          </button>
                          <h3 className="text-base font-black text-zinc-955">Privacy Policy</h3>
                        </div>

                        {/* Text content */}
                        <div className="space-y-3.5 text-xs text-zinc-500 font-semibold leading-relaxed max-h-[350px] overflow-y-auto pr-1">
                          <p>1. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Imperdiet iaculis convallis elementum diam egestas suspendisse. Imperdiet convallis eget nunc hendrerit.</p>
                          <p>2. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Imperdiet iaculis convallis elementum diam egestas suspendisse. Imperdiet convallis eget nunc hendrerit.</p>
                          <p>3. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Imperdiet iaculis convallis elementum diam egestas suspendisse. Imperdiet convallis eget nunc hendrerit.</p>
                          <p>4. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Imperdiet iaculis convallis elementum diam egestas suspendisse. Imperdiet convallis eget nunc hendrerit.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 7. ABOUT US VIEW */}
                  {profileSubView === "about" && (
                    <div className="space-y-6 flex-1 flex flex-col justify-between text-left">
                      <div>
                        {/* Back header */}
                        <div className="flex items-center gap-3 border-b border-zinc-150 pb-4 mb-4">
                          <button onClick={() => setProfileSubView("settings")} className="text-zinc-400 hover:text-zinc-600 cursor-pointer font-bold text-lg">
                            ←
                          </button>
                          <h3 className="text-base font-black text-zinc-950">About us</h3>
                        </div>

                        {/* Text content */}
                        <div className="space-y-3.5 text-xs text-zinc-500 font-semibold leading-relaxed max-h-[350px] overflow-y-auto pr-1">
                          <p>1. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Imperdiet iaculis convallis elementum diam egestas suspendisse. Imperdiet convallis eget nunc hendrerit.</p>
                          <p>2. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Imperdiet iaculis convallis elementum diam egestas suspendisse. Imperdiet convallis eget nunc hendrerit.</p>
                          <p>3. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Imperdiet iaculis convallis elementum diam egestas suspendisse. Imperdiet convallis eget nunc hendrerit.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* DESKTOP VIEW (Hidden on mobile) */}
                <div className="hidden lg:grid lg:grid-cols-12 lg:gap-8 lg:h-full lg:items-stretch w-full">
                  {/* Left Column Settings Sidebar */}
                  <div className="lg:col-span-4 bg-white border border-zinc-150 p-6 rounded-3xl shadow-sm flex flex-col justify-between h-full">
                    <div className="space-y-6">
                      {/* Premium profile card */}
                      <div className="flex items-center gap-4 border-b border-zinc-150 pb-6 text-left">
                        <div className="w-16 h-16 rounded-full bg-zinc-200 overflow-hidden relative shadow-inner shrink-0 border-2 border-zinc-100">
                          <img
                            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80"
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="text-left">
                          <h3 className="text-base font-black text-zinc-950">{profName}</h3>
                          <p className="text-[11px] font-bold text-zinc-400 mt-0.5 leading-none">
                            Property Owner
                          </p>
                          <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[8px] font-extrabold tracking-wide uppercase leading-none">
                            Premium • Active
                          </span>
                        </div>
                      </div>

                      {/* Navigation Sidebar Menu */}
                      <nav className="space-y-2.5 text-left">
                        {[
                          { label: "Edit Profile", key: "edit", icon: "👤", desc: "Manage phone, country, and DOB" },
                          { label: "Change Password", key: "password", icon: "🔑", desc: "Keep your credentials secure" },
                          { label: "Payment Settings", key: "payment", icon: "💳", desc: "Manage your Stripe subscription" },
                          { label: "Terms of Services", key: "terms", icon: "📄", desc: "Read our service policies" },
                          { label: "Privacy Policy", key: "privacy", icon: "🔒", desc: "Check how we handle data" },
                          { label: "About Us", key: "about", icon: "ℹ️", desc: "Learn more about Hostibook" },
                        ].map((item) => {
                          const isActive = profileSubView === item.key ||
                            (profileSubView === "main" && item.key === "edit") ||
                            (profileSubView === "settings" && item.key === "password");
                          return (
                            <button
                              key={item.key}
                              onClick={() => setProfileSubView(item.key as any)}
                              className={`w-full p-3.5 rounded-2xl text-left transition-all border flex items-center justify-between group cursor-pointer ${isActive
                                  ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/10"
                                  : "bg-white border-zinc-150 text-zinc-650 hover:border-blue-400 hover:text-zinc-950"
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-lg shrink-0">{item.icon}</span>
                                <div className="text-left">
                                  <h4 className="text-xs font-bold leading-tight">{item.label}</h4>
                                  <p className={`text-[9px] font-semibold mt-0.5 leading-none ${isActive ? "text-blue-100" : "text-zinc-400 group-hover:text-zinc-500"}`}>
                                    {item.desc}
                                  </p>
                                </div>
                              </div>
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${isActive ? "bg-white/20 text-white" : "bg-blue-50 text-blue-600"
                                }`}>
                                →
                              </span>
                            </button>
                          );
                        })}
                      </nav>
                    </div>
                  </div>

                  {/* Right Column Settings Panel */}
                  <div className="lg:col-span-8 bg-white border border-zinc-150 p-8 rounded-3xl shadow-sm flex flex-col justify-between overflow-y-auto h-full min-h-[550px]">

                    {/* EDIT PROFILE PANEL */}
                    {(profileSubView === "main" || profileSubView === "edit") && (
                      <div className="space-y-6 flex-1 flex flex-col justify-between text-left">
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-lg font-black text-zinc-900 tracking-tight">Edit Profile Information</h3>
                            <p className="text-xs text-zinc-400 font-semibold mt-0.5">Update your basic information and contact details.</p>
                          </div>

                          <div className="flex items-center gap-5 p-4 border border-zinc-100 rounded-2xl bg-zinc-50/50">
                            <div className="relative w-16 h-16 rounded-full overflow-hidden bg-zinc-200 shrink-0 shadow-inner border-2 border-white">
                              <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80" alt="Avatar" className="w-full h-full object-cover" />
                              <span className="absolute bottom-0 inset-x-0 py-0.5 bg-black/40 text-[8px] font-black text-white text-center cursor-pointer">Change</span>
                            </div>
                            <div className="text-left">
                              <h4 className="text-sm font-bold text-zinc-800">Profile Picture</h4>
                              <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">PNG, JPG or GIF up to 5MB.</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">Full Name</label>
                              <input
                                type="text"
                                value={profName}
                                onChange={(e) => setProfName(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-blue-500 bg-zinc-50/50 outline-none text-xs font-bold text-zinc-800"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">Phone number</label>
                              <input
                                type="text"
                                value={profPhone}
                                onChange={(e) => setProfPhone(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-blue-500 bg-zinc-50/50 outline-none text-xs font-bold text-zinc-800"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">Date of Birth</label>
                              <input
                                type="text"
                                value={profDob}
                                onChange={(e) => setProfDob(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-blue-500 bg-zinc-50/50 outline-none text-xs font-bold text-zinc-800"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">Country</label>
                              <input
                                type="text"
                                value={profCountry}
                                onChange={(e) => setProfCountry(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-blue-500 bg-zinc-50/50 outline-none text-xs font-bold text-zinc-800"
                              />
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={handleSaveProfile}
                          disabled={isUpdatingProfile}
                          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-md text-xs mt-6 cursor-pointer"
                        >
                          Save Changes
                        </button>
                      </div>
                    )}

                    {/* CHANGE PASSWORD PANEL */}
                    {profileSubView === "password" && (
                      <div className="space-y-6 flex-1 flex flex-col justify-between text-left">
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-lg font-black text-zinc-900 tracking-tight">Security & Password</h3>
                            <p className="text-xs text-zinc-400 font-semibold mt-0.5">Modify your account login credentials.</p>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">Current Password</label>
                              <div className="relative">
                                <input
                                  type={showCurrPass ? "text" : "password"}
                                  value={currPass}
                                  onChange={(e) => setCurrPass(e.target.value)}
                                  placeholder="••••••••"
                                  className="w-full px-4 py-3.5 pr-10 rounded-xl border border-zinc-200 focus:border-blue-500 bg-zinc-50/50 outline-none text-xs font-bold text-zinc-800"
                                />
                                <button type="button" onClick={() => setShowCurrPass(!showCurrPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-655 cursor-pointer">
                                  {showCurrPass ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                                  ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                  )}
                                </button>
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">New Password</label>
                              <div className="relative">
                                <input
                                  type={showNewPass ? "text" : "password"}
                                  value={newPass}
                                  onChange={(e) => setNewPass(e.target.value)}
                                  placeholder="••••••••"
                                  className="w-full px-4 py-3.5 pr-10 rounded-xl border border-zinc-200 focus:border-blue-500 bg-zinc-50/50 outline-none text-xs font-bold text-zinc-800"
                                />
                                <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-655 cursor-pointer">
                                  {showNewPass ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                                  ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                  )}
                                </button>
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">Confirm Password</label>
                              <div className="relative">
                                <input
                                  type={showConfPass ? "text" : "password"}
                                  value={confPass}
                                  onChange={(e) => setConfPass(e.target.value)}
                                  placeholder="••••••••"
                                  className="w-full px-4 py-3.5 pr-10 rounded-xl border border-zinc-200 focus:border-blue-500 bg-zinc-50/50 outline-none text-xs font-bold text-zinc-800"
                                />
                                <button type="button" onClick={() => setShowConfPass(!showConfPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-655 cursor-pointer">
                                  {showConfPass ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                                  ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={handleChangePassword}
                          disabled={isChangingPassword}
                          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-md text-xs mt-6 cursor-pointer"
                        >
                          Update Password
                        </button>
                      </div>
                    )}

                    {/* PAYMENT SETTINGS PANEL */}
                    {profileSubView === "payment" && (
                      <div className="space-y-6 flex-1 flex flex-col justify-between text-left">
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-lg font-black text-zinc-900 tracking-tight">Billing & Subscriptions</h3>
                            <p className="text-xs text-zinc-400 font-semibold mt-0.5">Manage your active plans, payment details, and billing history.</p>
                          </div>

                          {/* Visual Mock Card Widget */}
                          <div className="relative rounded-3xl p-6 bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-800 text-white shadow-xl overflow-hidden group">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-12 translate-x-12 group-hover:scale-110 transition-transform duration-700" />

                            <div className="flex justify-between items-start relative z-10">
                              <div>
                                <span className="text-[10px] font-black tracking-widest text-blue-200 uppercase">Hostibook Card Manager</span>
                                <p className="text-base font-extrabold mt-1">
                                  Hostibook Owner Plan
                                </p>
                              </div>
                              <span className="px-3.5 py-1 rounded-xl bg-white/20 text-[10px] font-black border border-white/30 tracking-wider">
                                VISA
                              </span>
                            </div>

                            <div className="my-10 relative z-10 text-center">
                              <p className="text-xl font-mono tracking-widest font-bold">••••  ••••  ••••  4242</p>
                            </div>

                            <div className="flex justify-between items-end relative z-10 text-xs">
                              <div>
                                <p className="text-[8px] font-black text-blue-200 uppercase tracking-wider">Cardholder</p>
                                <p className="font-bold mt-0.5">{profName}</p>
                              </div>
                              <div>
                                <p className="text-[8px] font-black text-blue-200 uppercase tracking-wider">Expires</p>
                                <p className="font-bold mt-0.5">12 / 28</p>
                              </div>
                            </div>
                          </div>

                          {/* Plan Details Info Box */}
                          <div className="p-4 border border-zinc-150 rounded-2xl bg-zinc-50/50 space-y-3 text-left">
                            <div className="flex justify-between text-xs font-bold text-zinc-700">
                              <span className="text-zinc-400">Subscription Status</span>
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black leading-none flex items-center">
                                Active
                              </span>
                            </div>
                            <div className="flex justify-between text-xs font-bold text-zinc-700">
                              <span className="text-zinc-400">Billing Cycle</span>
                              <span className="text-zinc-800">$ 1,499 / Year</span>
                            </div>
                            <div className="flex justify-between text-xs font-bold text-zinc-700">
                              <span className="text-zinc-400">Next Invoice Date</span>
                              <span className="text-zinc-800">June 4, 2027</span>
                            </div>
                            <div className="flex justify-between text-xs font-bold text-zinc-700">
                              <span className="text-zinc-400">Billing Address</span>
                              <span className="text-zinc-800">{profCountry}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-4 mt-6">
                          <button
                            onClick={() => triggerNotification("Redirecting to Stripe Billing Portal...")}
                            className="flex-1 py-4 border-2 border-blue-600 hover:bg-blue-50 text-blue-600 rounded-2xl font-bold transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Manage Subscription
                          </button>
                          <button
                            onClick={() => triggerNotification("Billing methods are secured via Stripe.", "success")}
                            className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-md text-xs cursor-pointer"
                          >
                            Update Card Info
                          </button>
                        </div>
                      </div>
                    )}

                    {/* TERMS OF SERVICE PANEL */}
                    {profileSubView === "terms" && (
                      <div className="space-y-6 flex-1 flex flex-col justify-between text-left">
                        <div>
                          <h3 className="text-lg font-black text-zinc-900 tracking-tight mb-4">Terms & Conditions</h3>
                          <div className="space-y-4 text-xs text-zinc-500 font-semibold leading-relaxed max-h-[420px] overflow-y-auto pr-2">
                            <p>1. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Imperdiet iaculis convallis elementum diam egestas suspendisse. Imperdiet convallis eget nunc hendrerit.</p>
                            <p>2. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Imperdiet iaculis convallis elementum diam egestas suspendisse. Imperdiet convallis eget nunc hendrerit.</p>
                            <p>3. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Imperdiet iaculis convallis elementum diam egestas suspendisse. Imperdiet convallis eget nunc hendrerit.</p>
                            <p>4. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Imperdiet iaculis convallis elementum diam egestas suspendisse. Imperdiet convallis eget nunc hendrerit.</p>
                            <p>5. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Imperdiet iaculis convallis elementum diam egestas suspendisse. Imperdiet convallis eget nunc hendrerit.</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* PRIVACY POLICY PANEL */}
                    {profileSubView === "privacy" && (
                      <div className="space-y-6 flex-1 flex flex-col justify-between text-left">
                        <div>
                          <h3 className="text-lg font-black text-zinc-900 tracking-tight mb-4">Privacy Policy</h3>
                          <div className="space-y-4 text-xs text-zinc-500 font-semibold leading-relaxed max-h-[420px] overflow-y-auto pr-2">
                            <p>1. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Imperdiet iaculis convallis elementum diam egestas suspendisse. Imperdiet convallis eget nunc hendrerit.</p>
                            <p>2. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Imperdiet iaculis convallis elementum diam egestas suspendisse. Imperdiet convallis eget nunc hendrerit.</p>
                            <p>3. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Imperdiet iaculis convallis elementum diam egestas suspendisse. Imperdiet convallis eget nunc hendrerit.</p>
                            <p>4. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Imperdiet iaculis convallis elementum diam egestas suspendisse. Imperdiet convallis eget nunc hendrerit.</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ABOUT US PANEL */}
                    {profileSubView === "about" && (
                      <div className="space-y-6 flex-1 flex flex-col justify-between text-left">
                        <div>
                          <h3 className="text-lg font-black text-zinc-900 tracking-tight mb-4">About Hostibook</h3>
                          <div className="space-y-4 text-xs text-zinc-500 font-semibold leading-relaxed max-h-[420px] overflow-y-auto pr-2">
                            <p>1. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Imperdiet iaculis convallis elementum diam egestas suspendisse. Imperdiet convallis eget nunc hendrerit.</p>
                            <p>2. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Imperdiet iaculis convallis elementum diam egestas suspendisse. Imperdiet convallis eget nunc hendrerit.</p>
                            <p>3. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Imperdiet iaculis convallis elementum diam egestas suspendisse. Imperdiet convallis eget nunc hendrerit.</p>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                </div>

              </div>
            )}

          </main>

          {/* MOBILE TAB BAR (Visible on mobile/tablet viewports at bottom) */}
          <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-zinc-200 md:hidden flex justify-around py-3.5 px-4 shadow-xl">
            {[
              { id: "home", label: "Home", icon: <LayoutDashboard className="w-5 h-5" /> },
              { id: "properties", label: "Properties", icon: <Building2 className="w-5 h-5" /> },
              { id: "bookings", label: "Bookings", icon: <CalendarCheck className="w-5 h-5" /> },
              { id: "chat", label: "Messages", icon: <MessageSquare className="w-5 h-5" /> },
              { id: "profile", label: "Profile", icon: <User className="w-5 h-5" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setWizardActive(false);
                  setProfileSubView("main");
                }}
                className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${activeTab === tab.id
                    ? "text-blue-600 font-black scale-105"
                    : "text-zinc-400 hover:text-zinc-650"
                  }`}
              >
                {tab.icon}
                <span className="text-[10px] font-bold">{tab.label}</span>
              </button>
            ))}
          </footer>

        </div>
      )}

      {/* ==========================================
          LOGOUT CONFIRMATION POP UP MODAL
          ========================================== */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
          <div className="w-full max-w-[280px] bg-white border border-zinc-200 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-wider leading-relaxed">
              Do you want to Log out?
            </h3>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  performLogout(dispatch);
                  setShowLogoutConfirm(false);
                  triggerNotification("Logged out successfully");
                  router.push("/");
                }}
                className="flex-1 py-2.5 border-2 border-red-500 text-red-500 font-extrabold rounded-2xl text-xs hover:bg-red-50 transition-colors cursor-pointer"
              >
                Yes
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 bg-blue-600 text-white font-extrabold rounded-2xl text-xs hover:bg-blue-700 transition-colors cursor-pointer"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          DELETE ACCOUNT CONFIRMATION POP UP MODAL
          ========================================== */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
          <div className="w-full max-w-[280px] bg-white border border-zinc-200 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-wider leading-relaxed">
              Confirm deleting your account?
            </h3>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleDeleteAccount}
                className="flex-1 py-2.5 border-2 border-red-500 text-red-500 font-extrabold rounded-2xl text-xs hover:bg-red-50 transition-colors cursor-pointer"
              >
                Yes
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 bg-blue-600 text-white font-extrabold rounded-2xl text-xs hover:bg-blue-700 transition-colors cursor-pointer"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-zinc-400">Loading Hostibook Dashboard...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
