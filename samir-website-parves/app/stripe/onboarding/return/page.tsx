"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StripeReturnPage() {
  const router = useRouter();

  useEffect(() => {
    // Wait 2 seconds for a premium feel and then redirect to the dashboard
    const timer = setTimeout(() => {
      router.push("/dashboard");
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 p-6 text-center">
      <div className="w-full max-w-md bg-white border border-zinc-200 rounded-3xl p-8 shadow-xl space-y-6 flex flex-col items-center">
        {/* Loading Spinner / Animation */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-blue-50 animate-ping"></div>
          <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-zinc-950">Verifying Connection</h2>
          <p className="text-sm text-zinc-500 font-bold leading-relaxed">
            Please wait while we verify your Stripe account connection status...
          </p>
        </div>

        <div className="text-xs text-zinc-400 font-bold bg-zinc-50 border border-zinc-150 px-4 py-2 rounded-2xl">
          Redirecting to your dashboard shortly
        </div>
      </div>
    </div>
  );
}
