"use client";

import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useGetMyProfileQuery, useUpdateProfileMutation } from "@/redux/api/userApi";

interface EditProfileViewProps {
  onBack: () => void;
  triggerNotification: (msg: string, type?: "success" | "error") => void;
}

export default function EditProfileView({ onBack, triggerNotification }: EditProfileViewProps) {
  const user = useSelector((state: RootState) => state.auth.user);
  const token = useSelector((state: RootState) => state.auth.token);
  
  const { data: profileResponse } = useGetMyProfileQuery(undefined, { skip: !token });
  const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateProfileMutation();

  const [localProfName, setLocalProfName] = useState("");
  const [profDob, setProfDob] = useState("28/11/1997");
  const [profCountry, setProfCountry] = useState("");
  const [profPhone, setProfPhone] = useState("");
  const [profAddress, setProfAddress] = useState("");
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

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
        triggerNotification("Profile details saved successfully!", "success");
        onBack();
      } else {
        triggerNotification(response.message || "Failed to update profile", "error");
      }
    } catch (err: any) {
      console.error("Save profile error:", err);
      triggerNotification(err?.data?.message || err?.message || "Failed to update profile", "error");
    }
  };

  return (
    <div className="space-y-6 flex-1 flex flex-col justify-between text-left">
      <div>
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center gap-3 border-b border-zinc-150 pb-4 mb-4">
          <button onClick={onBack} className="text-zinc-400 hover:text-zinc-650 cursor-pointer font-bold text-lg">←</button>
          <h3 className="text-base font-black text-zinc-955">Edit Profile</h3>
        </div>
        
        {/* Desktop Header */}
        <h3 className="hidden lg:block text-base font-black text-zinc-955 border-b border-zinc-100 pb-3 mb-6">Edit Profile</h3>

        {/* Profile Picture Section */}
        <div className="flex flex-col lg:flex-row items-center lg:items-center gap-4 pb-2 mb-4">
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
          <div className="text-center lg:text-left">
            <h4 className="text-sm font-black text-zinc-955 hidden lg:block">Profile Picture</h4>
            <p className="text-[10px] font-semibold text-zinc-400 mt-0.5 leading-relaxed hidden lg:block">
              Click the image to upload a new one.<br />JPG, PNG or WEBP format.
            </p>
            <label className="lg:hidden inline-block mt-2 px-4 py-1.5 bg-zinc-100 text-zinc-600 text-xs font-bold rounded-xl cursor-pointer">
              Change Image
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
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 mb-1 lg:mb-1.5 uppercase tracking-wider">Full Name</label>
            <input type="text" value={localProfName} onChange={(e) => setLocalProfName(e.target.value)} className="w-full px-4 py-3 lg:py-3.5 rounded-xl lg:rounded-2xl border border-zinc-200 bg-zinc-50/50 outline-none text-xs font-bold text-zinc-800" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 mb-1 lg:mb-1.5 uppercase tracking-wider">Email Address</label>
            <input type="email" readOnly value={profileResponse?.data?.email || user?.email || ""} className="w-full px-4 py-3 lg:py-3.5 rounded-xl lg:rounded-2xl border border-zinc-200 bg-zinc-100 text-zinc-400 outline-none text-xs font-bold cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 mb-1 lg:mb-1.5 uppercase tracking-wider">Date of Birth</label>
            <input type="text" value={profDob} onChange={(e) => setProfDob(e.target.value)} className="w-full px-4 py-3 lg:py-3.5 rounded-xl lg:rounded-2xl border border-zinc-200 bg-zinc-50/50 outline-none text-xs font-bold text-zinc-800" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 mb-1 lg:mb-1.5 uppercase tracking-wider">Phone number</label>
            <input type="text" value={profPhone} onChange={(e) => setProfPhone(e.target.value)} className="w-full px-4 py-3 lg:py-3.5 rounded-xl lg:rounded-2xl border border-zinc-200 bg-zinc-50/50 outline-none text-xs font-bold text-zinc-800" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 mb-1 lg:mb-1.5 uppercase tracking-wider">Country</label>
            <input type="text" value={profCountry} onChange={(e) => setProfCountry(e.target.value)} className="w-full px-4 py-3 lg:py-3.5 rounded-xl lg:rounded-2xl border border-zinc-200 bg-zinc-50/50 outline-none text-xs font-bold text-zinc-800" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 mb-1 lg:mb-1.5 uppercase tracking-wider">Address</label>
            <input type="text" value={profAddress} onChange={(e) => setProfAddress(e.target.value)} className="w-full px-4 py-3 lg:py-3.5 rounded-xl lg:rounded-2xl border border-zinc-200 bg-zinc-50/50 outline-none text-xs font-bold text-zinc-800" />
          </div>
        </div>
      </div>
      
      {/* Save Button */}
      <button 
        onClick={handleSaveProfile} 
        disabled={isUpdatingProfile} 
        className="w-full lg:w-fit mt-6 lg:mt-0 px-6 py-4 lg:py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-2xl font-bold shadow-md text-sm lg:text-xs flex items-center justify-center gap-2 cursor-pointer"
      >
        {isUpdatingProfile ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}
