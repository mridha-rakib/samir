"use client";

import React, { useEffect, useRef } from "react";
import { useGetSingleMyHotelBookingForUserQuery } from "@/redux/api/hotelBookingApi";

interface PaymentPendingScreenProps {
  checkoutUrl: string | null;
  bookingId: string;
  onPaymentSuccess: () => void;
  onBack: () => void;
  triggerNotification: (msg: string, type?: "success" | "error") => void;
}

export default function PaymentPendingScreen({
  checkoutUrl,
  bookingId,
  onPaymentSuccess,
  onBack,
  triggerNotification,
}: PaymentPendingScreenProps) {
  // Query and poll status every 4 seconds
  const { data: apiResponse, refetch, isFetching } = useGetSingleMyHotelBookingForUserQuery(bookingId, {
    skip: !bookingId,
    pollingInterval: 4000,
  });

  const booking = apiResponse?.data;
  const isPaid = booking?.payment?.[0]?.status === "PAID" || booking?.bookingStatus === "CONFIRMED";

  const hasAutoOpened = useRef(false);

  // Auto-open Stripe checkout on first render
  useEffect(() => {
    if (checkoutUrl && !hasAutoOpened.current) {
      hasAutoOpened.current = true;
      // Small delay to let the page render first, then auto-redirect
      const t = setTimeout(() => {
        window.open(checkoutUrl, "_blank");
      }, 800);
      return () => clearTimeout(t);
    }
  }, [checkoutUrl]);

  useEffect(() => {
    if (isPaid) {
      triggerNotification("Payment verified successfully!", "success");
      onPaymentSuccess();
    }
  }, [isPaid, onPaymentSuccess, triggerNotification]);

  const handlePayClick = () => {
    if (checkoutUrl) {
      window.open(checkoutUrl, "_blank");
    } else {
      triggerNotification("Checkout URL not available. Try refetching.", "error");
    }
  };

  const handleVerifyClick = async () => {
    triggerNotification("Verifying payment status...", "success");
    const res = await refetch();
    const latestBooking = res.data?.data;
    const latestPaid = latestBooking?.payment?.[0]?.status === "PAID" || latestBooking?.bookingStatus === "CONFIRMED";
    
    if (latestPaid) {
      triggerNotification("Payment verified successfully!", "success");
      onPaymentSuccess();
    } else {
      triggerNotification("Payment not received yet. Please checkout first.", "error");
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 lg:p-10 max-w-md mx-auto text-center animate-fadeIn">
      <div className="bg-white border border-zinc-150 rounded-3xl p-8 shadow-sm space-y-6">
        
        {/* Animated credit card loader icon */}
        <div className="w-20 h-20 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600 shadow-sm relative">
          <svg className="w-10 h-10 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <div className="absolute top-0 right-0 w-4 h-4 bg-blue-500 rounded-full border-2 border-white animate-ping"></div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight">Complete Your Payment</h2>
          <p className="text-zinc-450 font-semibold text-xs leading-relaxed">
            Please pay using the Stripe secure checkout page to complete your booking.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handlePayClick}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/10 text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Pay with Stripe
          </button>

          <button
            onClick={handleVerifyClick}
            disabled={isFetching}
            className="w-full py-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isFetching ? (
              <span className="w-4 h-4 border-2 border-zinc-800 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.2 8H18.2" />
              </svg>
            )}
            Verify Status
          </button>
        </div>

        {/* Polling Info Alert */}
        <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-150 text-left text-[11px] font-bold text-zinc-500 leading-normal flex items-start gap-2.5">
          <span className="text-zinc-400 text-sm">ℹ️</span>
          <span>
            We are waiting for payment confirmation. This page will update automatically once completed.
          </span>
        </div>

        <button
          onClick={onBack}
          className="text-zinc-450 hover:text-zinc-750 font-bold text-xs transition-colors cursor-pointer"
        >
          Cancel Booking
        </button>

      </div>
    </div>
  );
}
