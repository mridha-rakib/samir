import React from "react";

interface LocationModalsProps {
  showLocationRequiredModal: boolean;
  setShowLocationRequiredModal: (val: boolean) => void;
  showPermissionDeniedModal: boolean;
  setShowPermissionDeniedModal: (val: boolean) => void;
  checkLocationAndRequest: () => void;
  triggerNotification: (msg: string, type?: "success" | "error") => void;
}

export default function LocationModals({
  showLocationRequiredModal,
  setShowLocationRequiredModal,
  showPermissionDeniedModal,
  setShowPermissionDeniedModal,
  checkLocationAndRequest,
  triggerNotification,
}: LocationModalsProps) {
  return (
    <>
      {/* OVERLAY MODAL: LOCATION REQUIRED */}
      {showLocationRequiredModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
          <div className="w-full max-w-[360px] bg-white border border-zinc-200 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
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
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h3 className="font-black text-lg text-zinc-955">
              Location Required
            </h3>
            <p className="text-xs font-semibold text-zinc-500 leading-relaxed">
              Please enable location services to pin your property accurately on
              the map.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowLocationRequiredModal(false);
                  triggerNotification(
                    "Location permission is required to add property",
                    "error"
                  );
                }}
                className="flex-1 py-3 border border-zinc-200 text-zinc-500 rounded-xl font-bold text-xs hover:bg-zinc-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLocationRequiredModal(false);
                  checkLocationAndRequest();
                }}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs cursor-pointer"
              >
                Turn On
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY MODAL: PERMISSION DENIED */}
      {showPermissionDeniedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
          <div className="w-full max-w-[360px] bg-white border border-zinc-200 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-650 flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="font-black text-lg text-zinc-955">
              Permission Denied
            </h3>
            <p className="text-xs font-semibold text-zinc-500 leading-relaxed">
              Location permission is permanently denied. Please enable it from
              App Settings to pin your property.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowPermissionDeniedModal(false);
                  triggerNotification(
                    "Location permission is required to add property",
                    "error"
                  );
                }}
                className="flex-1 py-3 border border-zinc-200 text-zinc-500 rounded-xl font-bold text-xs hover:bg-zinc-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPermissionDeniedModal(false);
                  triggerNotification(
                    "Please enable location access in your browser settings.",
                    "error"
                  );
                }}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs cursor-pointer"
              >
                Open Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
