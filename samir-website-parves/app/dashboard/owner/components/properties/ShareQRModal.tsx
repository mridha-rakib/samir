import React from "react";

interface ShareQRModalProps {
  property: any | null;
  onClose: () => void;
  triggerNotification: (msg: string, type?: "success" | "error") => void;
}

export default function ShareQRModal({
  property,
  onClose,
  triggerNotification,
}: ShareQRModalProps) {
  if (!property) return null;

  // Generate a minimal, clean URL for the QR code so guests can navigate directly
  const getPropertyUrl = (prop: any) => {
    if (!prop) return "https://hostibook.com";
    const id = prop.id || prop._id || "";
    return `https://hostibook.com/property/${id}`;
  };

  const handleDownloadQR = async () => {
    try {
      const propertyUrl = getPropertyUrl(property);
      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&format=png&data=${encodeURIComponent(propertyUrl)}`;
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${(property.propertyTitle || "Property").replace(/\s+/g, "_")}_QR.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      triggerNotification("QR Code downloaded successfully!", "success");
    } catch (error) {
      triggerNotification("Failed to download QR code", "error");
    }
  };

  const handleShareQR = async () => {
    const propertyUrl = getPropertyUrl(property);
    if (navigator.share) {
      try {
        await navigator.share({
          title: property.propertyTitle || "Property Details",
          text: `View property details: ${property.propertyTitle || ""}`,
          url: propertyUrl,
        });
        triggerNotification("Property link shared successfully!", "success");
      } catch (e) {
        navigator.clipboard.writeText(propertyUrl);
        triggerNotification("Property link copied to clipboard!", "success");
      }
    } else {
      navigator.clipboard.writeText(propertyUrl);
      triggerNotification("Property link copied to clipboard!", "success");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
      <div className="w-full max-w-[380px] bg-white border border-zinc-200 rounded-3xl p-6 shadow-2xl space-y-6 text-center relative">
        <div className="flex justify-between items-center pb-2 border-b border-zinc-150">
          <h3 className="font-black text-base text-zinc-950">
            Share via QR Code
          </h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-650 font-extrabold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* QR Code Frame */}
        <div className="flex flex-col items-center gap-2 p-4 bg-white border border-zinc-200 rounded-2xl mx-auto">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&format=png&data=${encodeURIComponent(
              getPropertyUrl(property)
            )}`}
            alt="Property QR Code"
            className="w-48 h-48"
          />
          <p className="text-[10px] text-zinc-400 font-semibold break-all text-center max-w-[180px] truncate">
            {getPropertyUrl(property)}
          </p>
        </div>

        <p className="text-xs text-zinc-500 font-bold leading-relaxed">
          Guests can scan this QR to view property details and rules.
        </p>

        <div className="space-y-3 pt-2">
          <button
            onClick={handleShareQR}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-md text-xs cursor-pointer flex items-center justify-center gap-1.5"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M8.684 10.742l4.636-2.318m0 4.152l-4.636-2.318M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Share property QR
          </button>
          <button
            onClick={handleDownloadQR}
            className="w-full py-3 border-2 border-blue-600 hover:bg-blue-50 text-blue-600 rounded-2xl font-bold text-xs cursor-pointer"
          >
            Download QR
          </button>
        </div>
      </div>
    </div>
  );
}
