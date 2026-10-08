"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import ForgotPasswordForm from "./components/ForgotPasswordForm";
import VerifyOtpForm from "./components/VerifyOtpForm";
import ResetPasswordForm from "./components/ResetPasswordForm";

function AuthFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Selected role (e.g. property owner, service provider, guest)
  const roleParam = searchParams.get("role") || "";
  const displayRole = roleParam
    ? roleParam.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
    : "Guest";

  // Auth flow states: "login", "register", "forgot", "otp", "reset"
  const [activeState, setActiveState] = useState<"login" | "register" | "forgot" | "otp" | "reset">("login");
  const [previousState, setPreviousState] = useState<"login" | "register" | "forgot" | "otp" | "reset">("login");
  const [registrationEmail, setRegistrationEmail] = useState("");
  const [resetToken, setResetToken] = useState("");

  // Feedback Notification Banner
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const changeState = (nextState: "login" | "register" | "forgot" | "otp" | "reset") => {
    setPreviousState(activeState);
    setActiveState(nextState);
  };

  return (
    <div className="relative w-full max-w-[420px] bg-white border border-zinc-150 rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300">
      
      {/* Back to roles arrow */}
      <button
        onClick={() => {
          if (activeState === "login" || activeState === "register") {
            router.push("/");
          } else {
            changeState("login");
          }
        }}
        className="absolute top-6 left-6 p-2 rounded-full hover:bg-zinc-100 text-zinc-600 transition-colors"
        aria-label="Go back"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>

      {/* Role Badge Indicator */}
      {roleParam && (
        <div className="absolute top-6 right-6 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold border border-blue-100">
          {displayRole}
        </div>
      )}

      {/* Toast Notification */}
      {notification && (
        <div className={`absolute -top-16 left-4 right-4 p-3.5 rounded-2xl text-xs font-bold text-center shadow-lg border animate-bounce ${
          notification.type === "success"
            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
            : "bg-red-50 text-red-800 border-red-200"
        }`}>
          {notification.message}
        </div>
      )}

      {/* BRAND HEADER */}
      <div className="w-full flex flex-col items-center mt-6 mb-6">
        <h1 className="text-3xl font-extrabold text-blue-600 tracking-tight">Hostibook</h1>
        
        {activeState === "login" && (
          <p className="mt-2 text-xs text-zinc-500 text-center font-medium leading-relaxed">
            Welcome back to effortless management.
          </p>
        )}
      </div>

      {/* TABS (Only visible in login/register states) */}
      {(activeState === "login" || activeState === "register") && (
        <div className="flex bg-zinc-100 p-1 rounded-2xl mb-6">
          <button
            onClick={() => changeState("login")}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${
              activeState === "login"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => changeState("register")}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${
              activeState === "register"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Register
          </button>
        </div>
      )}

      {/* Render subcomponents dynamically based on state */}
      {activeState === "login" && (
        <LoginForm
          roleParam={roleParam}
          displayRole={displayRole}
          setActiveState={changeState}
          showNotification={showNotification}
        />
      )}

      {activeState === "register" && (
        <RegisterForm
          roleParam={roleParam}
          setActiveState={changeState}
          setRegistrationEmail={setRegistrationEmail}
          showNotification={showNotification}
        />
      )}

      {activeState === "forgot" && (
        <ForgotPasswordForm
          setActiveState={changeState}
          setRegistrationEmail={setRegistrationEmail}
          showNotification={showNotification}
        />
      )}

      {activeState === "otp" && (
        <VerifyOtpForm
          registrationEmail={registrationEmail}
          previousState={previousState as "register" | "forgot"}
          setResetToken={setResetToken}
          setActiveState={changeState}
          showNotification={showNotification}
        />
      )}

      {activeState === "reset" && (
        <ResetPasswordForm
          resetToken={resetToken}
          setActiveState={changeState}
          showNotification={showNotification}
        />
      )}

    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-100 px-4 py-8 relative">
      {/* Background radial soft lights */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />

      {/* Suspense wrapper handles client-side dynamic search parameters */}
      <Suspense fallback={
        <div className="w-full max-w-[420px] bg-white border border-zinc-200 rounded-3xl shadow-xl p-8 flex items-center justify-center min-h-[500px]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-semibold text-zinc-400">Loading Hostibook Portal...</p>
          </div>
        </div>
      }>
        <AuthFormContent />
      </Suspense>
    </div>
  );
}
