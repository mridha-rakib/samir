"use client";

import React, { useState } from "react";
import { useResetPasswordMutation } from "@/redux/api/authApi";
import { LockIcon, EyeIcon, EyeOffIcon } from "./icons";

interface ResetPasswordFormProps {
  resetToken: string;
  setActiveState: (state: "login" | "register" | "forgot" | "otp" | "reset") => void;
  showNotification: (message: string, type: "success" | "error") => void;
}

export default function ResetPasswordForm({
  resetToken,
  setActiveState,
  showNotification,
}: ResetPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      showNotification("Please fill in both password fields", "error");
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

    if (!resetToken) {
      showNotification("Reset token is missing. Please restart forgot password process.", "error");
      setActiveState("forgot");
      return;
    }

    try {
      const response = await resetPassword({
        token: resetToken,
        body: {
          password,
          confirmPassword,
        },
      }).unwrap();

      showNotification("Password updated successfully! Please login.", "success");
      setTimeout(() => {
        setActiveState("login");
      }, 1200);
    } catch (err: any) {
      console.error("Reset password error:", err);
      const errMsg = err?.data?.message || err?.message || "Failed to reset password. Token may have expired.";
      showNotification(errMsg, "error");
    }
  };

  return (
    <form onSubmit={handleResetSubmit} className="space-y-4">
      <div className="text-center mb-2">
        <h2 className="text-lg font-black text-zinc-800 uppercase tracking-wide">Set a New Password</h2>
        <p className="mt-1.5 text-xs text-zinc-400 font-semibold leading-relaxed">
          Please enter and confirm your new secure password.
        </p>
      </div>

      <div>
        <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">
          New Password
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
            placeholder="Enter new password"
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
          Confirm New Password
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
            placeholder="Confirm new password"
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

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/10 active:scale-[0.99] transition-all text-sm mt-2 flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Updating...
          </>
        ) : (
          "Update Password"
        )}
      </button>
    </form>
  );
}
