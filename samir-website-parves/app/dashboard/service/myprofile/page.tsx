"use client";

import { User, Settings, CreditCard, Users } from "lucide-react";

import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useDebounce } from "@/app/hooks/useDebounce";
import { RootState } from "@/redux/store";
import { logout } from "@/redux/features/authSlice";
import { performLogout } from "@/lib/logoutCleanup";
import { useRouter } from "next/navigation";
import {
  useGetMyProfileQuery,
  useUpdateProfileMutation,
  useDeleteMyAccountMutation,
} from "@/redux/api/userApi";
import { useChangePasswordMutation } from "@/redux/api/authApi";
import { useStripeAccountOnboardingMutation } from "@/redux/api/paymentApi";
import { useGetAllFaqQuery } from "@/redux/api/faqApi";
import AccountSettingsView from "../../components/profile/AccountSettingsView";
import TermsView from "../../components/profile/TermsView";
import PrivacyView from "../../components/profile/PrivacyView";
import AboutView from "../../components/profile/AboutView";
import { useNotification } from "../layout";
import {
  useGetMyClientsQuery,
  useGetMySavedUsersQuery,
  useToggleUserFavoriteMutation,
} from "@/redux/api/favoriteApi";
import { useCreatePropertyOwnerReviewMutation } from "@/redux/api/reviewApi";

export default function MyProfilePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);
  const { triggerNotification } = useNotification();

  // RTK API endpoints
  const { data: profileResponse, refetch: refetchProfile } = useGetMyProfileQuery(undefined, { skip: !token });
  const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();
  const [deleteAccount] = useDeleteMyAccountMutation();
  const [stripeOnboarding, { isLoading: isConnectingStripe }] = useStripeAccountOnboardingMutation();

  // Clients and Reviews RTK endpoints
  const { data: clientsResponse, refetch: refetchClients, isLoading: isLoadingClients } = useGetMyClientsQuery(undefined, { skip: !token });
  const { data: savedUsersResponse, refetch: refetchSaved, isLoading: isLoadingSavedUsers } = useGetMySavedUsersQuery(undefined, { skip: !token });
  const [toggleFavorite] = useToggleUserFavoriteMutation();
  const [createReview, { isLoading: isSubmittingReview }] = useCreatePropertyOwnerReviewMutation();

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewClientId, setReviewClientId] = useState<string | null>(null);
  const [reviewClientName, setReviewClientName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [activeClientTab, setActiveClientTab] = useState<"all" | "saved">("all");
  const [togglingFavoriteId, setTogglingFavoriteId] = useState<string | null>(null);

  const handleToggleFavorite = async (savedUserId: string) => {
    if (togglingFavoriteId) return;
    setTogglingFavoriteId(savedUserId);
    try {
      await toggleFavorite({ savedUserId }).unwrap();
      triggerNotification("Updated saved status successfully!");
      refetchSaved();
      refetchClients();
    } catch (err: any) {
      triggerNotification("Failed to update saved status.", "error");
    } finally {
      setTogglingFavoriteId(null);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewClientId) return;
    if (!reviewComment.trim()) {
      triggerNotification("Please enter a comment.", "error");
      return;
    }
    try {
      await createReview({
        reviewedUserId: reviewClientId,
        rating: reviewRating,
        comment: reviewComment.trim(),
      }).unwrap();
      triggerNotification("Review submitted successfully!");
      setShowReviewModal(false);
      setReviewComment("");
      setReviewRating(5);
      refetchClients();
      refetchSaved();
    } catch (err: any) {
      triggerNotification(err?.data?.message || "Failed to submit review.", "error");
    }
  };

  const handleConnectStripe = async () => {
    try {
      const res = await stripeOnboarding(undefined).unwrap();
      if (res.success && res.data?.onboardingLink) {
        window.location.href = res.data.onboardingLink;
      } else {
        triggerNotification("Failed to retrieve onboarding link.", "error");
      }
    } catch (err: any) {
      triggerNotification(err?.data?.message || "Failed to initiate Stripe onboarding.", "error");
    }
  };



  // Profile fields state
  const [profName, setProfName] = useState("Mr. Rahman");
  const [profDob, setProfDob] = useState("28/11/1997");
  const [profCountry, setProfCountry] = useState("Bangladesh");
  const [profPhone, setProfPhone] = useState("+880 1712-345678");
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Passwords
  const [currPass, setCurrPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confPass, setConfPass] = useState("");
  const [showCurrPass, setShowCurrPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfPass, setShowConfPass] = useState(false);

  const [profileSubView, setProfileSubView] = useState<"main" | "edit" | "settings" | "password" | "terms" | "privacy" | "about" | "payment" | "clients" | "faq">("main");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sync profile details
  useEffect(() => {
    if (profileResponse?.data) {
      const u = profileResponse.data;
      if (u.fullName) setProfName(u.fullName);
      if (u.country) setProfCountry(u.country);
      if (u.contactNumber) setProfPhone(u.contactNumber);
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

      await updateProfile(formData).unwrap();
      triggerNotification("Profile details saved successfully!");
      setProfileSubView("main");
    } catch (err: any) {
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

  const renderClientsView = (isMobile: boolean) => {
    const getArrayData = (res: any) => {
      if (!res) return [];
      if (Array.isArray(res)) return res;
      if (Array.isArray(res.data)) return res.data;
      if (res.data && Array.isArray(res.data.data)) return res.data.data;
      return [];
    };

    const clients = getArrayData(clientsResponse?.data);
    const saved = getArrayData(savedUsersResponse?.data);

    // Filter list based on selected tab
    const savedClients = saved.map((item: any) => item.savedUser).filter(Boolean);
    const currentList = activeClientTab === "all" ? clients : savedClients;

    const countText = `${currentList.length} property owners`;

    return (
      <div className="space-y-6 flex-1 flex flex-col justify-between text-left animate-fadeIn">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-zinc-150 pb-4 mb-4">
            {isMobile && (
              <button onClick={() => setProfileSubView("main")} className="text-zinc-400 hover:text-zinc-655 font-bold text-xs">
                ← Back
              </button>
            )}
            <h3 className="text-lg font-black text-zinc-900 tracking-tight">My Clients</h3>
          </div>

          {/* Tab buttons */}
          <div className="flex border border-zinc-200 rounded-xl overflow-hidden text-sm bg-zinc-100 max-w-[320px] p-1 gap-1">
            <button
              onClick={() => setActiveClientTab("all")}
              className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all text-center ${
                activeClientTab === "all"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              All Clients
            </button>
            <button
              onClick={() => setActiveClientTab("saved")}
              className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all text-center flex items-center justify-center gap-1.5 ${
                activeClientTab === "saved"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" />
              </svg>
              Saved
            </button>
          </div>

          {/* Subtext count */}
          <p className="text-xs font-semibold text-zinc-400">{countText}</p>

          {/* Clients list/grid */}
          {(activeClientTab === "all" ? isLoadingClients : isLoadingSavedUsers) ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : currentList.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
              <p className="text-sm font-bold">No clients found</p>
              <p className="text-xs mt-1">Clients will appear here once you interact or save them.</p>
            </div>
          ) : (
            <div className={isMobile ? "space-y-6" : "grid grid-cols-1 xl:grid-cols-2 gap-6"}>
              {currentList.map((client: any, idx: number) => {
                const clientId = client.id || client._id || `client-${idx}`;
                const clientName = client.fullName || client.name || "Client Name";
                const clientEmail = client.email || "client@mail.com";
                const clientLocation = client.address || client.country || "USA, Somara";
                const clientAvatar = client.profileImage || "https://i.ibb.co/Ps9gZ8DD/Profile-image.png";
                const propertiesCount = client.propertyCount || client.properties || 11;
                const jobsDone = client.jobsCompleted || client.jobsDone || 31;
                const lastJob = client.lastJob || "Jun 20";
                const rating = client.rating || 0.0;
                const reviewsCount = client.totalReviews || client.reviewsCount || 28;

                const isSaved = saved.some((s: any) => s.savedUser && (s.savedUser.id || s.savedUser._id) === clientId);

                return (
                  <div
                    key={clientId}
                    className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col gap-4 relative overflow-hidden"
                  >
                    {/* Top layout */}
                    <div className="flex gap-4 items-start pr-10">
                      {/* Avatar */}
                      <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 border-2 border-blue-500/20 p-0.5">
                        <img src={clientAvatar} alt={clientName} className="w-full h-full object-cover rounded-full" />
                      </div>
                      
                      {/* Details */}
                      <div className="text-left min-w-0">
                        <h4 className="text-base font-black text-zinc-900 truncate">{clientName}</h4>
                        <p className="text-xs font-semibold text-zinc-400 truncate mt-1 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-zinc-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {clientEmail}
                        </p>
                        <p className="text-xs font-semibold text-zinc-400 truncate mt-1 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-zinc-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {clientLocation}
                        </p>
                      </div>
                    </div>

                    {/* Bookmark Button */}
                    <button
                      onClick={() => handleToggleFavorite(clientId)}
                      disabled={togglingFavoriteId === clientId}
                      className={`absolute top-6 right-6 w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        togglingFavoriteId === clientId
                          ? "bg-zinc-100 text-zinc-400 opacity-75 cursor-not-allowed"
                          : isSaved
                          ? "bg-blue-50 text-blue-600 shadow-inner hover:bg-blue-100"
                          : "bg-zinc-50 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-650"
                      }`}
                      aria-label="Save Client"
                    >
                      {togglingFavoriteId === clientId ? (
                        <svg className="w-4 h-4 animate-spin text-zinc-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                        </svg>
                      )}
                    </button>

                    {/* 3-column stats */}
                    <div className="grid grid-cols-3 border border-zinc-150 rounded-2xl bg-zinc-50/50 p-3 divide-x divide-zinc-200 text-center">
                      <div className="flex flex-col items-center justify-center p-1">
                        <span className="flex items-center gap-1 text-xs font-bold text-zinc-800">
                          <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          {propertiesCount}
                        </span>
                        <span className="text-[10px] font-semibold text-zinc-400 mt-1">Properties</span>
                      </div>
                      <div className="flex flex-col items-center justify-center p-1">
                        <span className="flex items-center gap-1 text-xs font-bold text-zinc-800">
                          <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {jobsDone}
                        </span>
                        <span className="text-[10px] font-semibold text-zinc-400 mt-1">Jobs Done</span>
                      </div>
                      <div className="flex flex-col items-center justify-center p-1">
                        <span className="flex items-center gap-1 text-xs font-bold text-zinc-800">
                          <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {lastJob}
                        </span>
                        <span className="text-[10px] font-semibold text-zinc-400 mt-1">Last Job</span>
                      </div>
                    </div>

                    {/* Rating Banner */}
                    <div className="bg-amber-500/5 border border-amber-400/20 rounded-2xl p-2.5 flex items-center justify-center gap-1 text-xs">
                      <div className="flex gap-0.5 text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => {
                          const isFilled = i < Math.floor(rating);
                          return (
                            <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          );
                        })}
                      </div>
                      <span className="font-extrabold text-zinc-800 ml-1">{Number(rating).toFixed(1)}</span>
                      <span className="font-semibold text-zinc-400">({reviewsCount})</span>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 mt-1.5">
                      <button
                        onClick={() => router.push(`/dashboard/service/message?ownerId=${clientId}`)}
                        className="flex-1 py-3 bg-white border border-blue-600 hover:bg-blue-50 text-blue-600 rounded-2xl font-extrabold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Message
                      </button>
                      <button
                        onClick={() => {
                          setReviewClientId(clientId);
                          setReviewClientName(clientName);
                          setShowReviewModal(true);
                        }}
                        className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-extrabold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.977-2.888a1 1 0 00-1.176 0l-3.977 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        Review
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8 lg:p-10 pb-24 md:pb-8 flex flex-col overflow-y-auto lg:overflow-hidden lg:h-full text-left">
      
      {/* MOBILE VIEW */}
      <div className="lg:hidden w-full max-w-xl mx-auto bg-white border border-zinc-150 p-6 sm:p-8 rounded-3xl shadow-sm min-h-[500px] flex flex-col justify-between transition-all duration-300">
        {profileSubView === "main" && (
          <div className="space-y-6 flex-1 flex flex-col">
            <div className="flex items-center gap-3">
              <h2 className="text-xl sm:text-2xl font-black text-zinc-955 tracking-tight">My Profile</h2>
            </div>

            <div className="flex items-center gap-4 border-b border-zinc-150 pb-6 text-left">
              <div className="w-20 h-20 rounded-full bg-zinc-200 overflow-hidden relative shadow-inner shrink-0 border-2 border-zinc-100">
                <img
                  src={avatarPreview || profileResponse?.data?.profileImage || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80"}
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
                { label: "Edit Profile", desc: "Manage phone, country, and DOB", icon: <User className="w-6 h-6 text-zinc-500" />, key: "edit" },
                { label: "Account Settings", desc: "Change password, terms, and about", icon: <Settings className="w-6 h-6 text-zinc-500" />, key: "settings" },
                { label: "Payment Settings", desc: "Review registered Stripe payout details", icon: <CreditCard className="w-6 h-6 text-zinc-500" />, key: "payment" },
                { label: "My clients", desc: "Manage your Clients", icon: <Users className="w-6 h-6 text-zinc-500" />, key: "clients" },
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
          </div>
        )}

        {profileSubView === "edit" && (
          <div className="space-y-6 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 border-b border-zinc-150 pb-4 mb-4">
                <button onClick={() => setProfileSubView("main")} className="text-zinc-400 hover:text-zinc-650 font-bold text-xs">
                  ← Back
                </button>
                <h3 className="text-base font-black text-zinc-955">Edit Profile</h3>
              </div>

              <div className="flex items-center gap-4 pb-2 text-left">
                <div className="relative w-20 h-20 rounded-full bg-zinc-200 overflow-hidden shadow-inner border-2 border-zinc-100 shrink-0">
                  <img
                    src={avatarPreview || profileResponse?.data?.profileImage || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80"}
                    alt="Profile Preview"
                    className="w-full h-full object-cover"
                  />
                  <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 cursor-pointer transition-opacity">
                    <span className="text-white text-[10px] font-black uppercase tracking-wider">Change</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setProfileImageFile(file);
                          setAvatarPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                </div>
                <div>
                  <h4 className="text-sm font-black text-zinc-955">Profile Picture</h4>
                  <p className="text-[10px] font-semibold text-zinc-400 mt-0.5 leading-relaxed">
                    Click the image to upload a new one.<br/>JPG, PNG or WEBP format.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-left">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    value={profName}
                    onChange={(e) => setProfName(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl border border-zinc-200 bg-zinc-50/50 outline-none text-xs font-bold text-zinc-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">Email Address</label>
                  <input type="email" readOnly value={profileResponse?.data?.email || ""} className="w-full px-4 py-3.5 rounded-2xl border border-zinc-200 bg-zinc-100 text-zinc-400 outline-none text-xs font-bold cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">Date of Birth</label>
                  <input
                    type="text"
                    value={profDob}
                    onChange={(e) => setProfDob(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl border border-zinc-200 bg-zinc-50/50 outline-none text-xs font-bold text-zinc-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">Phone number</label>
                  <input
                    type="text"
                    value={profPhone}
                    onChange={(e) => setProfPhone(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl border border-zinc-200 bg-zinc-50/50 outline-none text-xs font-bold text-zinc-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">Country</label>
                  <input
                    type="text"
                    value={profCountry}
                    onChange={(e) => setProfCountry(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl border border-zinc-200 bg-zinc-50/50 outline-none text-xs font-bold text-zinc-800"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={isUpdatingProfile}
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-2xl font-bold shadow-md text-xs flex items-center justify-center gap-2 cursor-pointer w-fit mt-6"
            >
              {isUpdatingProfile ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}

        {profileSubView === "settings" && (
          <div className="space-y-6 flex-1 flex flex-col justify-between">
            <AccountSettingsView onNavigate={(view) => setProfileSubView(view as any)} />

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-4 border-2 border-red-50 hover:bg-red-50 text-red-500 rounded-2xl font-bold transition-all text-xs text-center cursor-pointer mt-6"
            >
              Delete Account
            </button>
          </div>
        )}

        {profileSubView === "password" && (
          <div className="space-y-6 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 border-b border-zinc-150 pb-4 mb-4">
                <button onClick={() => setProfileSubView("settings")} className="text-zinc-400 hover:text-zinc-650 font-bold text-xs">
                  ← Back
                </button>
                <h3 className="text-base font-black text-zinc-955">Change Password</h3>
              </div>

              <div className="space-y-4 text-left">
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
                      placeholder="••••••••"
                      className="w-full px-4 py-3.5 pr-10 rounded-xl border border-zinc-200 outline-none text-xs font-bold text-zinc-800"
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
                      placeholder="••••••••"
                      className="w-full px-4 py-3.5 pr-10 rounded-xl border border-zinc-200 outline-none text-xs font-bold text-zinc-800"
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
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-450 text-white rounded-2xl font-bold shadow-md text-xs mt-6 cursor-pointer"
            >
              {isChangingPassword ? "Updating..." : "Update Password"}
            </button>
          </div>
        )}

        {profileSubView === "payment" && (
          <div className="space-y-6 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 border-b border-zinc-150 pb-4 mb-4">
                <button onClick={() => setProfileSubView("main")} className="text-zinc-400 hover:text-zinc-650 font-bold text-xs">
                  ← Back
                </button>
                <h3 className="text-base font-black text-zinc-955">Payout & Billing Settings</h3>
              </div>

              {profileResponse?.data?.isStripeConnected ? (
                <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-8 max-w-sm w-full flex flex-col items-center text-center shadow-sm mx-auto">
                  <div className="w-20 h-20 flex items-center justify-center mb-6">
                    <svg className="w-full h-full text-emerald-500 drop-shadow-sm" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.7l-3.61.81.34 3.68L1 12l2.44 2.79-.34 3.69 3.61.82 1.89 3.2L12 21.04l3.4 1.46 1.89-3.2 3.61-.82-.34-3.69L23 12zm-13 5l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                    </svg>
                  </div>
                  <h4 className="text-base font-black text-zinc-900 mb-2">Stripe Account Verified</h4>
                  <p className="text-xs text-zinc-400 font-semibold leading-relaxed mb-6">
                    Your account is successfully linked with Stripe. You can now manage your payouts and transactions.
                  </p>
                  <button disabled className="w-full py-3.5 bg-emerald-600 text-white rounded-2xl font-bold text-xs shadow-sm cursor-not-allowed">
                    Already Added
                  </button>
                </div>
              ) : (
                <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-8 max-w-sm w-full flex flex-col items-center text-center shadow-sm mx-auto">
                  <div className="w-20 h-20 flex items-center justify-center mb-6 rounded-full bg-amber-50 text-amber-500">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h4 className="text-base font-black text-zinc-900 mb-2">Stripe Connection Pending</h4>
                  <p className="text-xs text-zinc-400 font-semibold leading-relaxed mb-6">
                    Link your Stripe account to start receiving payouts and managing transactions.
                  </p>
                  <button 
                    onClick={handleConnectStripe}
                    disabled={isConnectingStripe}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-450 text-white rounded-2xl font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isConnectingStripe && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    Connect Stripe
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {profileSubView === "faq" && (
          <div className="space-y-6 flex-1 flex flex-col justify-between text-left animate-fadeIn">
            <div>
              <div className="flex items-center gap-3 border-b border-zinc-150 pb-4 mb-4">
                <button onClick={() => setProfileSubView("settings")} className="text-zinc-400 hover:text-zinc-650 font-bold text-xs">
                  ← Back
                </button>
                <h3 className="text-base font-black text-zinc-950 font-sans">FAQ</h3>
              </div>
              <FAQView />
            </div>
          </div>
        )}

        {(profileSubView === "terms" || profileSubView === "privacy" || profileSubView === "about") && (
          <div className="space-y-6 flex-1 flex flex-col justify-between text-left">
            <div>
              <div className="flex items-center gap-3 border-b border-zinc-150 pb-4 mb-4">
                <button onClick={() => setProfileSubView("settings")} className="text-zinc-400 hover:text-zinc-650 font-bold text-xs">
                  ← Back
                </button>
                <h3 className="text-base font-black text-zinc-950 capitalize">
                  {profileSubView === "terms" ? "Terms of Services" : profileSubView === "privacy" ? "Privacy Policy" : "About Us"}
                </h3>
              </div>
              <div className="mt-4 w-full text-left">
                {profileSubView === "terms" && <TermsView />}
                {profileSubView === "privacy" && <PrivacyView />}
                {profileSubView === "about" && <AboutView />}
              </div>
            </div>
          </div>
        )}

        {profileSubView === "clients" && renderClientsView(true)}
      </div>

      {/* DESKTOP VIEW */}
      <div className="hidden lg:grid lg:grid-cols-12 lg:gap-8 lg:h-full lg:items-stretch w-full">
        {/* Profile Navigation Left Sidebar */}
        <div className="lg:col-span-4 bg-white border border-zinc-150 p-6 rounded-3xl shadow-sm flex flex-col justify-between h-full text-left">
          <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-zinc-150 pb-6 text-left">
              <div className="w-16 h-16 rounded-full bg-zinc-200 overflow-hidden relative shadow-inner shrink-0 border-2 border-zinc-100">
                <img
                  src={avatarPreview || profileResponse?.data?.profileImage || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80"}
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
                { label: "Edit Profile", key: "edit", icon: <User className="w-5 h-5" />, desc: "Manage phone, country, and DOB" },
                { label: "Account Settings", key: "settings", icon: <Settings className="w-5 h-5" />, desc: "Change password, terms, and about" },
                { label: "Payment Settings", key: "payment", icon: <CreditCard className="w-5 h-5" />, desc: "Manage your Stripe payouts" },
                { label: "My clients", key: "clients", icon: <Users className="w-5 h-5" />, desc: "Manage your Clients" },
              ].map((item) => {
                const isActive = profileSubView === item.key || 
                                (profileSubView === "main" && item.key === "edit") || 
                                (item.key === "settings" && ["password", "terms", "privacy", "about", "faq"].includes(profileSubView));
                return (
                  <button
                    key={item.key}
                    onClick={() => setProfileSubView(item.key as any)}
                    className={`w-full p-3.5 rounded-2xl text-left transition-all border flex items-center justify-between group ${
                      isActive
                        ? "bg-blue-600 text-white border-blue-600 shadow-md"
                        : "bg-white border-zinc-150 text-zinc-655 hover:border-blue-400 hover:text-zinc-900"
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

        {/* Profile Content Right Panel */}
        <div className="lg:col-span-8 bg-white border border-zinc-150 p-8 rounded-3xl shadow-sm flex flex-col justify-between overflow-y-auto h-full min-h-[550px]">
          {(profileSubView === "main" || profileSubView === "edit") && (
            <div className="space-y-6 flex-1 flex flex-col justify-between text-left">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-zinc-900 tracking-tight">Edit Profile Information</h3>
                  <p className="text-xs text-zinc-400 font-semibold mt-0.5">Update your basic information and contact details.</p>
                </div>

                <div className="flex items-center gap-4 pb-2 text-left mt-4">
                  <div className="relative w-20 h-20 rounded-full bg-zinc-200 overflow-hidden shadow-inner border-2 border-zinc-100 shrink-0">
                    <img
                      src={avatarPreview || profileResponse?.data?.profileImage || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80"}
                      alt="Profile Preview"
                      className="w-full h-full object-cover"
                    />
                    <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 cursor-pointer transition-opacity">
                      <span className="text-white text-[10px] font-black uppercase tracking-wider">Change</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setProfileImageFile(file);
                            setAvatarPreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-zinc-955">Profile Picture</h4>
                    <p className="text-[10px] font-semibold text-zinc-400 mt-0.5 leading-relaxed">
                      Click the image to upload a new one.<br/>JPG, PNG or WEBP format.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      value={profName}
                      onChange={(e) => setProfName(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl border border-zinc-200 bg-zinc-50/50 outline-none text-xs font-bold text-zinc-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">Email Address</label>
                    <input type="email" readOnly value={profileResponse?.data?.email || ""} className="w-full px-4 py-3.5 rounded-2xl border border-zinc-200 bg-zinc-100 text-zinc-400 outline-none text-xs font-bold cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">Date of Birth</label>
                    <input
                      type="text"
                      value={profDob}
                      onChange={(e) => setProfDob(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl border border-zinc-200 bg-zinc-50/50 outline-none text-xs font-bold text-zinc-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">Phone number</label>
                    <input
                      type="text"
                      value={profPhone}
                      onChange={(e) => setProfPhone(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl border border-zinc-200 bg-zinc-50/50 outline-none text-xs font-bold text-zinc-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">Country</label>
                    <input
                      type="text"
                      value={profCountry}
                      onChange={(e) => setProfCountry(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl border border-zinc-200 bg-zinc-50/50 outline-none text-xs font-bold text-zinc-800"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={isUpdatingProfile}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-455 text-white rounded-2xl font-bold shadow-md text-xs mt-6 cursor-pointer"
              >
                {isUpdatingProfile ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}

          {profileSubView === "settings" && (
            <div className="space-y-6 flex-1 flex flex-col justify-between text-left animate-fadeIn">
              <AccountSettingsView onNavigate={(view) => setProfileSubView(view as any)} />
            </div>
          )}

          {profileSubView === "password" && (
            <div className="space-y-6 flex-1 flex flex-col justify-between text-left animate-fadeIn">
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-zinc-100 pb-3">
                  <button
                    onClick={() => setProfileSubView("settings")}
                    className="text-zinc-455 hover:text-zinc-655 cursor-pointer font-bold text-xs bg-zinc-55 hover:bg-zinc-105 px-3 py-1.5 rounded-xl border border-zinc-155 transition-colors"
                  >
                    ← Back to Settings
                  </button>
                  <h3 className="text-base font-black text-zinc-955">Change Password</h3>
                </div>

                <div className="grid grid-cols-3 gap-5">
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
                  <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-8 max-w-sm w-full flex flex-col items-center text-center shadow-sm">
                    <div className="w-20 h-20 flex items-center justify-center mb-6">
                      <svg className="w-full h-full text-emerald-500 drop-shadow-sm" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.7l-3.61.81.34 3.68L1 12l2.44 2.79-.34 3.69 3.61.82 1.89 3.2L12 21.04l3.4 1.46 1.89-3.2 3.61-.82-.34-3.69L23 12zm-13 5l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                      </svg>
                    </div>
                    <h4 className="text-base font-black text-zinc-900 mb-2">Stripe Account Verified</h4>
                    <p className="text-xs text-zinc-400 font-semibold leading-relaxed mb-6">
                      Your account is successfully linked with Stripe. You can now manage your payouts and transactions.
                    </p>
                    <button disabled className="w-full py-3.5 bg-emerald-600 text-white rounded-2xl font-bold text-xs shadow-sm cursor-not-allowed">
                      Already Added
                    </button>
                  </div>
                ) : (
                  <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-8 max-w-sm w-full flex flex-col items-center text-center shadow-sm">
                    <div className="w-20 h-20 flex items-center justify-center mb-6 rounded-full bg-amber-50 text-amber-500">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <h4 className="text-base font-black text-zinc-900 mb-2">Stripe Connection Pending</h4>
                    <p className="text-xs text-zinc-400 font-semibold leading-relaxed mb-6">
                      Link your Stripe account to start receiving payouts and managing transactions.
                    </p>
                    <button 
                      onClick={handleConnectStripe}
                      disabled={isConnectingStripe}
                      className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-450 text-white rounded-2xl font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isConnectingStripe && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                      Connect Stripe
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {profileSubView === "clients" && (
            <div className="space-y-6 flex-1 flex flex-col justify-between text-left animate-fadeIn">
              {renderClientsView(false)}
            </div>
          )}

          {(profileSubView === "terms" || profileSubView === "privacy" || profileSubView === "about") && (
            <div className="space-y-6 flex-1 flex flex-col justify-between text-left animate-fadeIn">
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-zinc-100 pb-3">
                  <button
                    onClick={() => setProfileSubView("settings")}
                    className="text-zinc-455 hover:text-zinc-655 cursor-pointer font-bold text-xs bg-zinc-55 hover:bg-zinc-105 px-3 py-1.5 rounded-xl border border-zinc-155 transition-colors"
                  >
                    ← Back to Settings
                  </button>
                  <h3 className="text-base font-black text-zinc-955 capitalize">
                    {profileSubView === "terms" ? "Terms of Services" : profileSubView === "privacy" ? "Privacy Policy" : "About Us"}
                  </h3>
                </div>

                <div className="mt-4">
                  {profileSubView === "terms" && <TermsView />}
                  {profileSubView === "privacy" && <PrivacyView />}
                  {profileSubView === "about" && <AboutView />}
                </div>
              </div>
            </div>
          )}

          {profileSubView === "faq" && (
            <div className="space-y-6 flex-1 flex flex-col justify-between text-left animate-fadeIn">
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-zinc-100 pb-3">
                  <button
                    onClick={() => setProfileSubView("settings")}
                    className="text-zinc-455 hover:text-zinc-655 cursor-pointer font-bold text-xs bg-zinc-55 hover:bg-zinc-105 px-3 py-1.5 rounded-xl border border-zinc-155 transition-colors"
                  >
                    ← Back to Settings
                  </button>
                  <h3 className="text-base font-black text-zinc-955">FAQ</h3>
                </div>
                <FAQView />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* WRITE A REVIEW MODAL */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl animate-scaleUp">
            <h3 className="text-lg font-black text-zinc-955">Review {reviewClientName}</h3>
            <p className="text-xs text-zinc-400 mt-1 font-semibold leading-relaxed">
              Share your experience working with this property owner.
            </p>
            
            {/* Rating Stars Selection */}
            <div className="flex justify-center gap-1.5 my-5 text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => {
                const isSelected = i < reviewRating;
                return (
                  <button
                    key={i}
                    onClick={() => setReviewRating(i + 1)}
                    className="hover:scale-115 transition-transform cursor-pointer"
                    aria-label={`Rate ${i + 1} stars`}
                  >
                    {isSelected ? (
                      <svg className="w-8 h-8 fill-current text-amber-500" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ) : (
                      <svg className="w-8 h-8 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.977-2.888a1 1 0 00-1.176 0l-3.977 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Comment Area */}
            <textarea
              rows={3}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Write your review comments here..."
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none text-xs font-bold resize-none mb-6 text-zinc-800"
            />

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setReviewComment("");
                  setReviewRating(5);
                }}
                className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-650 rounded-xl font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={isSubmittingReview}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-450 text-white rounded-xl font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isSubmittingReview && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT CONFIRM MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl animate-scaleUp">
            <div className="w-14 h-14 rounded-full bg-red-50 text-red-650 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-lg font-black text-zinc-950">Delete Account?</h3>
            <p className="text-xs text-zinc-400 mt-2 font-semibold leading-relaxed">
              This action is permanent and cannot be undone. All your listings and chats will be permanently deleted.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-650 rounded-xl font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FAQView() {
  const { data: faqResponse, isLoading: isLoadingFaq } = useGetAllFaqQuery(undefined);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const faqs = React.useMemo(() => {
    const list = Array.isArray(faqResponse?.data?.data)
      ? faqResponse.data.data
      : Array.isArray(faqResponse?.data)
      ? faqResponse.data
      : Array.isArray(faqResponse)
      ? faqResponse
      : [];
    return list;
  }, [faqResponse]);

  const filteredFaqs = React.useMemo(() => {
    if (!debouncedSearchQuery.trim()) return faqs;
    const lowerQuery = debouncedSearchQuery.toLowerCase();
    return faqs.filter((faq: any) =>
      (faq.question || "").toLowerCase().includes(lowerQuery) ||
      (faq.answer || "").toLowerCase().includes(lowerQuery)
    );
  }, [faqs, debouncedSearchQuery]);

  if (isLoadingFaq) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl text-left w-full">
      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search FAQs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-4 pr-10 py-3.5 rounded-2xl border border-zinc-200 outline-none text-xs font-bold bg-zinc-50/50 focus:border-blue-500 transition-colors"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
      </div>

      {filteredFaqs.length === 0 ? (
        <div className="text-center py-12 bg-zinc-50 border border-zinc-150 rounded-3xl p-6">
          <p className="text-xs text-zinc-400 font-bold">No FAQs found matching your criteria.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFaqs.map((faq: any, idx: number) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={faq.id || faq._id || idx}
                className="border border-zinc-150 rounded-2xl bg-white overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left cursor-pointer hover:bg-zinc-50/50 transition-colors"
                >
                  <span className="text-xs font-extrabold text-zinc-955 pr-4 font-sans">{faq.question}</span>
                  <span className={`text-zinc-455 transition-transform duration-300 shrink-0 ${isOpen ? "rotate-180" : ""}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isOpen ? "max-h-[500px] border-t border-zinc-100" : "max-h-0"
                  }`}
                >
                  <div className="px-5 py-4 text-xs text-zinc-500 font-semibold leading-relaxed font-sans" dangerouslySetInnerHTML={{ __html: faq.answer }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
