"use client";

import React, { useEffect } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error";
  duration?: number;
  onClose?: () => void;
}

export default function Toast({
  message,
  type = "success",
  duration = 3000,
  onClose,
}: ToastProps) {
  useEffect(() => {
    if (duration > 0 && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] px-6 py-4 bg-white border border-zinc-200 rounded-2xl shadow-xl font-bold text-sm text-center flex items-center gap-3 animate-bounce">
      <div
        className={`w-3.5 h-3.5 rounded-full shrink-0 ${
          type === "success" ? "bg-emerald-500" : "bg-red-500"
        }`}
      />
      <span className="text-zinc-800 font-semibold">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-2 p-0.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-650 transition-colors cursor-pointer shrink-0"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
