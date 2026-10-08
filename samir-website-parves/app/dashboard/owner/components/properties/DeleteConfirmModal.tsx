import React from "react";

interface DeleteConfirmModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmModal({
  show,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
      <div className="w-full max-w-[380px] bg-white border border-zinc-200 rounded-3xl p-6 shadow-2xl space-y-6 text-center relative">
        <div className="flex justify-between items-center pb-2 border-b border-zinc-150">
          <h3 className="font-black text-base text-zinc-950">
            Delete Property
          </h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-650 font-extrabold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col items-center gap-4 py-2">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>
          <p className="text-sm text-zinc-600 font-bold leading-relaxed px-4">
            Are you sure you want to delete this property? This action cannot be undone.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <button
            onClick={onConfirm}
            className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold shadow-md shadow-red-500/20 text-sm cursor-pointer transition-colors"
          >
            Yes, Delete Property
          </button>
          <button
            onClick={onClose}
            className="w-full py-3.5 border-2 border-zinc-200 hover:bg-zinc-50 text-zinc-600 rounded-2xl font-bold text-sm cursor-pointer transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
