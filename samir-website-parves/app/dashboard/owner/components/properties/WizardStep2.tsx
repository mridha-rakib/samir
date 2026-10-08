import React from "react";

interface WizardStep2Props {
  onBack: () => void;
  onNext: () => void;
  isLoading: boolean;

  // Guard states
  guardName: string;
  setGuardName: (val: string) => void;
  guardPhone: string;
  setGuardPhone: (val: string) => void;
  guardWhatsapp: string;
  setGuardWhatsapp: (val: string) => void;
  guardImageFile: File | null;
  setGuardImageFile: (file: File | null) => void;
  guardImagePreview: string | null;
  setGuardImagePreview: (url: string | null) => void;
}

export default function WizardStep2({
  onBack,
  onNext,
  isLoading,
  guardName,
  setGuardName,
  guardPhone,
  setGuardPhone,
  guardWhatsapp,
  setGuardWhatsapp,
  guardImageFile,
  setGuardImageFile,
  guardImagePreview,
  setGuardImagePreview,
}: WizardStep2Props) {
  return (
    <div className="space-y-6 text-left">
      <h3 className="text-lg font-black tracking-tight text-zinc-950">
        Assign Security Guard
      </h3>
      <p className="text-xs font-semibold text-zinc-400 leading-relaxed uppercase tracking-wider">
        Step 2 of 3 – Basic Information
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">
            Guard Name
          </label>
          <input
            type="text"
            value={guardName}
            onChange={(e) => setGuardName(e.target.value)}
            placeholder="Enter guard's full name"
            className="w-full px-4 py-3.5 rounded-2xl border border-zinc-200 focus:border-blue-500 bg-zinc-50/50 outline-none text-sm font-bold"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">
            Phone Number
          </label>
          <input
            type="text"
            value={guardPhone}
            onChange={(e) => setGuardPhone(e.target.value)}
            placeholder="Enter guard's phone number"
            className="w-full px-4 py-3.5 rounded-2xl border border-zinc-200 focus:border-blue-500 bg-zinc-50/50 outline-none text-sm font-bold"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">
            WhatsApp Number
          </label>
          <input
            type="text"
            value={guardWhatsapp}
            onChange={(e) => setGuardWhatsapp(e.target.value)}
            placeholder="Enter guard's whatsapp number"
            className="w-full px-4 py-3.5 rounded-2xl border border-zinc-200 focus:border-blue-500 bg-zinc-50/50 outline-none text-sm font-bold"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">
            Upload Guard Photo
          </label>
          <div className="flex justify-center py-4">
            <label className="relative h-24 w-24 rounded-full border-2 border-dashed border-zinc-250 flex items-center justify-center bg-zinc-50 cursor-pointer overflow-hidden">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    setGuardImageFile(file);
                    setGuardImagePreview(URL.createObjectURL(file));
                  }
                }}
                className="hidden"
              />
              {guardImagePreview ? (
                <img
                  src={guardImagePreview}
                  alt="Guard Preview"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <>
                  <svg
                    className="w-8 h-8 text-zinc-350"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md">
                    +
                  </span>
                </>
              )}
            </label>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-4 border-2 border-zinc-200 text-zinc-500 rounded-2xl font-bold hover:bg-zinc-50 transition-colors text-sm cursor-pointer"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={isLoading}
          className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/10 transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Assigning Guard...
            </>
          ) : (
            "Next → Confirm Details"
          )}
        </button>
      </div>
    </div>
  );
}
