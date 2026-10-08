import React from "react";
import { ShieldLockIcon } from "../Icons";

interface SecurityModalProps {
  show: boolean;
  onClose: () => void;
  smartLockCode: string;
  setSmartLockCode: (val: string) => void;
  keyBoxPin: string;
  setKeyBoxPin: (val: string) => void;
  wifiPassword: string;
  setWifiPassword: (val: string) => void;
  confirmCodes: boolean;
  setConfirmCodes: (val: boolean) => void;
  setAreSecurityKeysAdded: (val: boolean) => void;
  triggerNotification: (msg: string, type?: "success" | "error") => void;
}

export default function SecurityModal({
  show,
  onClose,
  smartLockCode,
  setSmartLockCode,
  keyBoxPin,
  setKeyBoxPin,
  wifiPassword,
  setWifiPassword,
  confirmCodes,
  setConfirmCodes,
  setAreSecurityKeysAdded,
  triggerNotification,
}: SecurityModalProps) {
  if (!show) return null;

  const handleSave = () => {
    if (!smartLockCode.trim() || !keyBoxPin.trim() || !wifiPassword.trim()) {
      triggerNotification(
        "Please fill in all security codes and Wi-Fi password",
        "error"
      );
      return;
    }
    if (smartLockCode.trim().length < 4) {
      triggerNotification(
        "Smart Lock Code must be at least 4 characters",
        "error"
      );
      return;
    }
    if (keyBoxPin.trim().length < 4) {
      triggerNotification(
        "Key Box PIN must be at least 4 characters",
        "error"
      );
      return;
    }
    if (wifiPassword.trim().length < 4) {
      triggerNotification(
        "Wifi password must be at least 4 characters",
        "error"
      );
      return;
    }
    if (!confirmCodes) {
      triggerNotification("Please confirm details", "error");
      return;
    }
    setAreSecurityKeysAdded(true);
    onClose();
    triggerNotification("Security codes configured successfully!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
      <div className="w-full max-w-[360px] bg-white border border-zinc-200 rounded-3xl p-6 shadow-2xl space-y-5">
        <h3 className="text-center font-black text-base text-zinc-950">
          Security Access Setup
        </h3>

        <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-start gap-2.5 text-left">
          <ShieldLockIcon />
          <p className="text-[10px] font-semibold text-blue-800 leading-normal">
            Your codes and Wi-Fi password are encrypted and only visible to confirmed guests.
            Please enter accurate access information to ensure check-in runs
            smoothly.
          </p>
        </div>

        <div className="space-y-3 text-left">
          <div>
            <label className="block text-[10px] font-bold text-zinc-700 mb-1 uppercase tracking-wider">
              Smart Lock Code
            </label>
            <input
              type="text"
              placeholder="e.g. 5678"
              value={smartLockCode}
              onChange={(e) => setSmartLockCode(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50/50 outline-none text-xs font-bold"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-700 mb-1 uppercase tracking-wider">
              Key Box PIN
            </label>
            <input
              type="text"
              placeholder="e.g. 3456"
              value={keyBoxPin}
              onChange={(e) => setKeyBoxPin(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50/50 outline-none text-xs font-bold"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-700 mb-1 uppercase tracking-wider">
              Wi-Fi Password
            </label>
            <input
              type="text"
              placeholder="e.g. 12345"
              value={wifiPassword}
              onChange={(e) => setWifiPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50/50 outline-none text-xs font-bold"
            />
          </div>
        </div>

        <div className="flex items-start gap-2 text-left">
          <input
            type="checkbox"
            id="codesConfirm"
            checked={confirmCodes}
            onChange={(e) => setConfirmCodes(e.target.checked)}
            className="mt-0.5 rounded text-blue-600"
          />
          <label
            htmlFor="codesConfirm"
            className="text-[10px] font-bold text-zinc-500 leading-normal"
          >
            I confirm these access details are correct.
          </label>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 border border-zinc-200 text-zinc-500 rounded-2xl font-bold text-xs hover:bg-zinc-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-md text-xs cursor-pointer"
          >
            Save & Continue
          </button>
        </div>
      </div>
    </div>
  );
}
