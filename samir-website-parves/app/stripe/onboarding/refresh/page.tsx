"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StripeRefreshPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard immediately or after a short delay to re-trigger onboarding link generation
    const timer = setTimeout(() => {
      router.push("/dashboard");
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 p-6 text-center">
      <div className="w-full max-w-md bg-white border border-zinc-200 rounded-3xl p-8 shadow-xl space-y-6 flex flex-col items-center">
        {/* Loading Spinner */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-amber-50 animate-ping"></div>
          <div className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent animate-spin"></div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-zinc-955">Refreshing Stripe Session</h2>
          <p className="text-sm text-zinc-500 font-bold leading-relaxed">
            Your Stripe onboarding link expired. Let's return to the dashboard to generate a fresh connection link.
          </p>
        </div>

        <div className="text-xs text-zinc-400 font-bold bg-zinc-50 border border-zinc-150 px-4 py-2 rounded-2xl">
          Returning to dashboard shortly
        </div>
      </div>
    </div>
  );
}
