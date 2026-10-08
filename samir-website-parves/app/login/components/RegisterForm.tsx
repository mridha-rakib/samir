"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useRegisterUserMutation, useRegisterServiceProviderMutation } from "@/redux/api/userApi";
import { UserIcon, MailIcon, LocationIcon, LockIcon, EyeIcon, EyeOffIcon, UploadIcon } from "./icons";

interface RegisterFormProps {
  roleParam: string;
  setActiveState: (state: "login" | "register" | "forgot" | "otp" | "reset") => void;
  setRegistrationEmail: (email: string) => void;
  showNotification: (message: string, type: "success" | "error") => void;
}

export default function RegisterForm({
  roleParam,
  setActiveState,
  setRegistrationEmail,
  showNotification,
}: RegisterFormProps) {
  const router = useRouter();

  // Roles
  const isServiceProvider = roleParam.toLowerCase() === "service provider";
  const displayRole = roleParam
    ? roleParam.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
    : "Guest";

  // Form Fields State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [location, setLocation] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Files State
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [passportPreview, setPassportPreview] = useState<string | null>(null);

  // RTK Query hooks
  const [registerUser, { isLoading: isRegisterUserLoading }] = useRegisterUserMutation();
  const [registerServiceProvider, { isLoading: isRegisterSPLoading }] = useRegisterServiceProviderMutation();

  // Clean up object URLs on unmount
  React.useEffect(() => {
    return () => {
      if (profileImagePreview) URL.revokeObjectURL(profileImagePreview);
      if (passportPreview) URL.revokeObjectURL(passportPreview);
    };
  }, [profileImagePreview, passportPreview]);

  const handlePassportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        showNotification("File size exceeds 5 MB limit", "error");
        return;
      }
      setPassportFile(file);
      if (passportPreview) {
        URL.revokeObjectURL(passportPreview);
      }
      if (file.type.startsWith("image/")) {
        setPassportPreview(URL.createObjectURL(file));
      } else {
        setPassportPreview(null);
      }
      showNotification(`Document "${file.name}" uploaded successfully!`, "success");
    }
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        showNotification("Profile image exceeds 2 MB limit", "error");
        return;
      }
      setProfileImageFile(file);
      if (profileImagePreview) {
        URL.revokeObjectURL(profileImagePreview);
      }
      setProfileImagePreview(URL.createObjectURL(file));
      showNotification(`Profile image "${file.name}" uploaded successfully!`, "success");
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !email || !password || !confirmPassword || !location) {
      showNotification("Please fill in all required fields", "error");
      return;
    }

    if (password !== confirmPassword) {
      showNotification("Passwords do not match", "error");
      return;
    }

    if (password.length < 6) {
      showNotification("Password must be at least 6 characters", "error");
      return;
    }

    // Role mapping
    let backendRole = "USER";
    if (roleParam.toLowerCase() === "property owner") {
      backendRole = "PROPERTY_OWNER";
    } else if (roleParam.toLowerCase() === "service provider") {
      backendRole = "SERVICE_PROVIDER";
    }

    // Construct FormData as expected by the backend parseBodyData middleware
    const formData = new FormData();
    const bodyData: any = {
      fullName,
      email,
      password,
      address: location,
      contactNumber: contactNumber || undefined,
      country: "Bangladesh",
      role: backendRole,
    };

    formData.append("data", JSON.stringify(bodyData));

    // Handle files upload
    if (isServiceProvider) {
      if (!profileImageFile) {
        showNotification("Profile image is required for Service Providers", "error");
        return;
      }
      if (!passportFile) {
        showNotification("Passport or NID document is required for Service Providers", "error");
        return;
      }
      formData.append("profileImage", profileImageFile);
      formData.append("passportOrNID", passportFile);
    } else {
      // Optional passport upload for User/Property Owner
      if (passportFile) {
        formData.append("passportOrNID", passportFile);
      }
    }

    try {
      let response;
      if (isServiceProvider) {
        response = await registerServiceProvider(formData).unwrap();
      } else {
        response = await registerUser(formData).unwrap();
      }

      if (response.success) {
        showNotification(response.message || "OTP sent successfully to email!", "success");
        setRegistrationEmail(email);
        setTimeout(() => {
          setActiveState("otp");
        }, 800);
      } else {
        showNotification(response.message || "Registration failed", "error");
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      const errMsg = err?.data?.message || err?.message || "Registration failed. Try using another email.";
      showNotification(errMsg, "error");
    }
  };

  const isLoading = isRegisterUserLoading || isRegisterSPLoading;

  return (
    <form onSubmit={handleRegisterSubmit} className="space-y-4 max-h-[58vh] overflow-y-auto pr-1">
      <div>
        <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">
          Full Name *
        </label>
        <div className="relative flex items-center">
          <span className="absolute left-4">
            <UserIcon />
          </span>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-zinc-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-zinc-50/50 outline-none text-sm transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">
          Email Address *
        </label>
        <div className="relative flex items-center">
          <span className="absolute left-4">
            <MailIcon />
          </span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-zinc-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-zinc-50/50 outline-none text-sm transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">
          Contact Number (Optional)
        </label>
        <div className="relative flex items-center">
          <span className="absolute left-4 text-zinc-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </span>
          <input
            type="text"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            placeholder="Enter your phone number"
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-zinc-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-zinc-50/50 outline-none text-sm transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">
          Location / Address *
        </label>
        <div className="relative flex items-center">
          <span className="absolute left-4">
            <LocationIcon />
          </span>
          <input
            type="text"
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Address"
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-zinc-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-zinc-50/50 outline-none text-sm transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">
          Password *
        </label>
        <div className="relative flex items-center">
          <span className="absolute left-4">
            <LockIcon />
          </span>
          <input
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full pl-11 pr-11 py-3.5 rounded-2xl border border-zinc-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-zinc-50/50 outline-none text-sm transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 focus:outline-none"
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">
          Confirm Password *
        </label>
        <div className="relative flex items-center">
          <span className="absolute left-4">
            <LockIcon />
          </span>
          <input
            type={showConfirmPassword ? "text" : "password"}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            className="w-full pl-11 pr-11 py-3.5 rounded-2xl border border-zinc-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-zinc-50/50 outline-none text-sm transition-all"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-4 focus:outline-none"
          >
            {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
      </div>

      {/* Profile Image - Enforced for Service Provider */}
      {isServiceProvider && (
        <div>
          <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">
            Upload Profile Image *
          </label>
          <div className="border-2 border-dashed border-zinc-200 hover:border-blue-300 hover:bg-blue-50/10 rounded-2xl p-4 text-center cursor-pointer relative bg-zinc-50/30 transition-all flex flex-col items-center justify-center min-h-[110px]">
            <input
              type="file"
              required
              accept="image/*"
              onChange={handleProfileImageChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            {profileImagePreview ? (
              <div className="flex flex-col items-center gap-2">
                <div className="relative w-16 h-16 rounded-full overflow-hidden border border-zinc-200 shadow-sm">
                  <img
                    src={profileImagePreview}
                    alt="Profile Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs font-bold text-blue-600 max-w-[280px] truncate">
                  {profileImageFile?.name}
                </p>
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Click or drag to replace</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5">
                <UploadIcon />
                <p className="text-xs font-bold text-zinc-700">
                  Select Profile Image (Max 2MB)
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Security Document Upload Area */}
      <div>
        <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">
          {isServiceProvider ? "Upload Security Document (Passport, NID) *" : "Upload Security Document (Passport, NID) - Optional"}
        </label>
        <div className="border-2 border-dashed border-zinc-200 hover:border-blue-300 hover:bg-blue-50/10 rounded-2xl p-4 text-center cursor-pointer relative bg-zinc-50/30 transition-all flex flex-col items-center justify-center min-h-[110px]">
          <input
            type="file"
            required={isServiceProvider}
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handlePassportChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          {passportFile ? (
            <div className="flex flex-col items-center gap-2">
              {passportPreview ? (
                <div className="relative w-28 h-16 rounded-lg overflow-hidden border border-zinc-200 shadow-sm bg-white">
                  <img
                    src={passportPreview}
                    alt="Passport Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg bg-red-50 text-red-500 border border-red-100 flex items-center justify-center font-bold text-[10px] uppercase">
                  PDF
                </div>
              )}
              <p className="text-xs font-bold text-blue-600 max-w-[280px] truncate">
                {passportFile.name}
              </p>
              <span className="text-[10px] font-bold text-zinc-400 uppercase">Click or drag to replace</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <UploadIcon />
              <p className="text-xs font-bold text-zinc-700">
                Select Passport/NID (Max 5MB)
              </p>
            </div>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/10 active:scale-[0.99] transition-all text-sm mt-2 flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Signing Up...
          </>
        ) : (
          "Sign Up"
        )}
      </button>

      <div className="text-center pt-2 pb-1">
        <button
          type="button"
          onClick={() => {
            showNotification("Continuing as guest...", "success");
            setTimeout(() => router.push("/"), 500);
          }}
          className="text-xs font-bold text-blue-600 hover:underline"
        >
          Continue as guest
        </button>
      </div>
    </form>
  );
}
