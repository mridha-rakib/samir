"use client";

import { User, CalendarDays, Heart, Settings, CreditCard } from "lucide-react";

import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { RootState } from "@/redux/store";
import { logout } from "@/redux/features/authSlice";
import { performLogout } from "@/lib/logoutCleanup";
import { useNotification } from "../layout";
import { useGetMyProfileQuery, useUpdateProfileMutation, useDeleteMyAccountMutation } from "@/redux/api/userApi";
import { useChangePasswordMutation } from "@/redux/api/authApi";
import EditProfileView from "../../components/profile/EditProfileView";
import AccountSettingsView from "../../components/profile/AccountSettingsView";
import FAQView from "../../components/profile/FAQView";
import TermsView from "../../components/profile/TermsView";
import PrivacyView from "../../components/profile/PrivacyView";
import AboutView from "../../components/profile/AboutView";

export default function GuestProfilePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { triggerNotification } = useNotification();
  const token = useSelector((state: RootState) => state.auth.token);

  const { data: profileResponse } = useGetMyProfileQuery(undefined, { skip: !token });


  const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();
  const [deleteAccount] = useDeleteMyAccountMutation();

  const [profName, setProfName] = useState("Guest User");
  const [profPhone, setProfPhone] = useState("");
  const [profCountry, setProfCountry] = useState("Bangladesh");
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [currPass, setCurrPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confPass, setConfPass] = useState("");
  const [showCurrPass, setShowCurrPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfPass, setShowConfPass] = useState(false);

  const [profileSubView, setProfileSubView] = useState<"main" | "edit" | "settings" | "password" | "terms" | "privacy" | "about" | "payment" | "faq">("main");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (profileResponse?.success && profileResponse?.data) {
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

      const response = await updateProfile(formData).unwrap();
      if (response.success) {
        triggerNotification("Profile details saved successfully!");
        setProfileSubView("main");
      } else {
        triggerNotification(response.message || "Failed to update profile", "error");
      }
    } catch (err: any) {
      console.error(err);
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
      console.error(err);
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
      console.error(err);
      triggerNotification(err?.data?.message || err?.message || "Failed to delete account", "error");
    }
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8 lg:p-10 pb-24 md:pb-8 flex flex-col overflow-y-auto lg:overflow-hidden lg:h-full">
      {/* MOBILE VIEW PROFILE */}
      <div className="lg:hidden w-full max-w-xl mx-auto bg-white border border-zinc-150 p-6 sm:p-8 rounded-3xl shadow-sm min-h-[500px] flex flex-col justify-between transition-all duration-300">
        {profileSubView === "main" && (
          <div className="space-y-6 flex-1 flex flex-col text-left animate-fadeIn">
            <h2 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight">My Profile</h2>

            <div className="flex items-center gap-4 border-b border-zinc-150 pb-6">
              <div className="w-20 h-20 rounded-full bg-zinc-200 overflow-hidden relative shadow-inner shrink-0 border-2 border-zinc-100">
                <img
                  src={profileResponse?.data?.profileImage || "https://i.ibb.co/Ps9gZ8DD/Profile-image.png"}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-lg font-black text-zinc-955">{profName}</h3>
                <p className="text-xs font-bold text-zinc-400 mt-0.5 leading-none">Guest User</p>
              </div>
            </div>

            <div className="space-y-3.5 flex-1 pt-2">
              {[
                { label: "Edit Profile", desc: "Manage phone, country, and DOB", icon: <User className="w-6 h-6 text-zinc-500" />, key: "edit" },
                { label: "My Bookings", desc: "View all your past and upcoming bookings", icon: <CalendarDays className="w-6 h-6 text-zinc-500" />, key: "bookings-nav" },
                { label: "Favorite List", desc: "Browse your saved favorite properties", icon: <Heart className="w-6 h-6 text-zinc-500" />, key: "favorites-nav" },
                { label: "Account Settings", desc: "Change password, terms, and policies", icon: <Settings className="w-6 h-6 text-zinc-500" />, key: "settings" },
                { label: "Payment Settings", desc: "Review Stripe checkout details", icon: <CreditCard className="w-6 h-6 text-zinc-500" />, key: "payment" },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                    if (item.key === "bookings-nav") {
                      router.push("/dashboard/guest/bookings");
                    } else if (item.key === "favorites-nav") {
                      router.push("/dashboard/guest/favorites");
                    } else {
                      setProfileSubView(item.key as any);
                    }
                  }}
                  className="w-full p-4 border border-zinc-150 rounded-2xl text-left hover:border-blue-400 hover:shadow-sm transition-all flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <span className="text-xl shrink-0 mt-0.5">{item.icon}</span>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-955">{item.label}</h4>
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
          <div className="space-y-6 flex-1 flex flex-col justify-between text-left animate-fadeIn">
            <div>
              <div className="flex items-center gap-3 border-b border-zinc-150 pb-4 mb-4">
                <button onClick={() => setProfileSubView("main")} className="text-zinc-400 hover:text-zinc-650 font-bold cursor-pointer">← Back</button>
                <h3 className="text-base font-black text-zinc-955">Edit Profile</h3>
              </div>

              <div className="space-y-4">
                <div className="flex justify-center mb-4">
                  <label className="relative w-20 h-20 rounded-full overflow-hidden bg-zinc-200 cursor-pointer block border-2 border-zinc-100 shadow-md">
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
                    <img src={avatarPreview || profileResponse?.data?.profileImage || "https://i.ibb.co/Ps9gZ8DD/Profile-image.png"} alt="Avatar" className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 inset-x-0 py-1 bg-black/40 text-[8px] font-black text-white text-center">Change</span>
                  </label>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-450 uppercase tracking-wider mb-1">Full Name</label>
                  <input type="text" value={profName} onChange={(e) => setProfName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none text-xs font-bold bg-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-455 uppercase tracking-wider mb-1">Phone Number</label>
                  <input type="text" value={profPhone} onChange={(e) => setProfPhone(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none text-xs font-bold bg-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-455 uppercase tracking-wider mb-1">Country</label>
                  <input type="text" value={profCountry} onChange={(e) => setProfCountry(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none text-xs font-bold bg-white" />
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={isUpdatingProfile}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-2xl font-bold shadow-md text-xs mt-6 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isUpdatingProfile ? "Saving..." : "Save Details"}
            </button>
          </div>
        )}

        {profileSubView === "settings" && (
          <div className="space-y-6 flex-1 flex flex-col justify-between text-left animate-fadeIn">
            <div>
              <div className="flex items-center gap-3 border-b border-zinc-150 pb-4 mb-4">
                <button onClick={() => setProfileSubView("main")} className="text-zinc-400 hover:text-zinc-650 font-bold cursor-pointer">← Back</button>
                <h3 className="text-base font-black text-zinc-955">Account Settings</h3>
              </div>

              <div className="space-y-1">
                {[
                  { label: "Change Password", key: "password" },
                  { label: "Terms of services", key: "terms" },
                  { label: "Privacy Policy", key: "privacy" },
                  { label: "About us", key: "about" },
                  { label: "FAQ", key: "faq" },
                ].map((link) => (
                  <button
                    key={link.key}
                    onClick={() => setProfileSubView(link.key as any)}
                    className="w-full py-3.5 px-2 border-b border-zinc-100 flex items-center justify-between text-xs font-bold text-zinc-700 hover:text-zinc-955 transition-colors cursor-pointer"
                  >
                    <span>{link.label}</span>
                    <span>→</span>
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

        {(profileSubView === "password" || profileSubView === "terms" || profileSubView === "privacy" || profileSubView === "about" || profileSubView === "payment" || profileSubView === "faq") && (
          <div className="space-y-6 flex-1 flex flex-col justify-between text-left animate-fadeIn">
            <div>
              <div className="flex items-center gap-3 border-b border-zinc-150 pb-4 mb-4">
                <button onClick={() => setProfileSubView("settings")} className="text-zinc-400 hover:text-zinc-655 font-bold cursor-pointer">← Back</button>
                <h3 className="text-base font-black text-zinc-955 capitalize">{profileSubView}</h3>
              </div>

              {profileSubView === "password" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">Current Password</label>
                    <div className="relative">
                      <input type={showCurrPass ? "text" : "password"} value={currPass} onChange={(e) => setCurrPass(e.target.value)} placeholder="••••••" className="w-full px-4 py-3.5 pr-10 rounded-xl border border-zinc-200 outline-none text-xs font-bold bg-white" />
                      <button type="button" onClick={() => setShowCurrPass(!showCurrPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-650 cursor-pointer">
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
                      <input type={showNewPass ? "text" : "password"} value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="••••••" className="w-full px-4 py-3.5 pr-10 rounded-xl border border-zinc-200 outline-none text-xs font-bold bg-white" />
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
                      <input type={showConfPass ? "text" : "password"} value={confPass} onChange={(e) => setConfPass(e.target.value)} placeholder="••••••" className="w-full px-4 py-3.5 pr-10 rounded-xl border border-zinc-200 outline-none text-xs font-bold bg-white" />
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
              )}

              {profileSubView === "payment" && (
                <div className="space-y-4">
                  <div className="p-5 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-800 text-white shadow-lg relative overflow-hidden max-w-xs mx-auto text-left">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[8px] font-black tracking-widest text-blue-200 uppercase">Stripe Guest Card</span>
                        <p className="text-sm font-extrabold mt-0.5">Traveler Account</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-lg bg-white/20 text-[8px] font-black border border-white/30">VISA</span>
                    </div>
                    <div className="my-6 text-left">
                      <p className="text-sm font-mono tracking-widest font-bold">••••  ••••  ••••  4242</p>
                    </div>
                  </div>
                </div>
              )}

              {profileSubView === "faq" && (
                <div className="w-full">
                  <FAQView />
                </div>
              )}

              {profileSubView !== "password" && profileSubView !== "payment" && profileSubView !== "faq" && (
                <div className="mt-4 w-full text-left">
                  {profileSubView === "terms" && <TermsView />}
                  {profileSubView === "privacy" && <PrivacyView />}
                  {profileSubView === "about" && <AboutView />}
                </div>
              )}
            </div>

            {profileSubView === "password" && (
              <button
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-2xl font-bold shadow-md text-xs mt-6 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isChangingPassword ? "Updating..." : "Update Password"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* DESKTOP VIEW PROFILE */}
      <div className="hidden lg:grid lg:grid-cols-12 lg:gap-8 lg:h-full lg:items-stretch w-full text-left">
        {/* Left Column Settings Sidebar */}
        <div className="lg:col-span-4 bg-white border border-zinc-150 p-6 rounded-3xl shadow-sm flex flex-col justify-between h-full">
          <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-zinc-150 pb-6">
              <div className="w-16 h-16 rounded-full bg-zinc-200 overflow-hidden relative shadow-inner shrink-0 border-2 border-zinc-100">
                <img src={profileResponse?.data?.profileImage || "https://i.ibb.co/Ps9gZ8DD/Profile-image.png"} alt="Profile" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="text-base font-black text-zinc-950">{profName}</h3>
                <p className="text-[11px] font-bold text-zinc-400 mt-0.5 leading-none">Guest User</p>
              </div>
            </div>

            <nav className="space-y-2.5">
              {[
                { label: "Edit Profile", key: "edit", icon: <User className="w-5 h-5" />, desc: "Manage phone, country, and DOB" },
                { label: "My Bookings", key: "bookings-nav", icon: <CalendarDays className="w-5 h-5" />, desc: "View all your past and upcoming bookings" },
                { label: "Favorite List", key: "favorites-nav", icon: <Heart className="w-5 h-5" />, desc: "Browse your saved favorite properties" },
                { label: "Account Settings", key: "settings", icon: <Settings className="w-5 h-5" />, desc: "Change password, terms, privacy, FAQ, etc." },
              ].map((item) => {
                const isActive = profileSubView === item.key ||
                  (profileSubView === "main" && item.key === "edit") ||
                  (item.key === "settings" && ["settings", "password", "terms", "privacy", "about", "faq"].includes(profileSubView));
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      if (item.key === "bookings-nav") {
                        router.push("/dashboard/guest/bookings");
                      } else if (item.key === "favorites-nav") {
                        router.push("/dashboard/guest/favorites");
                      } else {
                        setProfileSubView(item.key as any);
                      }
                    }}
                    className={`w-full p-3.5 rounded-2xl text-left transition-all border flex items-center justify-between group cursor-pointer ${isActive
                      ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/10"
                      : "bg-white border-zinc-150 text-zinc-655 hover:border-blue-400 hover:text-zinc-955"
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
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${isActive ? "bg-white/20 text-white" : "bg-blue-50 text-blue-600"}`}>→</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Right Column Settings Panel */}
        <div className="lg:col-span-8 bg-white border border-zinc-150 p-8 rounded-3xl shadow-sm flex flex-col justify-between overflow-y-auto h-full min-h-[550px]">
          {(profileSubView === "main" || profileSubView === "edit") && (
            <EditProfileView onBack={() => setProfileSubView("main")} triggerNotification={triggerNotification} />
          )}

          {profileSubView === "settings" && (
            <AccountSettingsView onNavigate={(view) => setProfileSubView(view as any)} />
          )}

          {profileSubView === "password" && (
            <div className="space-y-6 flex-1 flex flex-col justify-between animate-fadeIn text-left">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-zinc-900 tracking-tight">Security & Password</h3>
                  <p className="text-xs text-zinc-400 font-semibold mt-0.5">Modify your credentials.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">Current Password</label>
                    <div className="relative">
                      <input type={showCurrPass ? "text" : "password"} value={currPass} onChange={(e) => setCurrPass(e.target.value)} placeholder="••••••••" className="w-full px-4 py-3.5 pr-10 rounded-xl border border-zinc-200 outline-none text-xs font-bold bg-white" />
                      <button type="button" onClick={() => setShowCurrPass(!showCurrPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-650 cursor-pointer">
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
                      <input type={showNewPass ? "text" : "password"} value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="••••••••" className="w-full px-4 py-3.5 pr-10 rounded-xl border border-zinc-200 outline-none text-xs font-bold bg-white" />
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
                      <input type={showConfPass ? "text" : "password"} value={confPass} onChange={(e) => setConfPass(e.target.value)} placeholder="••••••••" className="w-full px-4 py-3.5 pr-10 rounded-xl border border-zinc-200 outline-none text-xs font-bold bg-white" />
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
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-2xl font-bold shadow-md text-xs mt-6 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isChangingPassword ? "Updating..." : "Update Password"}
              </button>
            </div>
          )}

          {profileSubView === "payment" && (
            <div className="space-y-6 flex-1 flex flex-col justify-between animate-fadeIn text-left">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-zinc-900 tracking-tight">Payment Settings</h3>
                  <p className="text-xs text-zinc-400 font-semibold mt-0.5">Manage your billing account.</p>
                </div>
                <div className="p-5 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-800 text-white shadow-lg relative overflow-hidden max-w-xs mx-auto text-left">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[8px] font-black tracking-widest text-blue-200 uppercase font-sans">Stripe Guest Card</span>
                      <p className="text-sm font-extrabold mt-0.5">Traveler Account</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-lg bg-white/20 text-[8px] font-black border border-white/30">VISA</span>
                  </div>
                  <div className="my-6 text-left">
                    <p className="text-sm font-mono tracking-widest font-bold">••••  ••••  ••••  4242</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {profileSubView === "faq" && (
            <div className="w-full text-left">
              <FAQView />
            </div>
          )}

          {profileSubView !== "password" && profileSubView !== "payment" && profileSubView !== "faq" && profileSubView !== "edit" && profileSubView !== "settings" && profileSubView !== "main" && (
            <div className="mt-4 w-full text-left animate-fadeIn">
              {profileSubView === "terms" && <TermsView />}
              {profileSubView === "privacy" && <PrivacyView />}
              {profileSubView === "about" && <AboutView />}
            </div>
          )}
        </div>
      </div>

      {/* DELETE ACCOUNT CONFIRM MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
          <div className="w-full max-w-[280px] bg-white border border-zinc-200 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-wider leading-relaxed">Confirm deleting your account?</h3>
            <div className="flex gap-3 pt-2">
              <button onClick={handleDeleteAccount} className="flex-1 py-2.5 border-2 border-red-500 text-red-500 font-extrabold rounded-2xl text-xs hover:bg-red-50 transition-colors cursor-pointer">Yes</button>
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 bg-blue-600 text-white font-extrabold rounded-2xl text-xs hover:bg-blue-700 transition-colors cursor-pointer">No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
