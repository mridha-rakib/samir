"use client";

import { User, Settings, CreditCard, Bookmark, Home } from "lucide-react";

import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { RootState } from "@/redux/store";
import { useGetMyProfileQuery, useUpdateProfileMutation, useDeleteMyAccountMutation } from "@/redux/api/userApi";
import { useChangePasswordMutation, useGetAirbnbStatusQuery, useDisconnectAirbnbMutation } from "@/redux/api/authApi";
import { useStripeAccountOnboardingMutation } from "@/redux/api/paymentApi";
import { useGetMySavedUsersQuery, useToggleUserFavoriteMutation } from "@/redux/api/favoriteApi";
import { useNotification } from "../../owner/components/PropertyOwnerLayout";
import EditProfileView from "../../components/profile/EditProfileView";
import AccountSettingsView from "../../components/profile/AccountSettingsView";
import FAQView from "../../components/profile/FAQView";
import TermsView from "../../components/profile/TermsView";
import PrivacyView from "../../components/profile/PrivacyView";
import AboutView from "../../components/profile/AboutView";

function ProfileContent() {
  const router = useRouter();
  const { triggerNotification } = useNotification();
  const user = useSelector((state: RootState) => state.auth.user);
  const token = useSelector((state: RootState) => state.auth.token);

  // Fetch user profile dynamically
  const { data: profileResponse } = useGetMyProfileQuery(undefined, { skip: !token });

  const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();
  const [deleteAccount] = useDeleteMyAccountMutation();
  const [stripeAccountOnboarding, { isLoading: isConnectingStripe }] = useStripeAccountOnboardingMutation();

  const isConnected = profileResponse?.data?.isStripeConnected || false;

  const handleConnectStripe = async () => {
    try {
      const res = await stripeAccountOnboarding(undefined).unwrap();
      if (res.success && res.data?.onboardingLink) {
        window.location.href = res.data.onboardingLink;
      } else {
        triggerNotification(res.message || "Failed to create Stripe onboarding link", "error");
      }
    } catch (err: any) {
      triggerNotification(err?.data?.message || "Something went wrong while connecting with Stripe", "error");
    }
  };

  const [profileSubView, setProfileSubView] = useState<"main" | "edit" | "settings" | "password" | "terms" | "privacy" | "about" | "payment" | "saved" | "airbnb" | "faq">("main");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Edit profile fields state
  const [localProfName, setLocalProfName] = useState("");
  const [profDob, setProfDob] = useState("28/11/1997");
  const [profCountry, setProfCountry] = useState("");
  const [profPhone, setProfPhone] = useState("");
  const [profAddress, setProfAddress] = useState("");
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Change password fields state
  const [currPass, setCurrPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confPass, setConfPass] = useState("");
  const [showCurrPass, setShowCurrPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfPass, setShowConfPass] = useState(false);

  // Populate fields dynamically from backend response
  useEffect(() => {
    if (profileResponse?.success && profileResponse?.data) {
      const u = profileResponse.data;
      if (u.fullName) setLocalProfName(u.fullName);
      if (u.country) setProfCountry(u.country);
      if (u.contactNumber) setProfPhone(u.contactNumber);
      if (u.address) setProfAddress(u.address);
    }
  }, [profileResponse]);

  const handleSaveProfile = async () => {
    try {
      const formData = new FormData();
      const bodyData = {
        fullName: localProfName,
        contactNumber: profPhone,
        country: profCountry,
        address: profAddress,
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
        setCurrPass("");
        setNewPass("");
        setConfPass("");
        setProfileSubView("settings");
      } else {
        triggerNotification(response.message || "Failed to update password", "error");
      }
    } catch (err: any) {
      console.error("Change password error:", err);
      triggerNotification(err?.data?.message || err?.message || "Failed to update password", "error");
    }
  };

  function SavedProvidersList() {
    const { data: savedResponse, isLoading: isLoadingSaved, refetch } = useGetMySavedUsersQuery(undefined);
    const [toggleFavorite] = useToggleUserFavoriteMutation();
    const [unsavingId, setUnsavingId] = useState<string | null>(null);

    const savedList = React.useMemo(() => {
      const list = Array.isArray(savedResponse?.data?.data)
        ? savedResponse.data.data
        : Array.isArray(savedResponse?.data)
        ? savedResponse.data
        : Array.isArray(savedResponse)
        ? savedResponse
        : [];
      return list;
    }, [savedResponse]);

    const handleUnsave = async (providerId: string) => {
      if (unsavingId) return;
      setUnsavingId(providerId);
      try {
        await toggleFavorite({ savedUserId: providerId }).unwrap();
        triggerNotification("Removed from saved providers", "success");
        refetch();
      } catch (err) {
        triggerNotification("Failed to unsave provider", "error");
      } finally {
        setUnsavingId(null);
      }
    };

    const formatSavedAt = (createdAtStr?: string) => {
      if (!createdAtStr) return "";
      try {
        const date = new Date(createdAtStr);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
      } catch (e) {
        return createdAtStr;
      }
    };

    if (isLoadingSaved) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    if (savedList.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center border border-dashed border-zinc-200 rounded-3xl bg-zinc-50/50">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <h4 className="text-sm font-black text-zinc-955">No Saved Providers</h4>
          <p className="text-xs text-zinc-400 font-semibold mt-1 max-w-xs leading-relaxed font-sans">
            Browse services and save your favorite providers for quick access later!
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
        {savedList.map((item: any) => {
          const savedUser = item.savedUser;
          if (!savedUser) return null;

          const providerId = savedUser.id || savedUser._id || item.savedUserId;
          const fullName = savedUser.fullName || "N/A";
          const profileImage = savedUser.profileImage || "";
          const address = savedUser.address || "N/A";
          const rating = typeof savedUser.averageServiceRating === 'number' ? savedUser.averageServiceRating : 0;
          const reviews = typeof savedUser.totalReviews === 'number' ? savedUser.totalReviews : 0;
          const serviceType = Array.isArray(savedUser.services) ? savedUser.services.join(", ") : "N/A";
          const savedAt = formatSavedAt(item.createdAt);

          return (
            <div key={item._id || item.id} className="bg-white border border-zinc-150 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
              {/* Upper section */}
              <div className="flex gap-4 items-start">
                {/* Avatar */}
                <div className="w-14 h-14 rounded-full overflow-hidden relative shadow-inner shrink-0 border-2 border-zinc-100 flex items-center justify-center bg-zinc-200">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt={fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white text-lg font-black uppercase">
                      {fullName ? fullName[0] : "?"}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-black text-zinc-955 truncate leading-tight">{fullName}</h4>
                    {/* Bookmark Icon */}
                    <button
                      onClick={() => handleUnsave(providerId)}
                      disabled={unsavingId === providerId}
                      className={`p-1.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors shrink-0 cursor-pointer ${
                        unsavingId === providerId ? "opacity-75 cursor-not-allowed" : ""
                      }`}
                      title="Remove Bookmark"
                    >
                      {unsavingId === providerId ? (
                        <svg className="w-4 h-4 animate-spin text-zinc-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Service type badge */}
                  <div className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-50 text-[10px] font-black text-blue-600 uppercase tracking-wide">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>{serviceType}</span>
                  </div>

                  {/* Location & Rating row */}
                  <div className="mt-2.5 flex items-center justify-between text-xs font-semibold gap-2">
                    <div className="flex items-center gap-1 min-w-0">
                      <svg className="w-3.5 h-3.5 text-zinc-450 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="truncate text-zinc-500 font-sans">{address}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg px-2 py-0.5">
                      <span>⭐</span>
                      <span className="font-extrabold text-[11px]">{rating.toFixed(1)}</span>
                      <span className="text-[10px] text-emerald-500/80 font-bold">({reviews})</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => router.push(`/dashboard/propertyowner/services?providerId=${providerId}`)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 border border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors text-xs font-black cursor-pointer font-sans"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Book Service
                </button>
                <button
                  onClick={() => router.push(`/dashboard/propertyowner/chat?role=property%20owner&providerId=${providerId}`)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 border border-zinc-200 text-zinc-700 rounded-xl hover:bg-zinc-50 transition-colors text-xs font-black cursor-pointer font-sans"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Message
                </button>
              </div>

              {/* Footer */}
              <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-100 rounded-xl px-3 py-2 text-[10px] text-zinc-400 font-bold">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-sans">Saved on {savedAt}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function ConnectAirbnbView() {
    const { data: airbnbStatusRes, isLoading: isLoadingStatus } = useGetAirbnbStatusQuery(undefined);
    const [disconnectAirbnb, { isLoading: isDisconnecting }] = useDisconnectAirbnbMutation();

    const isConnected = airbnbStatusRes?.data?.isConnected || false;

    const handleConnect = () => {
      const baseUrl = process.env.NEXT_PUBLIC_URL || "https://api.hostibook.com/api/v1";
      const userId = profileResponse?.data?.id || user?.id || "";
      window.location.href = `${baseUrl}/auth/airbnb/connect?userId=${userId}`;
    };

    const handleDisconnect = async () => {
      try {
        const res = await disconnectAirbnb(undefined).unwrap();
        if (res.success) {
          triggerNotification("Airbnb account disconnected successfully!", "success");
        } else {
          triggerNotification(res.message || "Failed to disconnect Airbnb", "error");
        }
      } catch (err: any) {
        triggerNotification(err?.data?.message || "Failed to disconnect Airbnb", "error");
      }
    };

    if (isLoadingStatus) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    return (
      <div className="max-w-md mx-auto lg:mx-0 bg-white border border-zinc-150 rounded-3xl p-6 shadow-sm space-y-6 text-center">
        <div className="flex justify-center mt-4">
          <div className="w-24 h-24 rounded-full flex items-center justify-center bg-zinc-50 border border-zinc-200 shadow-inner overflow-hidden relative">
            {isConnected ? (
              // Green Verified Badge
              <svg className="w-16 h-16 text-emerald-500 fill-none animate-scaleIn" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              // Airbnb Icon
              <svg className="w-16 h-16 text-[#FF5A5F] fill-current animate-pulse" viewBox="0 0 24 24">
                <path d="M12 2C11.5 2 11 2.2 10.6 2.6L2.6 10.6C1.8 11.4 1.8 12.6 2.6 13.4C3.4 14.2 4.6 14.2 5.4 13.4L12 6.8L18.6 13.4C19.4 14.2 20.6 14.2 21.4 13.4C22.2 12.6 22.2 11.4 21.4 10.6L13.4 2.6C13 2.2 12.5 2 12 2Z" />
                <path d="M12 8C10.9 8 10 8.9 10 10C10 10.6 10.2 11.1 10.6 11.4C10.7 11.5 10.9 11.7 11 11.8L12 12.8L13 11.8C13.1 11.7 13.3 11.5 13.4 11.4C13.8 11.1 14 10.6 14 10C14 8.9 13.1 8 12 8Z" />
                <path d="M12 14.2C9.5 14.2 7.5 16.2 7.5 18.7C7.5 20.4 8.5 21.8 10 22.5L12 20.5L14 22.5C15.5 21.8 16.5 20.4 16.5 18.7C16.5 16.2 14.5 14.2 12 14.2Z" />
              </svg>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-lg font-black text-zinc-955 font-sans">
            {isConnected ? "Airbnb Account Linked" : "Connect Airbnb Account"}
          </h4>
          <p className="text-xs text-zinc-400 font-semibold leading-relaxed max-w-sm font-sans">
            {isConnected
              ? "Your Airbnb account is successfully connected. Guest reviews will now sync automatically."
              : "Connect your Airbnb account to seamlessly sync and share great guest reviews directly to your property listings."}
          </p>
        </div>

        <button
          onClick={isConnected ? handleDisconnect : handleConnect}
          disabled={isDisconnecting}
          className={`w-full py-4 rounded-2xl font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2 font-sans ${
            isConnected
              ? "bg-red-600 hover:bg-red-700 text-white shadow-red-500/10"
              : "bg-[#FF5A5F] hover:bg-[#FF5A5F]/90 text-white shadow-[#FF5A5F]/10"
          }`}
        >
          {isDisconnecting ? (
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : isConnected ? (
            "Disconnect"
          ) : (
            "Connect"
          )}
        </button>

        <div className="flex flex-col items-center gap-2 pt-4 border-t border-zinc-100">
          <svg className="w-5 h-5 text-zinc-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p className="text-[10px] text-zinc-400 font-semibold leading-relaxed font-sans max-w-xs">
            Your connection is secured via standard OAuth protocols. We do not store your Airbnb password.
          </p>
        </div>
      </div>
    );
  }



  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8 lg:p-10 pb-24 md:pb-8 flex flex-col overflow-y-auto lg:overflow-hidden lg:h-full">
      
      {/* MOBILE VIEW */}
      <div className="lg:hidden w-full max-w-xl mx-auto bg-white border border-zinc-150 p-6 sm:p-8 rounded-3xl shadow-sm min-h-[500px] flex flex-col justify-between transition-all duration-300">
        {profileSubView === "main" && (
          <div className="space-y-6 flex-1 flex flex-col">
            <div className="flex items-center gap-3 text-left">
              <h2 className="text-xl sm:text-2xl font-black text-zinc-955 tracking-tight">My Profile</h2>
            </div>
            <div className="flex items-center gap-4 border-b border-zinc-150 pb-6 text-left">
              <div className="w-20 h-20 rounded-full bg-zinc-200 overflow-hidden relative shadow-inner shrink-0 border-2 border-zinc-100">
                <img
                  src={profileResponse?.data?.profileImage || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80"}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-black text-zinc-955">{localProfName || profileResponse?.data?.fullName || user?.fullName || "Guest User"}</h3>
                <p className="text-xs font-bold text-zinc-400 mt-0.5 leading-none">Property Owner</p>
              </div>
            </div>

            <div className="space-y-3.5 flex-1 pt-2">
              {[
                { label: "Edit Profile", desc: "Manage phone, country, and dob", icon: <User className="w-6 h-6 text-zinc-500" />, key: "edit" },
                { label: "Account Settings", desc: "Change password, terms, and about", icon: <Settings className="w-6 h-6 text-zinc-500" />, key: "settings" },
                { label: "Payment Settings", desc: "Review registered Stripe payment card", icon: <CreditCard className="w-6 h-6 text-zinc-500" />, key: "payment" },
                { label: "Saved Providers", desc: "View your saved service providers", icon: <Bookmark className="w-6 h-6 text-zinc-500" />, key: "saved" },
                { label: "Connect Airbnb", desc: "Sync reviews with your Airbnb listings", icon: <Home className="w-6 h-6 text-zinc-500" />, key: "airbnb" },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                    setProfileSubView(item.key as any);
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
                  <span className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">→</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {profileSubView === "edit" && (
          <EditProfileView onBack={() => setProfileSubView("main")} triggerNotification={triggerNotification} />
        )}

        {profileSubView === "settings" && (
          <AccountSettingsView onNavigate={(view) => setProfileSubView(view as any)} />
        )}

        {profileSubView === "password" && (
          <div className="space-y-6 flex-1 flex flex-col justify-between text-left">
            <div>
              <div className="flex items-center gap-3 border-b border-zinc-150 pb-4 mb-4">
                <button onClick={() => setProfileSubView("settings")} className="text-zinc-400 hover:text-zinc-650 cursor-pointer font-bold text-lg">←</button>
                <h3 className="text-base font-black text-zinc-950">Change Password</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">Current Password</label>
                  <div className="relative">
                    <input type={showCurrPass ? "text" : "password"} value={currPass} onChange={(e) => setCurrPass(e.target.value)} placeholder="••••••" className="w-full px-4 py-3 pr-10 rounded-xl border border-zinc-200 bg-zinc-50/50 outline-none text-xs font-bold text-zinc-800" />
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
                    <input type={showNewPass ? "text" : "password"} value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="••••••" className="w-full px-4 py-3 pr-10 rounded-xl border border-zinc-200 bg-zinc-50/50 outline-none text-xs font-bold text-zinc-800" />
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
                    <input type={showConfPass ? "text" : "password"} value={confPass} onChange={(e) => setConfPass(e.target.value)} placeholder="••••••" className="w-full px-4 py-3 pr-10 rounded-xl border border-zinc-200 bg-zinc-50/50 outline-none text-xs font-bold text-zinc-800" />
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
            <button onClick={handleChangePassword} disabled={isChangingPassword} className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-2xl font-bold shadow-md text-sm mt-6 flex items-center justify-center gap-2 cursor-pointer">
              {isChangingPassword ? "Updating..." : "Update Password"}
            </button>
          </div>
        )}

        {profileSubView === "payment" && (
          <div className="space-y-6 flex-1 flex flex-col justify-between text-left">
            <div>
              <div className="flex items-center gap-3 border-b border-zinc-150 pb-4 mb-6">
                <button onClick={() => setProfileSubView("main")} className="text-zinc-400 hover:text-zinc-650 cursor-pointer font-bold text-lg">←</button>
                <h3 className="text-base font-black text-zinc-955">Payment Settings</h3>
              </div>
              
              <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-6 flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 rounded-full flex items-center justify-center bg-blue-50 text-blue-600 font-bold border border-blue-150 shadow-inner shrink-0">
                  {isConnected ? (
                    <svg className="w-12 h-12 text-emerald-500 fill-none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-12 h-12 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
                    </svg>
                  )}
                </div>

                <h4 className="text-base font-black text-zinc-950">
                  {isConnected ? "Stripe Account Connected" : "Connect Your Stripe Account"}
                </h4>

                <p className="text-xs text-zinc-500 font-semibold leading-relaxed max-w-xs">
                  {isConnected
                    ? "Your account is successfully linked with Stripe. You can now receive payouts and manage your transaction details."
                    : "This is Stripe onboarding. To receive payouts from guests and manage your property earnings, you need to connect your account with Stripe."}
                </p>

                <button
                  onClick={handleConnectStripe}
                  disabled={isConnected || isConnectingStripe}
                  className={`w-full py-3.5 rounded-2xl font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                    isConnected
                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/10 cursor-default"
                      : isConnectingStripe
                      ? "bg-blue-300 text-white cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/10"
                  }`}
                >
                  {isConnected ? (
                    <>
                      <span>✓ Verified & Connected</span>
                    </>
                  ) : isConnectingStripe ? (
                    "Connecting..."
                  ) : (
                    "Connect with Stripe"
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 pt-6">
              <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-[10px] text-zinc-400 font-semibold text-center leading-relaxed">
                All payments are processed securely via Stripe. Hostibook never stores your banking credentials.
              </p>
            </div>
          </div>
        )}

        {profileSubView === "saved" && (
          <div className="space-y-6 flex-1 flex flex-col justify-between text-left">
            <div>
              <div className="flex items-center gap-3 border-b border-zinc-150 pb-4 mb-4">
                <button onClick={() => setProfileSubView("main")} className="text-zinc-400 hover:text-zinc-650 cursor-pointer font-bold text-lg">←</button>
                <h3 className="text-base font-black text-zinc-955">Saved Providers</h3>
              </div>
              <SavedProvidersList />
            </div>
          </div>
        )}

        {profileSubView === "airbnb" && (
          <div className="space-y-6 flex-1 flex flex-col justify-between text-left">
            <div>
              <div className="flex items-center gap-3 border-b border-zinc-150 pb-4 mb-4">
                <button onClick={() => setProfileSubView("main")} className="text-zinc-400 hover:text-zinc-655 cursor-pointer font-bold text-lg">←</button>
                <h3 className="text-base font-black text-zinc-955">Connect Airbnb</h3>
              </div>
              <ConnectAirbnbView />
            </div>
          </div>
        )}

        {profileSubView === "faq" && (
          <div className="space-y-6 flex-1 flex flex-col justify-between text-left">
            <div>
              <div className="flex items-center gap-3 border-b border-zinc-150 pb-4 mb-4">
                <button onClick={() => setProfileSubView("settings")} className="text-zinc-400 hover:text-zinc-655 cursor-pointer font-bold text-lg">←</button>
                <h3 className="text-base font-black text-zinc-955 font-sans">FAQ</h3>
              </div>
              <FAQView />
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
                  src={profileResponse?.data?.profileImage || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80"}
                  alt="Profile" className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-base font-black text-zinc-950">{localProfName || profileResponse?.data?.fullName || user?.fullName}</h3>
                <p className="text-[11px] font-bold text-zinc-400 mt-0.5 leading-none">Property Owner</p>
                <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[8px] font-extrabold tracking-wide uppercase leading-none">Premium • Active</span>
              </div>
            </div>

            <nav className="space-y-2.5">
              {[
                { label: "Edit Profile", key: "edit", icon: <User className="w-5 h-5" />, desc: "Manage phone, country, and DOB" },
                { label: "Saved Providers", key: "saved", icon: <Bookmark className="w-5 h-5" />, desc: "Browse your saved service providers" },
                { label: "Connect Airbnb", key: "airbnb", icon: <Home className="w-5 h-5" />, desc: "Sync reviews with your Airbnb listings" },
                { label: "Payment Settings", key: "payment", icon: <CreditCard className="w-5 h-5" />, desc: "Manage your Stripe subscription" },
                { label: "Account Settings", key: "settings", icon: <Settings className="w-5 h-5" />, desc: "Change password, terms, privacy, FAQ, etc." },
              ].map((item) => {
                const isActive = 
                  profileSubView === item.key || 
                  (profileSubView === "main" && item.key === "edit") ||
                  (item.key === "settings" && ["settings", "password", "terms", "privacy", "about", "faq"].includes(profileSubView));
                return (
                  <button
                    key={item.key} onClick={() => {
                      setProfileSubView(item.key as any);
                    }}
                    className={`w-full p-3.5 rounded-2xl text-left transition-all border flex items-center justify-between group cursor-pointer ${
                      isActive
                        ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/10"
                        : "bg-white border-zinc-150 text-zinc-655 hover:border-blue-400 hover:text-zinc-950"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg shrink-0">{item.icon}</span>
                      <div>
                        <h4 className="text-xs font-bold leading-tight">{item.label}</h4>
                        <p className={`text-[9px] font-semibold mt-0.5 leading-none ${isActive ? "text-blue-100" : "text-zinc-400 group-hover:text-zinc-505"}`}>{item.desc}</p>
                      </div>
                    </div>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${isActive ? "bg-white/20 text-white" : "bg-blue-50 text-blue-600"}`}>→</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Right side details content */}
        <div className="lg:col-span-8 bg-white border border-zinc-150 p-6 rounded-3xl shadow-sm flex flex-col justify-between h-full text-left overflow-y-auto">
          {(profileSubView === "main" || profileSubView === "edit") && (
            <EditProfileView onBack={() => setProfileSubView("main")} triggerNotification={triggerNotification} />
          )}

          {profileSubView === "settings" && (
            <AccountSettingsView onNavigate={(view) => setProfileSubView(view as any)} />
          )}

          {profileSubView === "password" && (
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
              <div className="max-w-md space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">Current Password</label>
                  <div className="relative">
                    <input type={showCurrPass ? "text" : "password"} value={currPass} onChange={(e) => setCurrPass(e.target.value)} placeholder="••••••" className="w-full px-4 py-3.5 pr-10 rounded-2xl border border-zinc-200 bg-zinc-50/50 outline-none text-xs font-bold text-zinc-800" />
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
                  <label className="block text-[10px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">New Password</label>
                  <div className="relative">
                    <input type={showNewPass ? "text" : "password"} value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="••••••" className="w-full px-4 py-3.5 pr-10 rounded-2xl border border-zinc-200 bg-zinc-50/50 outline-none text-xs font-bold text-zinc-800" />
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
                  <label className="block text-[10px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">Confirm Password</label>
                  <div className="relative">
                    <input type={showConfPass ? "text" : "password"} value={confPass} onChange={(e) => setConfPass(e.target.value)} placeholder="••••••" className="w-full px-4 py-3.5 pr-10 rounded-2xl border border-zinc-200 bg-zinc-50/50 outline-none text-xs font-bold text-zinc-800" />
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
              <button onClick={handleChangePassword} disabled={isChangingPassword} className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-2xl font-bold shadow-md text-xs flex items-center justify-center gap-2 cursor-pointer w-fit">
                {isChangingPassword ? "Updating..." : "Update Password"}
              </button>
            </div>
          )}

          {profileSubView === "terms" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-zinc-100 pb-3">
                <button
                  onClick={() => setProfileSubView("settings")}
                  className="text-zinc-455 hover:text-zinc-655 cursor-pointer font-bold text-xs bg-zinc-55 hover:bg-zinc-105 px-3 py-1.5 rounded-xl border border-zinc-155 transition-colors"
                >
                  ← Back to Settings
                </button>
                <h3 className="text-base font-black text-zinc-955">Terms of services</h3>
              </div>
              <div className="mt-4">
                <TermsView />
              </div>
            </div>
          )}

          {profileSubView === "privacy" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-zinc-100 pb-3">
                <button
                  onClick={() => setProfileSubView("settings")}
                  className="text-zinc-455 hover:text-zinc-655 cursor-pointer font-bold text-xs bg-zinc-55 hover:bg-zinc-105 px-3 py-1.5 rounded-xl border border-zinc-155 transition-colors"
                >
                  ← Back to Settings
                </button>
                <h3 className="text-base font-black text-zinc-955">Privacy Policy</h3>
              </div>
              <div className="mt-4">
                <PrivacyView />
              </div>
            </div>
          )}

          {profileSubView === "about" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-zinc-100 pb-3">
                <button
                  onClick={() => setProfileSubView("settings")}
                  className="text-zinc-455 hover:text-zinc-655 cursor-pointer font-bold text-xs bg-zinc-55 hover:bg-zinc-105 px-3 py-1.5 rounded-xl border border-zinc-155 transition-colors"
                >
                  ← Back to Settings
                </button>
                <h3 className="text-base font-black text-zinc-955">About Us</h3>
              </div>
              <div className="mt-4">
                <AboutView />
              </div>
            </div>
          )}

          {profileSubView === "payment" && (
            <div className="space-y-6">
              <h3 className="text-base font-black text-zinc-955 border-b border-zinc-100 pb-3">Payment Settings</h3>
              
              <div className="max-w-md bg-zinc-50 border border-zinc-200 rounded-3xl p-8 flex flex-col items-center text-center space-y-5">
                <div className="w-24 h-24 rounded-full flex items-center justify-center bg-blue-50 text-blue-600 font-bold border border-blue-150 shadow-inner shrink-0">
                  {isConnected ? (
                    <svg className="w-14 h-14 text-emerald-500 fill-none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-14 h-14 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
                    </svg>
                  )}
                </div>

                <h4 className="text-lg font-black text-zinc-955">
                  {isConnected ? "Stripe Account Verified" : "Connect Your Stripe Account"}
                </h4>

                <p className="text-xs text-zinc-500 font-semibold leading-relaxed max-w-sm">
                  {isConnected
                    ? "Your account is successfully linked with Stripe. You can now receive payouts and manage your transaction details."
                    : "This is Stripe onboarding. To receive payouts from guests and manage your property earnings, you need to connect your account with Stripe."}
                </p>

                <button
                  onClick={handleConnectStripe}
                  disabled={isConnected || isConnectingStripe}
                  className={`w-full py-4 rounded-2xl font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                    isConnected
                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/10 cursor-default"
                      : isConnectingStripe
                      ? "bg-blue-300 text-white cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/10"
                  }`}
                >
                  {isConnected ? (
                    <>
                      <span>✓ Account Connected</span>
                    </>
                  ) : isConnectingStripe ? (
                    "Connecting..."
                  ) : (
                    "Connect with Stripe"
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2 pt-6 max-w-md">
                <svg className="w-5 h-5 text-zinc-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-[10px] text-zinc-400 font-semibold leading-relaxed">
                  All payments are processed securely via Stripe. Hostibook never stores your banking credentials.
                </p>
              </div>
            </div>
          )}

          {profileSubView === "saved" && (
            <div className="space-y-6">
              <h3 className="text-base font-black text-zinc-955 border-b border-zinc-100 pb-3 font-sans">Saved Providers</h3>
              <SavedProvidersList />
            </div>
          )}

          {profileSubView === "airbnb" && (
            <div className="space-y-6">
              <h3 className="text-base font-black text-zinc-955 border-b border-zinc-100 pb-3 font-sans">Connect Airbnb</h3>
              <ConnectAirbnbView />
            </div>
          )}

          {profileSubView === "faq" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-zinc-100 pb-3">
                <button
                  onClick={() => setProfileSubView("settings")}
                  className="text-zinc-455 hover:text-zinc-655 cursor-pointer font-bold text-xs bg-zinc-55 hover:bg-zinc-105 px-3 py-1.5 rounded-xl border border-zinc-155 transition-colors"
                >
                  ← Back to Settings
                </button>
                <h3 className="text-base font-black text-zinc-955 font-sans">FAQ</h3>
              </div>
              <FAQView />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return <ProfileContent />;
}
