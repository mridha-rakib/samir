"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import { logout } from "@/redux/features/authSlice";
import { performLogout } from "@/lib/logoutCleanup";

// Hooks
import {
  useGetMyProfileQuery,
  useUpdateProfileMutation,
  useDeleteMyAccountMutation,
} from "@/redux/api/userApi";
import { useChangePasswordMutation } from "@/redux/api/authApi";
import {
  useGetMyChannelsQuery,
  useGetChannelMessagesQuery,
  useSendMessageMutation,
} from "@/redux/api/chatApi";
import { useCreateServiceMutation } from "@/redux/api/serviceApi";
import { useSendOtpMutation, useVerifyPhoneOtpMutation } from "@/redux/api/phoneApi";
import { useGetTermsConditionsQuery, useGetAllPrivacyPolicyQuery } from "@/redux/api/policyApi";
import { useGetAboutQuery } from "@/redux/api/settingApi";

// Modular Sub-Components
import SPOnboarding from "./provider/components/SPOnboarding";
import SPHome from "./provider/components/SPHome";
import SPJobDetails from "./provider/components/SPJobDetails";
import ProviderEarnings from "./provider/components/ProviderEarnings";
import Toast from "./components/Toast";
import EditProfileView from "./components/profile/EditProfileView";
import AccountSettingsView from "./components/profile/AccountSettingsView";
import FAQView from "./components/profile/FAQView";

// SVGs and Icons
import {
  SearchIcon,
  HomeIconComponent,
  ChatIconComponent,
  ProfileIconComponent,
} from "./provider/components/Icons";

// Format ISO timestamp to readable time string
function formatMsgTime(iso?: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function ServiceProviderDashboard() {
  const router = useRouter();
  const dispatch = useDispatch();

  // Onboarding phase state: "welcome" | "add-service" | "congrats" | "dashboard"
  const [spPhase, setSpPhase] = useState<"welcome" | "add-service" | "congrats" | "dashboard">("welcome");

  // Tab View: "home" | "chat" | "profile"
  const [activeTab, setActiveTab] = useState<"home" | "chat" | "profile">("home");

  // Load active tab from localStorage on mount
  useEffect(() => {
    const savedTab = localStorage.getItem("spActiveTab");
    if (savedTab === "home" || savedTab === "chat" || savedTab === "profile") {
      setActiveTab(savedTab);
    }
  }, []);

  // Persist active tab to localStorage on change
  useEffect(() => {
    localStorage.setItem("spActiveTab", activeTab);
  }, [activeTab]);

  // Sub-views state: "services" | "jobs" | "job-details" | "earnings" | null
  const [subView, setSubView] = useState<"services" | "jobs" | "job-details" | "earnings" | null>(null);
  
  // Selected Job ID for sub-views
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  // Redux token
  const token = useSelector((state: RootState) => state.auth.token);

  // Profile RTK queries & mutations
  const { data: profileResponse, isLoading: isLoadingProfile, refetch: refetchProfile } = useGetMyProfileQuery(undefined, { skip: !token });
  const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();
  const [deleteAccount] = useDeleteMyAccountMutation();

  // Policy & settings queries
  const { data: termsResponse } = useGetTermsConditionsQuery(undefined, { skip: !token });
  const { data: privacyResponse } = useGetAllPrivacyPolicyQuery(undefined, { skip: !token });
  const { data: aboutResponse } = useGetAboutQuery(undefined, { skip: !token });



  const termsText = termsResponse?.data?.[0]?.description || "No terms and conditions defined yet.";
  const privacyText = privacyResponse?.data?.[0]?.description || "No privacy policy defined yet.";
  const aboutText = aboutResponse?.data?.[0]?.description || "No about information defined yet.";

  // Service creation for onboarding
  const [createService] = useCreateServiceMutation();

  const [channelLimit, setChannelLimit] = useState(20);
  const { data: channelsResponse, refetch: refetchChannels, isLoading: isLoadingChannels, isFetching: isFetchingChannels } = useGetMyChannelsQuery({ page: 1, limit: channelLimit }, { skip: !token });
  const [sendMessageMutation] = useSendMessageMutation();
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [msgPage, setMsgPage] = useState(1);
  const MSG_LIMIT = 30;
  const { data: messagesResponse, isLoading: isLoadingMessages, isFetching: isFetchingMessages, refetch: refetchMessages } = useGetChannelMessagesQuery(
    { channelId: activeChannelId || "", page: msgPage, limit: MSG_LIMIT },
    { skip: !activeChannelId }
  );

  // Keep refs for channelsResponse and profileResponse so effects don't re-run on every refetch
  const channelsResponseRef = useRef<any>(null);
  const profileResponseRef = useRef<any>(null);
  useEffect(() => { channelsResponseRef.current = channelsResponse; }, [channelsResponse]);
  useEffect(() => { profileResponseRef.current = profileResponse; }, [profileResponse]);

  // Accumulated messages across pages for infinite-scroll style pagination
  const [allPagedMessages, setAllPagedMessages] = useState<any[]>([]);
  useEffect(() => {
    const incoming = messagesResponse?.data?.messages;
    if (!Array.isArray(incoming)) return;
    if (msgPage === 1) {
      // First page (or channel switch) — replace
      setAllPagedMessages(incoming);
    } else {
      // Subsequent pages — prepend older messages at top
      setAllPagedMessages((prev) => {
        const existingIds = new Set(prev.map((m: any) => m.id || m._id));
        const newOnes = incoming.filter((m: any) => !existingIds.has(m.id || m._id));
        return [...newOnes, ...prev];
      });
    }
    // Clean up optimistic messages — they are now confirmed by the server
    setRealtimeMessages((prev) => prev.filter((m) => !m.id?.startsWith("opt-")));
  }, [messagesResponse]);

  // Local Chat / Message state
  const [typedMessage, setTypedMessage] = useState("");
  const [searchChatQuery, setSearchChatQuery] = useState("");
  const messageEndRef = useRef<HTMLDivElement>(null);

  // Real-time WebSocket state
  const wsRef = useRef<WebSocket | null>(null);
  const [realtimeMessages, setRealtimeMessages] = useState<any[]>([]);
  const [remoteTyping, setRemoteTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeChannelNameRef = useRef<string | null>(null);
  const isSendingTypingRef = useRef(false);

  // Local Profile edit fields
  const [profName, setProfName] = useState("Mr. Rahman");
  const [profDob, setProfDob] = useState("28/11/1997");
  const [profCountry, setProfCountry] = useState("Bangladesh");
  const [profPhone, setProfPhone] = useState("+880 1712-345678");

  // Passwords
  const [currPass, setCurrPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confPass, setConfPass] = useState("");
  const [showCurrPass, setShowCurrPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfPass, setShowConfPass] = useState(false);

  const [profileSubView, setProfileSubView] = useState<"main" | "edit" | "settings" | "password" | "terms" | "privacy" | "about" | "payment" | "faq">("main");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Global Notification
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const triggerNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Skip onboarding if user is already registered as a service provider
  useEffect(() => {
    if (profileResponse?.data?.isService) {
      setSpPhase("dashboard");
    }
    if (profileResponse?.data) {
      const u = profileResponse.data;
      if (u.fullName) setProfName(u.fullName);
      if (u.country) setProfCountry(u.country);
      if (u.contactNumber) setProfPhone(u.contactNumber);
    }
  }, [profileResponse]);

  // Refetch relevant queries when changing tabs
  useEffect(() => {
    if (activeTab === "chat") {
      refetchChannels();
      if (activeChannelId) {
        refetchMessages();
      }
    } else if (activeTab === "home") {
      refetchProfile();
    }
  }, [activeTab, activeChannelId, refetchChannels, refetchMessages, refetchProfile]);

  // ---------- WebSocket setup ----------
  const connectWs = useCallback(() => {
    // close any existing connection
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      wsRef.current.close();
    }
    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "wss://api.hostibook.com";
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      // Subscribe to the current active channel if we already have one
      if (activeChannelNameRef.current) {
        ws.send(JSON.stringify({ type: "subscribe", channelName: activeChannelNameRef.current }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "message" && data.channelName === activeChannelNameRef.current) {
          setRealtimeMessages((prev) => [...prev, data.data]);
        } else if (data.type === "typing" && data.channelName === activeChannelNameRef.current) {
          setRemoteTyping(data.isTyping);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          if (data.isTyping) {
            typingTimeoutRef.current = setTimeout(() => setRemoteTyping(false), 3000);
          }
        } else if (data.type === "seen" && data.channelName === activeChannelNameRef.current) {
          // could update UI for read receipts
        }
      } catch {
        // ignore
      }
    };

    ws.onerror = () => {};
    ws.onclose = () => {};
  }, []);

  // Connect WS once on mount, disconnect on unmount
  useEffect(() => {
    connectWs();
    return () => {
      wsRef.current?.close();
    };
  }, [connectWs]);

  // Subscribe to the new channel whenever activeChannelId changes
  // ⚠️ Only depend on activeChannelId — channelsResponse/profileResponse are read via refs
  // to avoid resetting realtimeMessages on every refetchChannels() call
  useEffect(() => {
    // Reset realtime messages ONLY when the user switches to a different conversation
    setRealtimeMessages([]);
    setRemoteTyping(false);
    setMsgPage(1);
    setAllPagedMessages([]);

    if (!activeChannelId) {
      activeChannelNameRef.current = null;
      return;
    }

    // Read channel name from the ref (no stale closure, no extra re-runs)
    const cr = channelsResponseRef.current;
    const rawChs = cr?.data?.data || cr?.data || [];
    const channelObj = rawChs.find((c: any) => c.id === activeChannelId || c._id === activeChannelId);
    const channelName = channelObj?.channelName || null;
    activeChannelNameRef.current = channelName;

    const doSubscribe = () => {
      if (!channelName) return;
      wsRef.current?.send(JSON.stringify({ type: "subscribe", channelName }));
      const myId = profileResponseRef.current?.data?.id;
      if (myId) {
        wsRef.current?.send(JSON.stringify({ type: "seen", channelName, senderId: myId }));
      }
    };

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      doSubscribe();
    } else {
      // WS still connecting — subscribe once it opens
      const prev = wsRef.current?.onopen;
      if (wsRef.current) {
        wsRef.current.onopen = (e) => {
          (prev as any)?.(e);
          doSubscribe();
        };
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChannelId]);

  // Auto-scroll chat history
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChannelId, messagesResponse, realtimeMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = typedMessage.trim();
    if (!text || activeChannelId === null) return;

    const cr = channelsResponseRef.current;
    const rawChs = cr?.data?.data || cr?.data || [];
    const currentChannelObj = rawChs.find(
      (c: any) => c.id === activeChannelId || c._id === activeChannelId
    );
    const receiverUser = currentChannelObj?.receiverUser;
    const receiverId = receiverUser?.id || receiverUser?._id || "";
    const channelName = currentChannelObj?.channelName;
    const myId = profileResponseRef.current?.data?.id;

    // Optimistically add the message locally so UI is instant
    const optimisticId = `opt-${Date.now()}`;
    const optimisticMsg = {
      id: optimisticId,
      message: text,
      senderId: myId,
      createdAt: new Date().toISOString(),
    };
    setRealtimeMessages((prev) => [...prev, optimisticMsg]);
    setTypedMessage("");

    try {
      if (channelName && wsRef.current?.readyState === WebSocket.OPEN && myId) {
        // Send via WS — backend saves + broadcasts to the receiver
        wsRef.current.send(
          JSON.stringify({
            type: "message",
            channelName,
            message: text,
            senderId: myId,
            receiverId,
          })
        );
        // Refetch messages after a short delay so the confirmed message replaces the optimistic one
        setTimeout(() => {
          refetchMessages();
        }, 600);
      } else if (receiverId) {
        // Fallback: REST API
        const formData = new FormData();
        formData.append("data", JSON.stringify({ message: text }));
        await sendMessageMutation({ receiverId, body: formData }).unwrap();
        refetchMessages();
      }
      // Stop typing indicator
      if (channelName && wsRef.current?.readyState === WebSocket.OPEN && myId) {
        wsRef.current.send(JSON.stringify({ type: "typing", channelName, senderId: myId, isTyping: false }));
      }
      isSendingTypingRef.current = false;
    } catch (err: any) {
      triggerNotification("Failed to send message", "error");
    }
  };

  const handleTyping = (value: string) => {
    setTypedMessage(value);
    const channelName = activeChannelNameRef.current;
    const myId = profileResponse?.data?.id;
    if (!channelName || !myId || wsRef.current?.readyState !== WebSocket.OPEN) return;

    if (!isSendingTypingRef.current) {
      isSendingTypingRef.current = true;
      wsRef.current.send(JSON.stringify({ type: "typing", channelName, senderId: myId, isTyping: true }));
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isSendingTypingRef.current = false;
      wsRef.current?.send(JSON.stringify({ type: "typing", channelName, senderId: myId, isTyping: false }));
    }, 2000);
  };

  const handleSaveFirstService = async (serviceData: any) => {
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
    } catch (err: any) {
      console.error(err);
      triggerNotification("Failed to create onboarding service", "error");
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile({
        fullName: profName,
        contactNumber: profPhone,
        country: profCountry,
      }).unwrap();
      triggerNotification("Profile details saved successfully!");
      setProfileSubView("main");
    } catch (err: any) {
      triggerNotification("Failed to update profile", "error");
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
      await changePassword({
        oldPassword: currPass,
        newPassword: newPass,
      }).unwrap();
      triggerNotification("Password updated successfully!");
      setCurrPass("");
      setNewPass("");
      setConfPass("");
      setProfileSubView("settings");
    } catch (err: any) {
      triggerNotification(err?.data?.message || "Failed to update password", "error");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount(undefined).unwrap();
      triggerNotification("Account deleted successfully");
      performLogout(dispatch);
      router.push("/");
    } catch (err: any) {
      triggerNotification("Failed to delete account", "error");
    }
  };

  // Compute channels list — API wraps in data.data
  const rawChannels: any[] = channelsResponse?.data?.data || channelsResponse?.data || [];

  // Active channel object
  const activeChannelObj = rawChannels.find((c: any) => c.id === activeChannelId || c._id === activeChannelId);

  // Sort allPagedMessages chronologically (oldest→newest) then append realtime
  const sortedRest = [...allPagedMessages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const allMessageIds = new Set(sortedRest.map((m: any) => m.id || m._id));
  const messages = [
    ...sortedRest,
    ...realtimeMessages.filter((m) => m.id?.startsWith("opt-") || !allMessageIds.has(m.id)),
  ];

  const msgTotal = messagesResponse?.data?.meta?.total ?? 0;
  const hasMoreMessages = msgTotal > allPagedMessages.length;

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen w-full flex flex-col justify-center items-center bg-zinc-50 font-sans">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-bold text-zinc-650 animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 font-sans text-zinc-900 flex flex-col relative antialiased selection:bg-blue-100 selection:text-blue-800 w-full h-full">
      {/* Toast Notification */}
      {notification && (
        <Toast
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Onboarding screens */}
      {spPhase !== "dashboard" && (
        <SPOnboarding
          onSaveFirstService={handleSaveFirstService}
          onFinishOnboarding={() => setSpPhase("dashboard")}
          triggerNotification={triggerNotification}
        />
      )}

      {/* Main portal dashboard */}
      {spPhase === "dashboard" && (
        <div className="flex-1 flex flex-col md:flex-row h-screen overflow-hidden bg-zinc-55 bg-zinc-50 w-full relative">
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
                {[
                  { id: "home", label: "Home", icon: <HomeIconComponent /> },
                  { id: "chat", label: "Messages", icon: <ChatIconComponent /> },
                  { id: "profile", label: "My Profile", icon: <ProfileIconComponent /> },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as any);
                      setSubView(null);
                      setSelectedJobId(null);
                      setProfileSubView("main");
                    }}
                    className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                      activeTab === item.id && subView === null
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
                onClick={() => triggerNotification("No new notifications")}
                className="relative p-2 rounded-full bg-white border border-zinc-150 text-zinc-650 hover:bg-zinc-50 shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
            </div>

            {/* MOBILE SIDEBAR DRAWER FOR SERVICE PROVIDER */}
            {spPhase === "dashboard" && showMobileSidebar && (
              <div className="fixed inset-0 z-[150] flex md:hidden">
                <div
                  className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs transition-opacity duration-300"
                  onClick={() => setShowMobileSidebar(false)}
                />
                <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white pt-5 pb-4 shadow-2xl transition-transform duration-300 transform translate-x-0">
                  <div className="flex items-center justify-between px-6 mb-8">
                    <div className="flex items-center gap-3 text-left" onClick={() => { setSubView(null); setActiveTab("home"); setShowMobileSidebar(false); }}>
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
                        {
                          id: "home", label: "My Dashboard", icon: (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                          )
                        },
                        {
                          id: "chat", label: "Messages", icon: (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          )
                        },
                        {
                          id: "profile", label: "My Profile", icon: (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          )
                        }
                      ].map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setActiveTab(item.id as any);
                              setSubView(null);
                              setProfileSubView("main");
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
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* dynamic view rendering */}
            {activeTab === "home" && (
              <>
                {subView === "job-details" && selectedJobId ? (
                  <SPJobDetails
                    jobId={selectedJobId}
                    onBack={() => {
                      setSubView("jobs");
                      setSelectedJobId(null);
                    }}
                    triggerNotification={triggerNotification}
                  />
                ) : subView === "earnings" ? (
                  <ProviderEarnings
                    onBack={() => setSubView(null)}
                    triggerNotification={triggerNotification}
                  />
                ) : (
                  <SPHome
                    profName={profName}
                    subView={subView}
                    setSubView={setSubView}
                    onViewJobDetails={(jobId) => {
                      setSelectedJobId(jobId);
                      setSubView("job-details");
                    }}
                    onViewProofOfWork={(jobId) => {
                      setSelectedJobId(jobId);
                      setSubView("job-details");
                    }}
                    onMessageOwner={(ownerId, ownerName) => {
                      setActiveChannelId("mock-chat-1"); // route to active channel thread
                      setActiveTab("chat");
                      setSubView(null);
                    }}
                    triggerNotification={triggerNotification}
                  />
                )}
              </>
            )}

            {/* TAB VIEW: MESSAGES / CHAT */}
            {activeTab === "chat" && (
              <div className="flex-1 flex flex-col lg:flex-row bg-white overflow-hidden w-full h-full pb-20 lg:pb-0 border-t border-zinc-200">
                {/* THREADS LIST */}
                <div className={`w-full lg:w-80 border-r border-zinc-150 flex flex-col h-full ${
                  activeChannelId !== null ? "hidden lg:flex" : "flex"
                }`}>
                  <div className="p-4 border-b border-zinc-150 flex flex-col gap-3 shrink-0">
                    <div className="flex items-center justify-between text-left">
                      <h3 className="text-lg font-black tracking-tight text-zinc-950">Messages</h3>
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
                      <div className="absolute left-3 top-2.5">
                        <SearchIcon />
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
                    {isLoadingChannels ? (
                      // Skeleton loading for conversations
                      <div className="p-3 space-y-3">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
                            <div className="w-12 h-12 rounded-full bg-zinc-200 shrink-0" />
                            <div className="flex-1 space-y-2">
                              <div className="h-3 bg-zinc-200 rounded-full w-3/4" />
                              <div className="h-2.5 bg-zinc-100 rounded-full w-1/2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : rawChannels.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full gap-3 p-8 text-center">
                        <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-300">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                          </svg>
                        </div>
                        <p className="text-xs font-bold text-zinc-400">No conversations yet.</p>
                      </div>
                    ) : (
                      rawChannels
                        .filter((c: any) => {
                          const name = c.receiverUser?.fullName || c.name || "";
                          return name.toLowerCase().includes(searchChatQuery.toLowerCase());
                        })
                        .map((c: any) => {
                          const isActive = activeChannelId === (c.id || c._id);
                          const receiverUser = c.receiverUser;
                          const avatar = receiverUser?.profileImage || "https://i.ibb.co/Ps9gZ8DD/Profile-image.png";
                          const name = receiverUser?.fullName || c.name || "Unknown";
                          const lastMsgText = c.lastMessage?.message || c.lastMsg || "Tap to open conversation";
                          const lastMsgTime = formatMsgTime(c.lastMessage?.createdAt || c.updatedAt);
                          const hasUnread = !c.isReadByMe;
                          return (
                            <button
                              key={c.id || c._id}
                              onClick={() => setActiveChannelId(c.id || c._id)}
                              className={`w-full p-4 text-left flex items-start gap-3 transition-colors ${
                                isActive ? "bg-blue-600 text-white" : "hover:bg-zinc-50"
                              }`}
                            >
                              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-zinc-200 shrink-0 shadow-inner">
                                <img src={avatar} alt={name} className="w-full h-full object-cover" />
                                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white bg-emerald-500" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-0.5">
                                  <h4 className={`text-sm font-bold truncate ${isActive ? "text-white" : "text-zinc-900"}`}>
                                    {name}
                                  </h4>
                                  <span className={`text-[10px] font-semibold shrink-0 ml-1 ${isActive ? "text-blue-100" : "text-zinc-400"}`}>
                                    {lastMsgTime}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-1">
                                  <p className={`text-xs truncate font-medium ${isActive ? "text-blue-100" : "text-zinc-500"}`}>
                                    {lastMsgText}
                                  </p>
                                  {hasUnread && !isActive && (
                                    <span className="shrink-0 w-2 h-2 rounded-full bg-blue-600" />
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })
                    )}

                    {(() => {
                      const channelsMeta = channelsResponse?.data?.meta || channelsResponse?.meta;
                      const rawChannels = channelsResponse?.data?.data || channelsResponse?.data || [];
                      const hasMoreChannels = channelsMeta ? rawChannels.length < channelsMeta.total : false;
                      if (!hasMoreChannels) return null;
                      return (
                        <div className="p-3 text-center border-t border-zinc-100 shrink-0">
                          <button
                            onClick={() => setChannelLimit((prev) => prev + 20)}
                            disabled={isFetchingChannels}
                            className="w-full py-2 px-3 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {isFetchingChannels ? "Loading chats..." : "Load More Chats"}
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* CONVERSATION VIEW */}
                <div className={`flex-1 flex flex-col justify-between bg-zinc-50/30 h-full ${
                  activeChannelId === null ? "hidden lg:flex" : "flex"
                }`}>
                  {activeChannelId === null ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-sm mx-auto">
                      <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4 shadow-sm">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" />
                        </svg>
                      </div>
                      <h3 className="text-base font-black text-zinc-950">Your Messages</h3>
                      <p className="text-xs text-zinc-400 mt-1 font-semibold leading-relaxed">
                        Select a conversation from the left panel to chat with property owners in real time.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Chat Header */}
                      {(() => {
                        const receiverUser = activeChannelObj?.receiverUser;
                        const activeAvatar = receiverUser?.profileImage || "https://i.ibb.co/Ps9gZ8DD/Profile-image.png";
                        const activeName = receiverUser?.fullName || activeChannelObj?.name || "User";
                        const activeRole = receiverUser?.role === "PROPERTY_OWNER" ? "Property Owner" : (receiverUser?.role || "Hostibook User");
                        return (
                          <div className="p-4 bg-white border-b border-zinc-150 flex items-center justify-between shadow-sm shrink-0">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setActiveChannelId(null)}
                                className="lg:hidden p-1.5 rounded-full hover:bg-zinc-100 text-zinc-500 transition-colors"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                                </svg>
                              </button>

                              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-zinc-200 shadow-inner shrink-0">
                                <img src={activeAvatar} alt={activeName} className="w-full h-full object-cover" />
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white bg-emerald-500" />
                              </div>
                              <div className="text-left">
                                <h4 className="text-sm font-bold text-zinc-900 leading-tight">{activeName}</h4>
                                <p className="text-[10px] text-zinc-400 font-semibold">
                                  {remoteTyping ? (
                                    <span className="text-blue-500 animate-pulse">typing...</span>
                                  ) : (
                                    <>{activeRole} &bull; Active Now</>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${
                                wsRef.current?.readyState === WebSocket.OPEN ? "bg-emerald-500" : "bg-zinc-300"
                              }`} title={wsRef.current?.readyState === WebSocket.OPEN ? "Real-time connected" : "Connecting..."} />
                            </div>
                          </div>
                        );
                      })()}

                      {/* Messages list */}
                      <div className="flex-1 p-5 overflow-y-auto space-y-4">
                        {(isLoadingMessages || isFetchingMessages) && allPagedMessages.length === 0 ? (
                          // Skeleton loading for messages
                          <div className="space-y-4 animate-pulse">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <div key={i} className={`flex flex-col max-w-[60%] ${i % 2 === 0 ? "ml-auto items-end" : "mr-auto items-start"}`}>
                                <div className={`h-9 rounded-2xl ${i % 2 === 0 ? "bg-blue-100 w-40" : "bg-zinc-200 w-52"}`} />
                                <div className="h-2 bg-zinc-100 rounded w-10 mt-1" />
                              </div>
                            ))}
                          </div>
                        ) : messages.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-center py-16">
                            <p className="text-xs font-bold text-zinc-400">No messages yet. Say hello! 👋</p>
                          </div>
                        ) : (
                          messages.map((msg: any, idx: number) => {
                            const isSent = msg.senderId === profileResponse?.data?.id;
                            const isOptimistic = msg.id?.startsWith("opt-");
                            return (
                              <div
                                key={msg.id || msg._id || idx}
                                className={`flex flex-col max-w-[78%] ${
                                  isSent ? "ml-auto items-end" : "mr-auto items-start"
                                }`}
                              >
                                <div className={`px-4 py-3 rounded-2xl text-xs font-semibold leading-relaxed text-left ${
                                  isSent
                                    ? `bg-blue-600 text-white rounded-br-none shadow-sm ${isOptimistic ? "opacity-70" : ""}`
                                    : "bg-zinc-100 text-zinc-800 rounded-bl-none border border-zinc-200"
                                }`}>
                                  {msg.message || msg.text}
                                </div>
                                <span className="text-[9px] font-semibold text-zinc-400 mt-1">
                                  {formatMsgTime(msg.createdAt) || msg.time || ""}
                                  {isSent && !isOptimistic && (
                                    <span className="ml-1 text-emerald-500">✓</span>
                                  )}
                                </span>
                              </div>
                            );
                          })
                        )}
                        <div ref={messageEndRef} />
                      </div>

                      {/* Input send bar */}
                      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-zinc-150 flex items-center gap-3 shrink-0">
                        <div className="flex-1 relative flex items-center">
                          <input
                            type="text"
                            value={typedMessage}
                            onChange={(e) => handleTyping(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(e as any); } }}
                            placeholder="Type a message..."
                            className="w-full pl-4 pr-4 py-3 rounded-2xl border border-zinc-200 focus:border-blue-500 outline-none text-xs font-bold bg-zinc-50 transition-colors"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={!typedMessage.trim()}
                          className="h-10 w-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center shadow-md active:scale-[0.97] transition-all shrink-0"
                          aria-label="Send message"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                          </svg>
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* TAB VIEW: MY PROFILE */}
            {activeTab === "profile" && (
              <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8 lg:p-10 pb-24 md:pb-8 flex flex-col overflow-y-auto lg:overflow-hidden lg:h-full">
                
                {/* MOBILE VIEW */}
                <div className="lg:hidden w-full max-w-xl mx-auto bg-white border border-zinc-150 p-6 sm:p-8 rounded-3xl shadow-sm min-h-[500px] flex flex-col justify-between transition-all duration-300">
                  {profileSubView === "main" && (
                    <div className="space-y-6 flex-1 flex flex-col">
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight">My Profile</h2>
                      </div>

                      <div className="flex items-center gap-4 border-b border-zinc-150 pb-6 text-left">
                        <div className="w-20 h-20 rounded-full bg-zinc-200 overflow-hidden relative shadow-inner shrink-0 border-2 border-zinc-100">
                          <img
                            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80"
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="text-left">
                          <h3 className="text-lg font-black text-zinc-950">{profName}</h3>
                          <p className="text-xs font-bold text-zinc-400 mt-0.5 leading-none">Service Provider</p>
                        </div>
                      </div>

                      <div className="space-y-3.5 flex-1 pt-2">
                        {[
                          { label: "Edit Profile", desc: "Manage phone, country, and DOB", icon: "👤", key: "edit" },
                          { label: "Account Settings", desc: "Change password, terms, and about", icon: "⚙️", key: "settings" },
                          { label: "Payment Settings", desc: "Review registered Stripe payout details", icon: "💳", key: "payment" },
                        ].map((item) => (
                          <button
                            key={item.key}
                            onClick={() => setProfileSubView(item.key as any)}
                            className="w-full p-4 border border-zinc-150 rounded-2xl text-left hover:border-blue-400 hover:shadow-sm transition-all flex items-center justify-between"
                          >
                            <div className="flex items-start gap-4">
                              <span className="text-xl shrink-0 mt-0.5">{item.icon}</span>
                              <div>
                                <h4 className="text-sm font-bold text-zinc-955">{item.label}</h4>
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
                        className="w-full py-4 border-2 border-red-50 hover:bg-red-50 text-red-500 rounded-2xl font-bold transition-all text-sm mt-4 text-center shrink-0"
                      >
                        Logout
                      </button>
                    </div>
                  )}

                  {profileSubView === "edit" && (
                    <EditProfileView onBack={() => setProfileSubView("main")} triggerNotification={triggerNotification} />
                  )}
                  {profileSubView === "settings" && (
                    <AccountSettingsView onNavigate={(view) => setProfileSubView(view as any)} />
                  )}

                  {profileSubView === "password" && (
                    <div className="space-y-6 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-3 border-b border-zinc-150 pb-4 mb-4">
                          <button onClick={() => setProfileSubView("settings")} className="text-zinc-400 hover:text-zinc-650 font-bold">
                            ← Back
                          </button>
                          <h3 className="text-base font-black text-zinc-950">Change Password</h3>
                        </div>

                        <div className="space-y-4 text-left">
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">Current Password</label>
                            <div className="relative">
                              <input
                                type={showCurrPass ? "text" : "password"}
                                value={currPass}
                                onChange={(e) => setCurrPass(e.target.value)}
                                placeholder="••••••"
                                className="w-full px-4 py-3 pr-10 rounded-xl border border-zinc-200 bg-zinc-50/50 outline-none text-xs font-bold"
                              />
                              <button type="button" onClick={() => setShowCurrPass(!showCurrPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer">
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
                                className="w-full px-4 py-3 pr-10 rounded-xl border border-zinc-200 bg-zinc-50/50 outline-none text-xs font-bold"
                              />
                              <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer">
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
                                className="w-full px-4 py-3 pr-10 rounded-xl border border-zinc-200 bg-zinc-50/50 outline-none text-xs font-bold"
                              />
                              <button type="button" onClick={() => setShowConfPass(!showConfPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer">
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
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-md text-sm mt-6"
                      >
                        {isChangingPassword ? "Updating..." : "Update Password"}
                      </button>
                    </div>
                  )}

                  {profileSubView === "payment" && (
                    <div className="space-y-6 flex-1 flex flex-col justify-between text-left animate-fadeIn">
                      <div>
                        <div className="flex items-center gap-3 border-b border-zinc-150 pb-4 mb-4">
                          <button onClick={() => setProfileSubView("main")} className="text-zinc-400 hover:text-zinc-650 font-bold">
                            ← Back
                          </button>
                          <h3 className="text-base font-black text-zinc-955">Payment Settings</h3>
                        </div>
                        
                        {profileResponse?.data?.isStripeConnected ? (
                          <div className="relative rounded-3xl p-6 bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-800 text-white shadow-xl overflow-hidden mb-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-[9px] font-black tracking-widest text-blue-200 uppercase">Hostibook Payout</span>
                                <p className="text-sm font-extrabold mt-0.5">Stripe Connected Account</p>
                              </div>
                              <span className="px-2.5 py-0.5 rounded-xl bg-white/20 text-[9px] font-black border border-white/30">Stripe</span>
                            </div>
                            <div className="my-6">
                              <p className="text-xs font-mono tracking-wider font-semibold opacity-90">
                                {profileResponse?.data?.stripeAccountId ? `Account: ${profileResponse.data.stripeAccountId}` : "Account ID: N/A"}
                              </p>
                              <p className="text-lg font-mono tracking-widest font-bold mt-2">••••  ••••  ••••  9876</p>
                            </div>
                            <div className="flex items-center gap-1.5 mt-4 bg-emerald-500/20 border border-emerald-400/30 rounded-xl px-3 py-2 text-xs font-bold text-emerald-200">
                              <span className="text-sm">✓</span>
                              <span>Stripe Connected Successfully</span>
                            </div>
                          </div>
                        ) : (
                          <div className="relative rounded-3xl p-6 bg-gradient-to-br from-zinc-700 to-zinc-900 text-white shadow-xl overflow-hidden mb-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-[9px] font-black tracking-widest text-zinc-300 uppercase">Hostibook Payout</span>
                                <p className="text-sm font-extrabold mt-0.5">Stripe Disconnected</p>
                              </div>
                              <span className="px-2.5 py-0.5 rounded-xl bg-white/20 text-[9px] font-black border border-white/30">Stripe</span>
                            </div>
                            <div className="my-6">
                              <p className="text-xs font-mono tracking-wider font-semibold opacity-90">Account ID: Not Connected</p>
                              <p className="text-lg font-mono tracking-widest font-bold mt-2">••••  ••••  ••••  ••••</p>
                            </div>
                            <div className="flex items-center gap-1.5 mt-4 bg-amber-500/20 border border-amber-400/30 rounded-xl px-3 py-2 text-xs font-bold text-amber-200">
                              <span className="text-sm">⚠️</span>
                              <span>Stripe Setup Pending</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {(profileSubView === "terms" || profileSubView === "privacy" || profileSubView === "about") && (
                    <div className="space-y-6 flex-1 flex flex-col justify-between text-left animate-fadeIn">
                      <div>
                        <div className="flex items-center gap-3 border-b border-zinc-150 pb-4 mb-4">
                          <button onClick={() => setProfileSubView("settings")} className="text-zinc-400 hover:text-zinc-655 font-bold">← Back</button>
                          <h3 className="text-base font-black text-zinc-955 capitalize">
                            {profileSubView === "terms" ? "Terms of Services" : profileSubView === "privacy" ? "Privacy Policy" : "About Us"}
                          </h3>
                        </div>

                        <div className="text-xs text-zinc-500 font-semibold leading-relaxed max-h-[320px] overflow-y-auto whitespace-pre-line text-left">
                          {profileSubView === "terms" && termsText}
                          {profileSubView === "privacy" && privacyText}
                          {profileSubView === "about" && aboutText}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* DESKTOP VIEW */}
                <div className="hidden lg:grid lg:grid-cols-12 lg:gap-8 lg:h-full lg:items-stretch w-full">
                  <div className="lg:col-span-4 bg-white border border-zinc-150 p-6 rounded-3xl shadow-sm flex flex-col justify-between h-full text-left">
                    <div className="space-y-6">
                      <div className="flex items-center gap-4 border-b border-zinc-150 pb-6">
                        <div className="w-16 h-16 rounded-full bg-zinc-200 overflow-hidden relative shadow-inner shrink-0 border-2 border-zinc-100">
                          <img
                            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80"
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="text-left">
                          <h3 className="text-base font-black text-zinc-900">{profName}</h3>
                          <p className="text-[11px] font-bold text-zinc-400 mt-0.5 leading-none">Service Provider</p>
                          <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[8px] font-extrabold tracking-wide uppercase leading-none">
                            Verified • Active
                          </span>
                        </div>
                      </div>

                      <nav className="space-y-2.5">
                        {[
                          { label: "Edit Profile", key: "edit", icon: "👤", desc: "Manage phone, country, and DOB" },
                          { label: "Payment Settings", key: "payment", icon: "💳", desc: "Manage your Stripe payouts" },
                          { label: "Account Settings", key: "settings", icon: "⚙️", desc: "Change password, terms, privacy, FAQ, etc." },
                        ].map((item) => {
                          const isActive = profileSubView === item.key || 
                                          (profileSubView === "main" && item.key === "edit") || 
                                          (item.key === "settings" && ["settings", "password", "terms", "privacy", "about", "faq"].includes(profileSubView));
                          return (
                            <button
                              key={item.key}
                              onClick={() => setProfileSubView(item.key as any)}
                              className={`w-full p-3.5 rounded-2xl text-left transition-all border flex items-center justify-between group ${
                                isActive
                                  ? "bg-blue-600 text-white border-blue-600 shadow-md"
                                  : "bg-white border-zinc-150 text-zinc-650 hover:border-blue-400 hover:text-zinc-900"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-lg shrink-0">{item.icon}</span>
                                <div className="text-left">
                                  <h4 className="text-xs font-bold leading-tight">{item.label}</h4>
                                  <p className={`text-[9px] font-semibold mt-0.5 leading-none ${isActive ? "text-blue-100" : "text-zinc-400"}`}>
                                    {item.desc}
                                  </p>
                                </div>
                              </div>
                              <span className="text-xs">→</span>
                            </button>
                          );
                        })}
                      </nav>
                    </div>
                  </div>
                  <div className="lg:col-span-8 bg-white border border-zinc-150 p-8 rounded-3xl shadow-sm flex flex-col justify-between overflow-y-auto h-full min-h-[550px]">
                    {(profileSubView === "main" || profileSubView === "edit") && (
                      <EditProfileView onBack={() => setProfileSubView("main")} triggerNotification={triggerNotification} />
                    )}
                    
                    {profileSubView === "settings" && (
                      <AccountSettingsView onNavigate={(view) => setProfileSubView(view as any)} />
                    )}

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
                                  className="w-full px-4 py-3.5 pr-10 rounded-xl border border-zinc-200 outline-none text-xs font-bold text-zinc-800"
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
                                  className="w-full px-4 py-3.5 pr-10 rounded-xl border border-zinc-200 outline-none text-xs font-bold text-zinc-800"
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
                                  className="w-full px-4 py-3.5 pr-10 rounded-xl border border-zinc-200 outline-none text-xs font-bold text-zinc-800"
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
                          className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-450 text-white rounded-2xl font-bold shadow-md text-xs mt-6 cursor-pointer"
                        >
                          {isChangingPassword ? "Updating..." : "Update Password"}
                        </button>
                      </div>
                    )}

                    {profileSubView === "payment" && (
                      <div className="space-y-6 flex-1 flex flex-col justify-between text-left animate-fadeIn">
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-lg font-black text-zinc-900 tracking-tight">Payout & Billing Settings</h3>
                            <p className="text-xs text-zinc-400 font-semibold mt-0.5">Manage your payout account via Stripe.</p>
                          </div>
                          
                          {profileResponse?.data?.isStripeConnected ? (
                            <div className="relative rounded-3xl p-6 bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-800 text-white shadow-xl overflow-hidden max-w-sm">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-[9px] tracking-widest text-blue-200 uppercase font-black">VISA Payout Card</p>
                                  <p className="text-sm font-extrabold mt-0.5">Stripe Connected Account</p>
                                </div>
                                <span className="px-2.5 py-0.5 rounded-xl bg-white/20 text-[9px] font-black border border-white/30">Stripe</span>
                              </div>
                              <div className="my-6">
                                <p className="text-xs font-mono tracking-wider font-semibold opacity-90">
                                  {profileResponse?.data?.stripeAccountId ? `Account: ${profileResponse.data.stripeAccountId}` : "Account ID: N/A"}
                                </p>
                                <p className="text-lg font-mono tracking-widest font-bold mt-2">••••  ••••  ••••  9876</p>
                              </div>
                              <div className="flex items-center gap-1.5 mt-4 bg-emerald-500/20 border border-emerald-400/30 rounded-xl px-3 py-2 text-xs font-bold text-emerald-200">
                                <span className="text-sm">✓</span>
                                <span>Stripe Connected Successfully</span>
                              </div>
                            </div>
                          ) : (
                            <div className="relative rounded-3xl p-6 bg-gradient-to-br from-zinc-700 to-zinc-900 text-white shadow-xl overflow-hidden max-w-sm">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-[9px] tracking-widest text-zinc-300 uppercase font-black">Hostibook Payout</p>
                                  <p className="text-sm font-extrabold mt-0.5">Stripe Disconnected</p>
                                </div>
                                <span className="px-2.5 py-0.5 rounded-xl bg-white/20 text-[9px] font-black border border-white/30">Stripe</span>
                              </div>
                              <div className="my-6">
                                <p className="text-xs font-mono tracking-wider font-semibold opacity-90">Account ID: Not Connected</p>
                                <p className="text-lg font-mono tracking-widest font-bold mt-2">••••  ••••  ••••  ••••</p>
                              </div>
                              <div className="flex items-center gap-1.5 mt-4 bg-amber-500/20 border border-amber-400/30 rounded-xl px-3 py-2 text-xs font-bold text-amber-200">
                                <span className="text-sm">⚠️</span>
                                <span>Stripe Setup Pending</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {(profileSubView === "terms" || profileSubView === "privacy" || profileSubView === "about") && (
                      <div className="space-y-6 flex-1 flex flex-col justify-between text-left animate-fadeIn">
                        <div>
                          <h3 className="text-lg font-black text-zinc-900 tracking-tight mb-4 capitalize">
                            {profileSubView === "terms" ? "Terms of Services" : profileSubView === "privacy" ? "Privacy Policy" : "About Us"}
                          </h3>
                          <div className="space-y-4 text-xs text-zinc-500 font-semibold leading-relaxed max-h-[420px] overflow-y-auto whitespace-pre-line text-left">
                            {profileSubView === "terms" && termsText}
                            {profileSubView === "privacy" && privacyText}
                            {profileSubView === "about" && aboutText}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {profileSubView === "faq" && (
                      <div className="space-y-6 flex-1 flex flex-col justify-between text-left animate-fadeIn">
                        <div>
                          <div className="flex items-center gap-3 border-b border-zinc-150 pb-4 mb-4">
                            <button onClick={() => setProfileSubView("settings")} className="text-zinc-400 hover:text-zinc-655 font-bold">← Back</button>
                            <h3 className="text-base font-black text-zinc-955 capitalize">FAQ</h3>
                          </div>
                          <FAQView />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* MOBILE TAB BAR */}
          <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-zinc-200 md:hidden flex justify-around py-3.5 px-4 shadow-xl">
            {[
              { id: "home", label: "Home", icon: <HomeIconComponent /> },
              { id: "chat", label: "Chat", icon: <ChatIconComponent /> },
              { id: "profile", label: "Profile", icon: <ProfileIconComponent /> },
            ].map((tab) => {
              const isActive = activeTab === tab.id && subView === null;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setSubView(null);
                    setSelectedJobId(null);
                    setProfileSubView("main");
                  }}
                  className={`flex flex-col items-center gap-1 transition-all ${
                    isActive
                      ? "text-blue-600 font-black scale-105"
                      : "text-zinc-400 hover:text-zinc-650"
                  }`}
                >
                  {tab.icon}
                  <span className="text-[10px] font-bold">{tab.label}</span>
                </button>
              );
            })}
          </footer>
        </div>
      )}

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

      {/* DELETE ACCOUNT CONFIRM MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-[280px] bg-white border border-zinc-200 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-wider leading-relaxed">Confirm deleting your account?</h3>
            <div className="flex gap-3 pt-2">
              <button onClick={handleDeleteAccount} className="flex-1 py-2.5 border-2 border-red-500 text-red-500 font-extrabold rounded-2xl text-xs hover:bg-red-50 transition-colors">Yes</button>
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 bg-blue-600 text-white font-extrabold rounded-2xl text-xs hover:bg-blue-700 transition-colors">No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
