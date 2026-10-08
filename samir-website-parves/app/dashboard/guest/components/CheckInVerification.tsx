import React, { useState } from "react";

interface Traveler {
  id: number;
  name: string;
  file: File | null;
  fileName: string | null;
}

interface CheckInVerificationProps {
  onBack: () => void;
  onSubmit: (travelersList: { name: string; file: File }[]) => void;
  triggerNotification: (msg: string, type?: "success" | "error") => void;
  guestsCount?: number;
}

export default function CheckInVerification({
  onBack,
  onSubmit,
  triggerNotification,
  guestsCount,
}: CheckInVerificationProps) {
  const [travelers, setTravelers] = useState<Traveler[]>(() => {
    const count = guestsCount && guestsCount > 0 ? guestsCount : 1;
    return Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i, // Unique ID for each
      name: "",
      file: null,
      fileName: null
    }));
  });

  const addAnotherTraveler = () => {
    setTravelers([...travelers, { id: Date.now(), name: "", file: null, fileName: null }]);
  };

  const removeTraveler = (id: number) => {
    if (travelers.length === 1) return;
    setTravelers(travelers.filter(t => t.id !== id));
  };

  const handleTravelerNameChange = (id: number, name: string) => {
    setTravelers(travelers.map(t => t.id === id ? { ...t, name } : t));
  };

  const handleFileChange = (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTravelers(travelers.map(t => t.id === id ? { ...t, file, fileName: file.name } : t));
      triggerNotification(`Passport selected for guest!`, "success");
    }
  };

  const handleSubmitClick = () => {
    if (travelers.some(t => !t.name.trim() || !t.file)) {
      triggerNotification("Please fill in guest names and upload passports.", "error");
      return;
    }
    const sanitized = travelers.map(t => ({
      name: t.name.trim(),
      file: t.file as File,
    }));
    onSubmit(sanitized);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 lg:p-10 max-w-2xl mx-auto text-left animate-fadeIn">
      <div className="bg-white border border-zinc-150 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-150">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-550 hover:text-zinc-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
            Cancel
          </button>
          <span className="text-xs font-black text-blue-600 bg-blue-50 px-3.5 py-1.5 rounded-full uppercase tracking-wider">
            Book Service
          </span>
        </div>

        {/* Instructions */}
        <div className="space-y-1 text-center md:text-left">
          <h2 className="text-lg font-black text-zinc-950 tracking-tight">Passport Verification</h2>
          <p className="text-zinc-400 font-semibold text-xs leading-relaxed">
            Before we confirm your booking, please upload passports for all guests.
          </p>
        </div>

        {/* Travelers forms list */}
        <div className="space-y-5">
          {travelers.map((traveler, index) => (
            <div key={traveler.id} className="p-4 border border-zinc-150 rounded-2xl bg-zinc-50/50 space-y-3.5 relative">
              {travelers.length > 1 && (
                <button
                  onClick={() => removeTraveler(traveler.id)}
                  className="absolute top-3 right-3 text-red-500 hover:text-red-700 font-bold text-xs"
                >
                  Remove
                </button>
              )}

              <div>
                <label className="block text-[10px] font-bold text-zinc-650 mb-1.5 uppercase tracking-wider">
                  Guest {index + 1} Name
                </label>
                <input
                  type="text"
                  required
                  value={traveler.name}
                  onChange={(e) => handleTravelerNameChange(traveler.id, e.target.value)}
                  placeholder="Enter Guest's full name"
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-blue-500 bg-white font-bold outline-none text-xs text-zinc-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-650 mb-1.5 uppercase tracking-wider">
                  Passport Document
                </label>
                
                {traveler.fileName ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between text-xs font-bold text-emerald-800">
                    <span>📄 {traveler.fileName}</span>
                    <button
                      onClick={() => setTravelers(travelers.map(t => t.id === traveler.id ? { ...t, file: null, fileName: null } : t))}
                      className="text-emerald-600 hover:underline"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="relative group">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileChange(traveler.id, e)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                    />
                    <div className="w-full py-6 border-2 border-dashed border-zinc-200 group-hover:border-blue-400 group-hover:bg-blue-50/10 rounded-2xl bg-white text-zinc-450 font-bold text-xs flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-150">
                      <div className="w-9 h-9 rounded-xl bg-zinc-50 border border-zinc-150 flex items-center justify-center text-zinc-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors duration-150">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <div className="text-center leading-none">
                        <span className="block text-zinc-750 text-[10px] font-black uppercase tracking-wider">Upload Passport</span>
                        <span className="block text-zinc-400 text-[9px] font-semibold mt-1">Drag & drop or click to browse</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add another guest */}
        <button
          onClick={addAnotherTraveler}
          className="w-full py-3 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-2xl font-bold text-xs transition-colors"
        >
          Add Another Guest
        </button>

        {/* Action trigger */}
        <button
          onClick={handleSubmitClick}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/10 active:scale-[0.98] transition-all text-xs cursor-pointer"
        >
          Submit Verification
        </button>

      </div>
    </div>
  );
}
