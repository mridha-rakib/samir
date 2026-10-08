import React from "react";
import { CheckIcon } from "./Icons";

interface BookingConfirmationProps {
  onViewDetails: () => void;
}

export default function BookingConfirmation({ onViewDetails }: BookingConfirmationProps) {
  return (
    <div className="p-4 sm:p-6 md:p-8 lg:p-10 max-w-md mx-auto text-center animate-fadeIn">
      <div className="bg-white border border-zinc-150 rounded-3xl p-8 shadow-sm space-y-6">
        
        {/* Check circle animation */}
        <div className="w-20 h-20 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-500 shadow-md">
          <CheckIcon />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight">Your Booking Is Confirmed!</h2>
          <p className="text-zinc-400 font-semibold text-xs leading-relaxed">
            Thank you for booking with Hostibook.
          </p>
        </div>

        <button
          onClick={onViewDetails}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/10 text-xs transition-colors cursor-pointer"
        >
          View Booking Details
        </button>

        {/* Footer notice */}
        <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 text-left text-[11px] font-bold text-blue-800 leading-normal">
          You will receive a confirmation email shortly.
          <p className="text-[10px] text-blue-600 font-semibold mt-0.5">Powered by Hostibook</p>
        </div>

      </div>
    </div>
  );
}
