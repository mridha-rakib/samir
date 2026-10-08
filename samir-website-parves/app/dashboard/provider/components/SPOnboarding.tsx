import React, { useState } from "react";
import Image from "next/image";

interface SPOnboardingProps {
  onSaveFirstService: (serviceData: {
    name: string;
    type: string;
    price: number;
    duration: string;
    description: string;
    isActive: boolean;
    coverImage?: File | null;
  }) => void;
  onFinishOnboarding: () => void;
  triggerNotification: (msg: string, type?: "success" | "error") => void;
}

export default function SPOnboarding({
  onSaveFirstService,
  onFinishOnboarding,
  triggerNotification,
}: SPOnboardingProps) {
  const [step, setStep] = useState<"welcome" | "add-service" | "congrats">("welcome");

  // Form states
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceType, setNewServiceType] = useState("Cleaning");
  const [newServicePrice, setNewServicePrice] = useState("50");
  const [newServiceDuration, setNewServiceDuration] = useState("3 Hours");
  const [newServiceDesc, setNewServiceDesc] = useState("");
  const [newServiceActive, setNewServiceActive] = useState(true);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) {
      triggerNotification("Please enter a service name", "error");
      return;
    }
    onSaveFirstService({
      name: newServiceName.trim(),
      type: newServiceType,
      price: parseFloat(newServicePrice) || 50,
      duration: newServiceDuration,
      description: newServiceDesc.trim(),
      isActive: newServiceActive,
      coverImage: coverImageFile,
    });
    setStep("congrats");
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-screen bg-zinc-100 w-full animate-fadeIn text-left">
      {step === "welcome" && (
        <>
          {/* Left panel */}
          <div className="relative hidden md:flex flex-1 flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-12 text-white lg:p-16">
            <div className="z-10 flex items-center gap-3">
              <div className="relative h-12 w-12 rounded-xl bg-white/10 p-2 backdrop-blur-md transition-transform duration-300 hover:scale-105">
                <Image src="/Logo.png" alt="Hostibook Logo" fill priority className="object-contain p-1" />
              </div>
              <span className="text-2xl font-bold tracking-tight">Hostibook</span>
            </div>

            <div className="relative z-10 flex flex-1 flex-col items-center justify-center py-6 text-center">
              <h2 className="text-3xl font-extrabold tracking-tight mb-4 text-white">Start Earning Today</h2>
              <p className="text-lg text-blue-100/90 font-medium leading-relaxed max-w-md">
                Offer your premium services directly to property owners in your area and unlock automated payouts.
              </p>
            </div>

            <div className="z-10 text-xs text-white/60 font-medium">Welcome Service Provider Portal</div>
            
            <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-blue-500/25 blur-3xl" />
            <div className="absolute -right-20 -bottom-20 h-85 w-85 rounded-full bg-indigo-500/25 blur-3xl" />
          </div>

          {/* Right panel */}
          <div className="flex flex-col justify-center items-center w-full bg-white md:w-[480px] lg:w-[560px] p-6 sm:p-10 md:p-12">
            <div className="w-full max-w-[420px] text-center flex flex-col justify-between h-full max-h-[600px] py-8">
              <div className="flex flex-col items-center mb-6 md:hidden">
                <div className="relative h-12 w-12 rounded-xl bg-blue-50 p-2.5 shadow-sm mb-3">
                  <Image src="/Logo.png" alt="Hostibook Logo" fill className="object-contain p-0.5" />
                </div>
                <h1 className="text-xl font-bold text-blue-600">Hostibook</h1>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">Welcome to Hostibook!</h1>
                <p className="mt-3 text-sm font-semibold text-zinc-400 max-w-xs mx-auto leading-relaxed">
                  Start earning by offering your premium services to property owners in your area.
                </p>
              </div>

              <div className="hidden md:block my-8 space-y-4 text-left border-y border-zinc-100 py-6">
                {[
                  "Receive high-paying local bookings",
                  "Manage service listings and active status",
                  "Automated payments processed via Stripe",
                  "Submit proof-of-work video for instant payouts",
                ].map((text, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 shadow-sm">
                      ✓
                    </div>
                    <span className="text-sm font-bold text-zinc-700">{text}</span>
                  </div>
                ))}
              </div>

              <div className="mt-auto">
                <button
                  onClick={() => setStep("add-service")}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/10 active:scale-[0.99] transition-all text-sm cursor-pointer"
                >
                  Add My First Service
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {step === "add-service" && (
        <div className="flex-1 flex flex-col justify-center items-center px-4 py-12">
          <div className="w-full max-w-[480px] bg-white border border-zinc-150 rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col relative text-left">
            <button
              onClick={() => setStep("welcome")}
              className="absolute top-6 left-6 p-2 rounded-full hover:bg-zinc-100 text-zinc-650 transition-colors"
              aria-label="Go back"
            >
              ← Back
            </button>

            <div className="text-center mt-6 mb-6">
              <h1 className="text-xl font-black text-zinc-950 uppercase tracking-wide">Add a Service</h1>
              <p className="text-xs font-bold text-zinc-400 mt-1 uppercase tracking-wider">Set up your first listing</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">Service Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deep Kitchen Cleansing"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-blue-500 bg-zinc-50/50 outline-none text-xs font-bold text-zinc-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">Cover Image</label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 flex flex-col items-center justify-center border border-dashed border-zinc-300 rounded-xl bg-zinc-50/50 cursor-pointer hover:border-blue-500 transition-colors w-full aspect-[16/9] relative overflow-hidden">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          setCoverImageFile(file);
                          setCoverPreview(URL.createObjectURL(file));
                        }
                      }}
                      className="hidden"
                    />
                    {coverPreview ? (
                      <div className="absolute inset-0 w-full h-full">
                        <img src={coverPreview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center text-xs font-extrabold text-white">
                          Change Image
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-4">
                        <svg className="w-8 h-8 text-zinc-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-[10px] font-bold text-zinc-500">Upload Cover Image (16:9 Landscape)</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">Service Type</label>
                  <select
                    value={newServiceType}
                    onChange={(e) => setNewServiceType(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-blue-500 bg-zinc-50/50 outline-none text-xs font-bold text-zinc-850"
                  >
                    <option>Cleaning</option>
                    <option>Plumbing</option>
                    <option>Electrical</option>
                    <option>Gardening</option>
                    <option>Security</option>
                    <option>Others</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">Price (USD)</label>
                  <input
                    type="number"
                    required
                    placeholder="50"
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-blue-500 bg-zinc-50/50 outline-none text-xs font-bold text-zinc-805 text-zinc-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">Duration</label>
                <select
                  value={newServiceDuration}
                  onChange={(e) => setNewServiceDuration(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-blue-500 bg-zinc-50/50 outline-none text-xs font-bold text-zinc-800"
                >
                  <option>1 Hour</option>
                  <option>2 Hours</option>
                  <option>3 Hours</option>
                  <option>Half Day</option>
                  <option>Full Day</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">Description</label>
                <textarea
                  required
                  placeholder="Describe your service..."
                  rows={2}
                  value={newServiceDesc}
                  onChange={(e) => setNewServiceDesc(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-blue-500 bg-zinc-50/50 outline-none text-xs font-bold text-zinc-800 resize-none"
                />
              </div>

              <div className="flex items-center justify-between p-3 border border-zinc-150 bg-zinc-50/30 rounded-2xl">
                <span className="text-[11px] font-bold text-zinc-650">Service Active Immediately</span>
                <button
                  type="button"
                  onClick={() => setNewServiceActive(!newServiceActive)}
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${newServiceActive ? 'bg-emerald-500' : 'bg-zinc-200'}`}
                >
                  <span className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${newServiceActive ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/10 transition-colors text-sm mt-2 cursor-pointer"
              >
                Save & Continue
              </button>
            </form>
          </div>
        </div>
      )}

      {step === "congrats" && (
        <>
          {/* Left panel */}
          <div className="relative hidden md:flex flex-1 flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 p-12 text-white lg:p-16">
            <div className="z-10 flex items-center gap-3">
              <div className="relative h-12 w-12 rounded-xl bg-white/10 p-2 backdrop-blur-md transition-transform duration-300 hover:scale-105">
                <Image src="/Logo.png" alt="Hostibook Logo" fill priority className="object-contain p-1" />
              </div>
              <span className="text-2xl font-bold tracking-tight">Hostibook</span>
            </div>

            <div className="relative z-10 flex flex-1 flex-col items-center justify-center py-6 text-center">
              <h2 className="text-3xl font-extrabold tracking-tight mb-4 text-white">You're All Set!</h2>
              <p className="text-lg text-emerald-100/90 font-medium leading-relaxed max-w-md">
                Your service has been submitted for review. Get ready to receive your first bookings.
              </p>
            </div>

            <div className="z-10 text-xs text-white/60 font-medium">Service Provider Verified Onboarding</div>
            <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
          </div>

          {/* Right panel */}
          <div className="flex flex-col justify-center items-center w-full bg-white md:w-[480px] lg:w-[560px] p-6 sm:p-10 md:p-12 text-center">
            <div className="w-full max-w-[420px] flex flex-col justify-between h-full max-h-[600px] py-8">
              <div className="flex flex-col items-center mb-2">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100 shadow-sm mb-4">
                  ✓
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">Congratulations!</h1>
              </div>

              <p className="text-sm font-semibold text-zinc-400 leading-relaxed">
                You've successfully created your first service.
              </p>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3.5 text-left my-6">
                <div className="flex-1">
                  <p className="text-xs font-bold text-amber-800 leading-tight">Verification Period</p>
                  <p className="text-[11px] font-medium text-amber-700 mt-1 leading-normal">
                    To protect our community, our team is currently reviewing your service details. It will go public once approved.
                  </p>
                </div>
              </div>

              <div className="mt-auto">
                <button
                  onClick={onFinishOnboarding}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/10 active:scale-[0.99] transition-all text-sm cursor-pointer"
                >
                  Go to My Dashboard
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
