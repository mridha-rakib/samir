"use client";

import React, { useState, useRef } from "react";
import { useVerifyRegistrationOtpMutation, useVerifyOtpMutation } from "@/redux/api/authApi";

interface VerifyOtpFormProps {
  registrationEmail: string;
  previousState: "register" | "forgot" | "login" | "reset";
  setResetToken: (token: string) => void;
  setActiveState: (state: "login" | "register" | "forgot" | "otp" | "reset") => void;
  showNotification: (message: string, type: "success" | "error") => void;
}

export default function VerifyOtpForm({
  registrationEmail,
  previousState,
  setResetToken,
  setActiveState,
  showNotification,
}: VerifyOtpFormProps) {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  const [verifyRegistrationOtp, { isLoading: isRegLoading }] = useVerifyRegistrationOtpMutation();
  const [verifyForgotOtp, { isLoading: isForgotLoading }] = useVerifyOtpMutation();

  const handleOtpChange = (index: number, value: string) => {
    if (value && isNaN(Number(value))) return;

    if (value.length > 1) {
      const numbersOnly = value.replace(/\D/g, "");
      if (numbersOnly.length > 0) {
        const newOtp = [...otp];
        for (let i = 0; i < 4; i++) {
          if (numbersOnly[i]) {
            newOtp[i] = numbersOnly[i];
          }
        }
        setOtp(newOtp);
        const nextIndex = Math.min(numbersOnly.length === 4 ? 3 : numbersOnly.length, 3);
        otpRefs[nextIndex].current?.focus();
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto focus next box
    if (value && index < 3) {
      otpRefs[index + 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").trim();
    const numbersOnly = pastedData.replace(/\D/g, "");
    if (numbersOnly.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < 4; i++) {
        if (numbersOnly[i]) {
          newOtp[i] = numbersOnly[i];
        }
      }
      setOtp(newOtp);
      const nextIndex = Math.min(numbersOnly.length === 4 ? 3 : numbersOnly.length, 3);
      otpRefs[nextIndex].current?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Backspace to focus previous box
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length < 4) {
      showNotification("Please fill in the 4-digit code", "error");
      return;
    }

    try {
      if (previousState === "register") {
        // User registration verification
        const response = await verifyRegistrationOtp({
          email: registrationEmail,
          otp: otpValue,
        }).unwrap();

        if (response.success) {
          showNotification("Account verified successfully! Please login.", "success");
          setTimeout(() => {
            setActiveState("login");
          }, 1000);
        } else {
          showNotification(response.message || "OTP verification failed", "error");
        }
      } else {
        // Forgot password OTP verification
        const response = await verifyForgotOtp({
          otp: otpValue,
        }).unwrap();

        if (response.success && response.data) {
          showNotification("Code verified successfully!", "success");
          setResetToken(response.data.accessToken);
          setTimeout(() => {
            setActiveState("reset");
          }, 800);
        } else {
          showNotification(response.message || "OTP verification failed", "error");
        }
      }
    } catch (err: any) {
      console.error("OTP verification error:", err);
      const errMsg = err?.data?.message || err?.message || "Invalid or expired OTP code.";
      showNotification(errMsg, "error");
    }
  };

  const isLoading = isRegLoading || isForgotLoading;

  return (
    <form onSubmit={handleOtpSubmit} className="space-y-6">
      <div className="text-center mb-2">
        <h2 className="text-lg font-black text-zinc-800 uppercase tracking-wide">Verify OTP</h2>
        <p className="mt-2 text-xs text-zinc-405 text-zinc-400 leading-relaxed font-semibold">
          Enter the 4-digit code sent to your email address:
          <span className="block mt-1 font-bold text-blue-600">{registrationEmail || "your email"}</span>
        </p>
      </div>

      {/* OTP Digit Box Container */}
      <div className="flex justify-center gap-3">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={otpRefs[index]}
            type="text"
            maxLength={1}
            value={digit}
            onChange={(e) => handleOtpChange(index, e.target.value)}
            onKeyDown={(e) => handleOtpKeyDown(index, e)}
            onPaste={handlePaste}
            className="w-14 h-14 text-center text-xl font-bold rounded-2xl border-2 border-zinc-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-zinc-50/50 outline-none transition-all"
          />
        ))}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/10 active:scale-[0.99] transition-all text-sm flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Verifying...
          </>
        ) : (
          "Verify"
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
