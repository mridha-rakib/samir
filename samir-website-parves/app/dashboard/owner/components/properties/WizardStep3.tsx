import React from "react";
import { CheckIcon, MapPinIcon } from "../Icons";

interface WizardStep3Props {
  onBack: () => void;
  onSave: () => void;
  isLoadingSingleProperty: boolean;
  singlePropertyResponse: any;

  // Local tips categories
  localTipCategories: string[];
  categoryToggleState: Record<string, boolean>;
  setCategoryToggleState: (val: Record<string, boolean>) => void;

  // Airbnb Sync
  airbnbUrlInput: string;
  setAirbnbUrlInput: (val: string) => void;
  isAirbnbSyncedLocal: boolean;
  handleSyncAirbnb: () => void;
  isUpdatingHotel: boolean;
  isUpdatingCategory: boolean;

  // ICS Export
  isExportVisible: boolean;
  isLinkCopied: boolean;
  setIsLinkCopied: (val: boolean) => void;
  currentPropertyId: string;

  triggerNotification: (msg: string, type?: "success" | "error") => void;
}

export default function WizardStep3({
  onBack,
  onSave,
  isLoadingSingleProperty,
  singlePropertyResponse,
  localTipCategories,
  categoryToggleState,
  setCategoryToggleState,
  airbnbUrlInput,
  setAirbnbUrlInput,
  isAirbnbSyncedLocal,
  handleSyncAirbnb,
  isUpdatingHotel,
  isUpdatingCategory,
  isExportVisible,
  isLinkCopied,
  setIsLinkCopied,
  currentPropertyId,
  triggerNotification,
}: WizardStep3Props) {
  return (
    <div className="space-y-6 text-left">
      <h3 className="text-lg font-black tracking-tight text-zinc-950">
        Confirm Property Details
      </h3>
      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
        Step 3 of 3 – Basic Information
      </p>

      {isLoadingSingleProperty ? (
        <div className="py-12 text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-zinc-400 font-bold mt-2">
            Loading details...
          </p>
        </div>
      ) : singlePropertyResponse?.data ? (
        <div className="space-y-5">
          {/* Property Photos scroll */}
          <div>
            <span className="block text-[10px] uppercase text-zinc-400 font-bold mb-2">
              Property Photos
            </span>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {singlePropertyResponse.data.uploadPhotosOrVideos?.map(
                (photo: string, index: number) => (
                  <img
                    key={index}
                    src={photo}
                    alt={`Property ${index}`}
                    className="h-32 w-48 object-cover rounded-xl border border-zinc-200 shadow-sm shrink-0"
                  />
                )
              )}
            </div>
          </div>

          <div>
            <h4 className="text-xl font-black text-zinc-900 leading-tight">
              {singlePropertyResponse.data.propertyTitle}
            </h4>
            <p className="mt-1 text-xs text-zinc-400 font-bold flex items-center gap-1">
              <MapPinIcon />
              {singlePropertyResponse.data.propertyAddress}
            </p>
          </div>

          <div className="text-xs text-zinc-650 leading-relaxed font-bold border-t border-zinc-200 pt-3 text-left">
            <span className="block text-[10px] uppercase text-zinc-400 mb-1">
              Description
            </span>
            {singlePropertyResponse.data.propertyDescription}
          </div>

          <div className="flex flex-wrap gap-4 text-xs font-bold text-zinc-500 border-t border-zinc-200 pt-3">
            <span>👥 {singlePropertyResponse.data.maxGuests} Guests</span>
            <span>🛏️ {singlePropertyResponse.data.bedrooms} Bedrooms</span>
            <span>🛁 {singlePropertyResponse.data.bathrooms} Bathrooms</span>
          </div>

          <div className="border-t border-zinc-200 pt-3">
            <span className="block text-[10px] uppercase text-zinc-400 mb-2 font-bold">
              Amenities
            </span>
            <div className="flex flex-wrap gap-1.5">
              {singlePropertyResponse.data.amenities?.map((a: string) => (
                <span
                  key={a}
                  className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black border border-blue-100"
                >
                  {a}
                </span>
              ))}
            </div>
          </div>

          {/* Local tips selection categories toggles */}
          {localTipCategories.length > 0 && (
            <div className="border-t border-zinc-200 pt-3 space-y-3">
              <span className="block text-[10px] uppercase text-zinc-400 font-bold mb-1.5">
                Select Local Tips Categories
              </span>
              <div className="space-y-3">
                {localTipCategories.map((category) => (
                  <div
                    key={category}
                    className="flex justify-between items-center p-3 border border-zinc-150 rounded-xl bg-zinc-50"
                  >
                    <span className="text-xs font-bold text-zinc-700">
                      {category}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={categoryToggleState[category] !== false}
                        onChange={() => {
                          setCategoryToggleState({
                            ...categoryToggleState,
                            [category]: categoryToggleState[category] === false,
                          });
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* House Rules */}
          {singlePropertyResponse.data.houseRules && (
            <div className="border-t border-zinc-200 pt-3 text-left">
              <span className="block text-[10px] uppercase text-zinc-400 font-bold mb-2">
                House Rules
              </span>
              <div className="border border-zinc-200 rounded-2xl overflow-hidden shadow-sm h-60 max-w-md bg-zinc-50">
                <img
                  src={singlePropertyResponse.data.houseRules}
                  alt="House Rules"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}

          {/* Guard Card */}
          {singlePropertyResponse.data.guards && (
            <div className="border border-zinc-200 p-4 rounded-2xl bg-white flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-200 shrink-0 relative overflow-hidden">
                  <img
                    src={
                      singlePropertyResponse.data.guards.photo ||
                      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80"
                    }
                    alt="Guard"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900">
                    {singlePropertyResponse.data.guards.name}
                  </h4>
                  <p className="text-[10px] text-zinc-400 font-bold">
                    {singlePropertyResponse.data.guards.phone}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-extrabold border border-emerald-100 flex items-center gap-1">
                  Available
                </span>
                {singlePropertyResponse.data.guards.whatsapp && (
                  <a
                    href={`https://wa.me/${singlePropertyResponse.data.guards.whatsapp.replace(
                      /\+/g,
                      ""
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full transition-all"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.665.989 3.3 1.503 4.94 1.505 5.548 0 10.064-4.512 10.068-10.066.002-2.69-1.043-5.22-2.943-7.12C16.854 1.671 14.327.625 11.641.625c-5.552 0-10.07 4.513-10.074 10.068-.002 1.83.479 3.619 1.393 5.181L1.96 21.847l6.096-1.599c.001-.001.001-.001.001-.001z" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Sync with Airbnb */}
          <div className="border border-zinc-200 p-4 rounded-3xl bg-zinc-50/50 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-black text-zinc-800">
                Sync with Airbnb
              </span>
              {isAirbnbSyncedLocal ? (
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-extrabold border border-blue-100 flex items-center gap-1">
                  ✓ Calendar synced
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-zinc-150 text-zinc-500 text-[10px] font-extrabold">
                  Not Synced
                </span>
              )}
            </div>

            {!isAirbnbSyncedLocal ? (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Paste your airbnb ical link here"
                  value={airbnbUrlInput}
                  onChange={(e) => setAirbnbUrlInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-zinc-200 focus:border-blue-500 bg-white outline-none text-xs font-bold"
                />
                <button
                  type="button"
                  onClick={handleSyncAirbnb}
                  disabled={isUpdatingHotel}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isUpdatingHotel ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Syncing...
                    </>
                  ) : (
                    "Sync"
                  )}
                </button>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-2xl flex items-center gap-2 border border-emerald-100">
                <CheckIcon />
                Airbnb Integration Active
              </div>
            )}

            {/* Export property section */}
            {isExportVisible && (
              <div className="border-t border-zinc-200 pt-4 space-y-3 text-left">
                <span className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                  Export Property
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${process.env.NEXT_PUBLIC_URL}/hotels/${currentPropertyId}/calendar.ics`}
                    className="flex-1 px-3 py-2.5 rounded-xl border border-zinc-250 bg-white outline-none text-xs font-bold cursor-default overflow-hidden text-ellipsis whitespace-nowrap"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${process.env.NEXT_PUBLIC_URL}/hotels/${currentPropertyId}/calendar.ics`
                      );
                      setIsLinkCopied(true);
                      triggerNotification("Link copied to clipboard!", "success");
                    }}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

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
          onClick={onSave}
          disabled={isUpdatingCategory}
          className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/10 transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          {isUpdatingCategory ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Finalizing...
            </>
          ) : (
            "Save Property"
          )}
        </button>
      </div>
    </div>
  );
}
