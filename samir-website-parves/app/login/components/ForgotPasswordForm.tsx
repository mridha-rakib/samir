"use client";

import React, { useState } from "react";
import { useForgotPasswordMutation } from "@/redux/api/authApi";
import { MailIcon } from "./icons";

interface ForgotPasswordFormProps {
  setActiveState: (state: "login" | "register" | "forgot" | "otp" | "reset") => void;
  setRegistrationEmail: (email: string) => void;
  showNotification: (message: string, type: "success" | "error") => void;
}

export default function ForgotPasswordForm({
  setActiveState,
  setRegistrationEmail,
  showNotification,
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showNotification("Please enter your email", "error");
      return;
    }

    try {
      const response = await forgotPassword({ email }).unwrap();

      if (response.success) {
        showNotification(response.message || "OTP sent successfully to email!", "success");
        setRegistrationEmail(email);
        setTimeout(() => {
          setActiveState("otp");
        }, 800);
      } else {
        showNotification(response.message || "Request failed", "error");
      }
    } catch (err: any) {
      console.error("Forgot password error:", err);
      const errMsg = err?.data?.message || err?.message || "User not found or request failed.";
      showNotification(errMsg, "error");
    }
  };

  return (
    <form onSubmit={handleForgotPasswordSubmit} className="space-y-5">
      <div className="text-center mb-2">
        <h2 className="text-lg font-black text-zinc-805 text-zinc-800 uppercase tracking-wide">Forgot Password</h2>
        <p className="mt-2 text-xs text-zinc-400 leading-relaxed font-semibold">
          Enter your registered email and we&apos;ll send you a 4-digit code to reset your password.
        </p>
      </div>

      <div>
        <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">
          Email Address
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

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/10 active:scale-[0.99] transition-all text-sm flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Sending...
          </>
        ) : (
          "Send OTP"
        )}
      </button>

      <div className="text-center pt-2">
        <button
          type="button"
          onClick={() => setActiveState("login")}
          className="text-xs font-bold text-blue-600 hover:underline"
        >
          Back to Log in
        </button>
      </div>
    </form>
  );
}
