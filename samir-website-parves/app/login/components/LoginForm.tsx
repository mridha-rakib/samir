"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { useLoginMutation } from "@/redux/api/authApi";
import { setCredentials } from "@/redux/features/authSlice";
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon } from "./icons";

interface LoginFormProps {
  roleParam: string;
  displayRole: string;
  setActiveState: (state: "login" | "register" | "forgot" | "otp" | "reset") => void;
  showNotification: (message: string, type: "success" | "error") => void;
}

export default function LoginForm({
  roleParam,
  displayRole,
  setActiveState,
  showNotification,
}: LoginFormProps) {
  const router = useRouter();
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [login, { isLoading }] = useLoginMutation();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showNotification("Please fill in all credentials", "error");
      return;
    }

    // Map query parameter role to backend UserRole enum
    let backendRole = "USER";
    if (roleParam.toLowerCase() === "property owner") {
      backendRole = "PROPERTY_OWNER";
    } else if (roleParam.toLowerCase() === "service provider") {
      backendRole = "SERVICE_PROVIDER";
    }

    try {
      const response = await login({
        email,
        password,
        role: backendRole,
      }).unwrap();

      if (response.success && response.data) {
        dispatch(
          setCredentials({
            token: response.data.accessToken,
            user: response.data.user,
          })
        );
        showNotification(`Logged in successfully as ${displayRole}!`, "success");
        setTimeout(() => {
          router.push(`/dashboard?role=${encodeURIComponent(roleParam.toLowerCase() || "guest")}`);
        }, 800);
      } else {
        showNotification(response.message || "Login failed", "error");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      const errMsg = err?.data?.message || err?.message || "Incorrect credentials or active role mismatch!";
      showNotification(errMsg, "error");
    }
  };

  return (
    <form onSubmit={handleLoginSubmit} className="space-y-4">
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

      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
            Password
          </label>
          <button
            type="button"
            onClick={() => setActiveState("forgot")}
            className="text-xs font-bold text-blue-600 hover:underline"
          >
            Forgot Password?
          </button>
        </div>
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

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/10 active:scale-[0.99] transition-all text-sm mt-2 flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Logging in...
          </>
        ) : (
          "Login"
        )}
      </button>

      <p className="text-center text-xs text-zinc-500 mt-2 font-medium">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          onClick={() => setActiveState("register")}
          className="text-blue-600 hover:underline font-bold"
        >
          Register
        </button>
      </p>
    </form>
  );
}
