import React, { useState, useRef, useEffect } from "react";
import { ShieldLockIcon, TrashIcon } from "../Icons";

interface WizardStep1Props {
  onNext: () => void;
  isLoading: boolean;

  // Basic Info States
  propTitle: string;
  setPropTitle: (val: string) => void;
  propLocation: string;
  setPropLocation: (val: string) => void;
  latitude: string;
  setLatitude: (val: string) => void;
  longitude: string;
  setLongitude: (val: string) => void;
  propDesc: string;
  setPropDesc: (val: string) => void;

  // Upload States
  propImageFiles: File[];
  setPropImageFiles: (files: File[]) => void;
  propImagePreviews: string[];
  setPropImagePreviews: (urls: string[]) => void;
  houseRulesFile: File | null;
  setHouseRulesFile: (file: File | null) => void;
  houseRulesPreview: string | null;
  setHouseRulesPreview: (url: string | null) => void;

  // Capacity counters
  propMaxGuests: number;
  setPropMaxGuests: (val: number) => void;
  propBedrooms: number;
  setPropBedrooms: (val: number) => void;
  propBathrooms: number;
  setPropBathrooms: (val: number) => void;

  // Amenities
  propAmenities: string[];
  setPropAmenities: (val: string[]) => void;

  // Inventory
  propInventory: any[];
  onOpenInventoryModal: () => void;

  // Security Access
  areSecurityKeysAdded: boolean;
  onOpenSecurityModal: () => void;
  smartLockCode: string;
  keyBoxPin: string;
  wifiPassword: string;
  setWifiPassword: (val: string) => void;

  // Indoor Facilities
  savedFacilities: any[];
  onOpenFacilityModal: () => void;
  onDeleteFacility: (index: number) => void;

  // Pricing & Calendar
  basePrice: string;
  setBasePrice: (val: string) => void;
  customPrices: any[];
  setCustomPrices: (val: any[]) => void;
  weeklyOffer: boolean;
  setWeeklyOffer: (val: boolean) => void;
  weeklyOfferRate: string;
  setWeeklyOfferRate: (val: string) => void;
  monthlyOffer: boolean;
  setMonthlyOffer: (val: boolean) => void;
  monthlyOfferRate: string;
  setMonthlyOfferRate: (val: string) => void;
  availableForBooking: boolean;
  setAvailableForBooking: (val: boolean) => void;

  // Geolocation Modals triggers
  setShowLocationRequiredModal: (val: boolean) => void;
  setShowPermissionDeniedModal: (val: boolean) => void;

  // Airbnb sync props
  syncWithAirbnb: boolean;
  setSyncWithAirbnb: (val: boolean) => void;
  airbnbIcalUrl: string;
  setAirbnbIcalUrl: (val: string) => void;

  triggerNotification: (msg: string, type?: "success" | "error") => void;
}

export default function WizardStep1({
  onNext,
  isLoading,
  propTitle,
  setPropTitle,
  propLocation,
  setPropLocation,
  latitude,
  setLatitude,
  longitude,
  setLongitude,
  propDesc,
  setPropDesc,
  // Upload States
  propImageFiles,
  setPropImageFiles,
  propImagePreviews,
  setPropImagePreviews,
  houseRulesFile,
  setHouseRulesFile,
  houseRulesPreview,
  setHouseRulesPreview,
  propMaxGuests,
  setPropMaxGuests,
  propBedrooms,
  setPropBedrooms,
  propBathrooms,
  setPropBathrooms,
  propAmenities,
  setPropAmenities,
  propInventory,
  onOpenInventoryModal,
  areSecurityKeysAdded,
  onOpenSecurityModal,
  smartLockCode,
  keyBoxPin,
  wifiPassword,
  setWifiPassword,
  savedFacilities,
  onOpenFacilityModal,
  onDeleteFacility,
  basePrice,
  setBasePrice,
  customPrices,
  setCustomPrices,
  weeklyOffer,
  setWeeklyOffer,
  weeklyOfferRate,
  setWeeklyOfferRate,
  monthlyOffer,
  setMonthlyOffer,
  monthlyOfferRate,
  setMonthlyOfferRate,
  availableForBooking,
  setAvailableForBooking,
  setShowLocationRequiredModal,
  setShowPermissionDeniedModal,
  triggerNotification,
  syncWithAirbnb,
  setSyncWithAirbnb,
  airbnbIcalUrl,
  setAirbnbIcalUrl,
}: WizardStep1Props) {
  const [newAmenity, setNewAmenity] = useState("");
  const [showSmartLockInMain, setShowSmartLockInMain] = useState(false);
  const [showKeyBoxInMain, setShowKeyBoxInMain] = useState(false);
  const [isWifiVisible, setIsWifiVisible] = useState(false);

  // Local Custom Pricing Range states
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [customPriceVal, setCustomPriceVal] = useState("");

  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const loadGoogleMaps = (callback: () => void) => {
    if ((window as any).google?.maps) {
      callback();
      return;
    }
    const existing = document.getElementById("gmap-script");
    if (existing) {
      existing.addEventListener("load", callback);
      return;
    }
    const script = document.createElement("script");
    script.id = "gmap-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&libraries=places`;
    script.async = true;
    script.onload = callback;
    document.head.appendChild(script);
  };

  const initMap = (defaultLat: number, defaultLng: number) => {
    if (!mapRef.current) return;
    const google = (window as any).google;
    const center = { lat: defaultLat, lng: defaultLng };
    const map = new google.maps.Map(mapRef.current, { center, zoom: 13 });
    mapInstance.current = map;
    const marker = new google.maps.Marker({
      position: center,
      map,
      draggable: true,
    });
    markerRef.current = marker;
    const geocoder = new google.maps.Geocoder();
    const resolve = (latLng: any) => {
      geocoder.geocode({ location: latLng }, (results: any, status: any) => {
        const addr =
          status === "OK" && results[0]
            ? results[0].formatted_address
            : `${latLng.lat().toFixed(5)}, ${latLng.lng().toFixed(5)}`;
        setLatitude(String(latLng.lat()));
        setLongitude(String(latLng.lng()));
        setPropLocation(addr);
      });
    };
    map.addListener("click", (e: any) => {
      marker.setPosition(e.latLng);
      resolve(e.latLng);
    });
    marker.addListener("dragend", (e: any) => {
      resolve(e.latLng);
    });
  };

  const checkLocationAndRequest = () => {
    if (!navigator.geolocation) {
      triggerNotification("Geolocation is not supported by this browser.", "error");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latVal = position.coords.latitude;
        const lngVal = position.coords.longitude;
        setLatitude(String(latVal));
        setLongitude(String(lngVal));
        loadGoogleMaps(() => {
          const google = (window as any).google;
          if (!google) return;
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode(
            { location: { lat: latVal, lng: lngVal } },
            (results: any, status: any) => {
              const addr =
                status === "OK" && results && results[0]
                  ? results[0].formatted_address
                  : `${latVal.toFixed(5)}, ${lngVal.toFixed(5)}`;
              setPropLocation(addr);
              triggerNotification("Location detected successfully!");
              if (mapInstance.current) {
                const newCenter = { lat: latVal, lng: lngVal };
                mapInstance.current.setCenter(newCenter);
                if (markerRef.current) {
                  markerRef.current.setPosition(newCenter);
                }
              }
            }
          );
        });
      },
      (error) => {
        console.error("Geolocation error:", error);
        if (error.code === error.PERMISSION_DENIED) {
          setShowPermissionDeniedModal(true);
        } else {
          setShowLocationRequiredModal(true);
        }
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    checkLocationAndRequest();
    setTimeout(() => {
      loadGoogleMaps(() => {
        if (!mapInstance.current) {
          initMap(Number(latitude || 23.8103), Number(longitude || 90.4125));
        }
      });
    }, 300);
  }, []);

  const handleAddAmenity = () => {
    if (newAmenity.trim() && !propAmenities.includes(newAmenity.trim())) {
      setPropAmenities([...propAmenities, newAmenity.trim()]);
      setNewAmenity("");
    }
  };

  const handleAddCustomPrice = () => {
    if (!customPriceVal.trim()) {
      triggerNotification("Please enter custom price value", "error");
      return;
    }
    if (!selectedStartDate || !selectedEndDate) return;

    const startStr = selectedStartDate.toISOString().split("T")[0];
    const endStr = selectedEndDate.toISOString().split("T")[0];

    setCustomPrices([
      ...customPrices,
      {
        startDate: startStr,
        endDate: endStr,
        price: customPriceVal,
        displayRange: `${startStr} to ${endStr}`,
      },
    ]);
    setSelectedStartDate(null);
    setSelectedEndDate(null);
    setCustomPriceVal("");
    triggerNotification("Custom price season added!");
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-black tracking-tight text-zinc-955 text-left">
        Basic Information
      </h3>

      {/* Photo & House Rules Upload */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
        <div>
          <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">
            Upload Photos/Videos *
          </label>
          {propImagePreviews.length === 0 ? (
            <label className="border-2 border-dashed border-zinc-200 hover:border-blue-400 group hover:bg-blue-50/10 rounded-3xl p-8 text-center bg-zinc-50/50 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 relative overflow-hidden h-40">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files) {
                    const filesArray = Array.from(e.target.files);
                    const newFiles = [...propImageFiles, ...filesArray];
                    const newPreviews = [
                      ...propImagePreviews,
                      ...filesArray.map((f) => URL.createObjectURL(f)),
                    ];
                    setPropImageFiles(newFiles);
                    setPropImagePreviews(newPreviews);
                  }
                }}
                className="hidden"
              />
              <svg
                className="w-10 h-10 text-zinc-350 group-hover:text-blue-500 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="text-xs font-bold text-zinc-550 group-hover:text-blue-600 transition-colors">
                Upload Photos/Videos
              </span>
            </label>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-2 h-40 items-center border border-zinc-200 rounded-3xl p-3 bg-zinc-50/20">
              {propImagePreviews.map((preview, index) => (
                <div
                  key={index}
                  className="relative h-32 w-28 rounded-2xl overflow-hidden shadow-sm shrink-0 group border border-zinc-200 bg-white"
                >
                  <img
                    src={preview}
                    alt={`Preview ${index}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newFiles = propImageFiles.filter((_, i) => i !== index);
                      const newPreviews = propImagePreviews.filter((_, i) => i !== index);
                      setPropImageFiles(newFiles);
                      setPropImagePreviews(newPreviews);
                    }}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500/85 hover:bg-red-650 text-white flex items-center justify-center font-bold text-xs shadow-sm transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ))}

              <label className="h-32 w-28 rounded-2xl border-2 border-dashed border-zinc-200 hover:border-blue-400 hover:bg-blue-50/10 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all shrink-0">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files) {
                      const filesArray = Array.from(e.target.files);
                      const newFiles = [...propImageFiles, ...filesArray];
                      const newPreviews = [
                        ...propImagePreviews,
                        ...filesArray.map((f) => URL.createObjectURL(f)),
                      ];
                      setPropImageFiles(newFiles);
                      setPropImagePreviews(newPreviews);
                    }
                  }}
                  className="hidden"
                />
                <svg
                  className="w-5 h-5 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">
                  Add More
                </span>
              </label>
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">
            Upload House Rules Image/PDF
          </label>
          <label className="border-2 border-dashed border-zinc-200 hover:border-zinc-350 rounded-3xl p-8 text-center bg-zinc-50/50 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 relative overflow-hidden h-40">
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  const file = e.target.files[0];
                  setHouseRulesFile(file);
                  setHouseRulesPreview(URL.createObjectURL(file));
                }
              }}
              className="hidden"
            />
            {houseRulesPreview ? (
              <div className="absolute inset-0 w-full h-full bg-zinc-100 flex items-center justify-center">
                {houseRulesFile?.type.includes("pdf") ? (
                  <span className="text-xs font-bold text-zinc-650">
                    PDF Document Uploaded
                  </span>
                ) : (
                  <img
                    src={houseRulesPreview}
                    alt="House Rules Preview"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            ) : (
              <>
                <svg
                  className="w-10 h-10 text-zinc-350"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="text-xs font-bold text-zinc-500">
                  Upload House Rules (Optional)
                </span>
              </>
            )}
          </label>
        </div>
      </div>

      {/* Title & Location */}
      <div className="space-y-4 text-left">
        <div>
          <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">
            Property Title
          </label>
          <input
            type="text"
            value={propTitle}
            onChange={(e) => setPropTitle(e.target.value)}
            placeholder="e.g., Sunrise Grand Hotel"
            className="w-full px-4 py-3.5 rounded-2xl border border-zinc-200 focus:border-blue-500 bg-zinc-50/50 outline-none text-sm font-bold"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">
            Location
          </label>
          <input
            type="text"
            readOnly
            placeholder="Location will be picked from map"
            value={propLocation}
            className="w-full px-4 py-3.5 rounded-2xl border border-zinc-200 focus:border-blue-500 bg-zinc-50/50 outline-none text-sm font-bold cursor-default"
          />
        </div>

        <div className="rounded-2xl overflow-hidden border border-zinc-200 shadow-sm mt-2 w-full h-80">
          <div ref={mapRef} className="w-full h-full" />
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">
            Property Address
          </label>
          <input
            type="text"
            placeholder="e.g., 24 Park Street, Dhaka"
            value={propLocation}
            onChange={(e) => setPropLocation(e.target.value)}
            className="w-full px-4 py-3.5 rounded-2xl border border-zinc-200 focus:border-blue-500 bg-zinc-50/50 outline-none text-sm font-bold"
          />
        </div>
      </div>

      {/* Description */}
      <div className="text-left">
        <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">
          Description / Notes
        </label>
        <textarea
          value={propDesc}
          onChange={(e) => setPropDesc(e.target.value)}
          placeholder="Write a short description"
          rows={3}
          className="w-full px-4 py-3.5 rounded-2xl border border-zinc-200 focus:border-blue-500 bg-zinc-50/50 outline-none text-sm font-bold resize-none"
        />
      </div>

      {/* Capacity settings counters */}
      <div className="p-5 border border-zinc-150 rounded-3xl bg-zinc-50/30 space-y-4 text-left">
        <h4 className="text-xs font-black text-zinc-500 uppercase tracking-wider">
          Capacity
        </h4>

        {[
          { label: "Max Guests", value: propMaxGuests, set: setPropMaxGuests },
          { label: "Bedrooms", value: propBedrooms, set: setPropBedrooms },
          { label: "Bathrooms", value: propBathrooms, set: setPropBathrooms },
        ].map((item, idx) => (
          <div
            key={idx}
            className="flex justify-between items-center text-sm font-bold text-zinc-700"
          >
            <span>{item.label}</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => item.set(Math.max(1, item.value - 1))}
                className="w-8 h-8 rounded-full border border-zinc-200 bg-white text-zinc-650 flex items-center justify-center hover:bg-zinc-50 cursor-pointer"
              >
                -
              </button>
              <span className="w-6 text-center">{item.value}</span>
              <button
                type="button"
                onClick={() => item.set(item.value + 1)}
                className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Amenities tags */}
      <div className="text-left">
        <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">
          Amenities
        </label>
        <div className="flex flex-wrap gap-2 mb-3">
          {propAmenities.map((am) => (
            <span
              key={am}
              className="px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold border border-blue-100 flex items-center gap-1.5"
            >
              {am}
              <button
                type="button"
                onClick={() =>
                  setPropAmenities(propAmenities.filter((a) => a !== am))
                }
                className="text-blue-400 hover:text-blue-600 font-black cursor-pointer"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newAmenity}
            onChange={(e) => setNewAmenity(e.target.value)}
            placeholder="Add custom amenity"
            className="px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 outline-none text-xs font-bold flex-1"
          />
          <button
            type="button"
            onClick={handleAddAmenity}
            className="px-4 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 cursor-pointer"
          >
            Add
          </button>
        </div>
      </div>

      {/* Inventory Checklist */}
      <div className="border-t border-zinc-150 pt-6 text-left">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-xs font-black text-zinc-500 uppercase tracking-wider">
            Inventory Checklist
          </h4>
          <button
            type="button"
            onClick={onOpenInventoryModal}
            className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
          >
            Manage Inventory ({propInventory.length} Items)
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {propInventory.slice(0, 3).map((item) => (
            <span
              key={item.name}
              className="px-3.5 py-1.5 rounded-full bg-zinc-100 text-zinc-650 text-xs font-bold border border-zinc-200"
            >
              {item.qty} {item.name}
            </span>
          ))}
          {propInventory.length > 3 && (
            <span className="px-3.5 py-1.5 rounded-full bg-zinc-50 text-zinc-400 text-xs font-bold border border-zinc-200">
              + {propInventory.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Security Keys Setup */}
      <div className="border-t border-zinc-150 pt-6 text-left">
        <h4 className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-1">
          Add Security Keys
        </h4>
        <p className="text-xs text-zinc-400 font-semibold mb-4">
          Enter the security key code or integrate your smart lock system
        </p>

        {!areSecurityKeysAdded ? (
          <button
            type="button"
            onClick={onOpenSecurityModal}
            className="w-full py-3.5 border-2 border-dashed border-blue-600 hover:bg-blue-50 text-blue-600 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ShieldLockIcon />+ Add Security Key
          </button>
        ) : (
          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-150 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-zinc-650">
                Keys Added
              </span>
              <button
                type="button"
                onClick={onOpenSecurityModal}
                className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
              >
                Edit Keys
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1">
                  Smart Lock Code
                </label>
                <div className="relative">
                  <input
                    type={showSmartLockInMain ? "text" : "password"}
                    readOnly
                    value={smartLockCode}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-white outline-none text-xs font-bold cursor-default pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSmartLockInMain(!showSmartLockInMain)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-650 cursor-pointer"
                  >
                    {showSmartLockInMain ? (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1">
                  Key Box PIN
                </label>
                <div className="relative">
                  <input
                    type={showKeyBoxInMain ? "text" : "password"}
                    readOnly
                    value={keyBoxPin}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-white outline-none text-xs font-bold cursor-default pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeyBoxInMain(!showKeyBoxInMain)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-650 cursor-pointer"
                  >
                    {showKeyBoxInMain ? (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Wifi Password field inline */}
      <div className="text-left relative border-t border-zinc-150 pt-6">
        <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">
          Wifi Password
        </label>
        <div className="relative">
          <input
            type={isWifiVisible ? "text" : "password"}
            value={wifiPassword}
            onChange={(e) => setWifiPassword(e.target.value)}
            placeholder="Enter your wifi password"
            className="w-full px-4 py-3.5 rounded-2xl border border-zinc-200 focus:border-blue-500 bg-zinc-50/50 outline-none text-sm font-bold pr-12"
          />
          <button
            type="button"
            onClick={() => setIsWifiVisible(!isWifiVisible)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-650 cursor-pointer"
          >
            {isWifiVisible ? (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Indoor Facilities */}
      <div className="border-t border-zinc-150 pt-6 text-left">
        <h4 className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-1">
          Indoor Facilities
        </h4>
        <p className="text-xs text-zinc-400 font-semibold mb-4">
          Tap the button below to mark facilities (e.g., Gym, Coffee) on your
          building roof directly on the map.
        </p>

        <button
          type="button"
          onClick={onOpenFacilityModal}
          className="w-full py-3.5 border-2 border-dashed border-blue-600 hover:bg-blue-50 text-blue-600 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
        >
          Add Indoor Facilities
        </button>

        {savedFacilities.length > 0 && (
          <div className="mt-4 space-y-3">
            {savedFacilities.map((facility, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-3 border border-zinc-150 bg-zinc-50/50 rounded-xl"
              >
                <div className="text-left">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 uppercase tracking-wider">
                    {facility.category}
                  </span>
                  <p className="text-xs font-bold text-zinc-800 mt-1">
                    {facility.subCategory}
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    {facility.floorInfo}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteFacility(index)}
                  className="p-1 hover:bg-zinc-100 rounded text-red-500 hover:text-red-700 cursor-pointer"
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pricing settings */}
      <div className="border-t border-zinc-150 pt-6 space-y-4 text-left">
        <h4 className="text-xs font-black text-zinc-500 uppercase tracking-wider">
          Pricing Management
        </h4>

        <div>
          <label className="block text-xs font-bold text-zinc-700 mb-1">
            Base Price (Sets default calendar price) *
          </label>
          <input
            type="number"
            placeholder="e.g. 120"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            className="w-full px-4 py-3.5 rounded-2xl border border-zinc-200 focus:border-blue-500 bg-zinc-50/50 outline-none text-sm font-bold"
          />
        </div>

        {/* Calendar simulation and custom price range inputs */}
        <div className="p-4 border border-zinc-150 rounded-2xl bg-zinc-50/30 space-y-3">
          <span className="block text-xs font-bold text-zinc-700">
            Custom pricing seasons
          </span>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={
                  selectedStartDate
                    ? selectedStartDate.toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  setSelectedStartDate(
                    e.target.value ? new Date(e.target.value) : null
                  )
                }
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white outline-none text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1">
                End Date
              </label>
              <input
                type="date"
                value={
                  selectedEndDate
                    ? selectedEndDate.toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  setSelectedEndDate(
                    e.target.value ? new Date(e.target.value) : null
                  )
                }
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white outline-none text-xs font-bold"
              />
            </div>
          </div>

          {selectedStartDate && selectedEndDate && (
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Custom price, e.g. 150"
                value={customPriceVal}
                onChange={(e) => setCustomPriceVal(e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-xl border border-zinc-200 bg-white outline-none text-xs font-bold"
              />
              <button
                type="button"
                onClick={handleAddCustomPrice}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Add Custom Price
              </button>
            </div>
          )}

          {customPrices.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-zinc-150">
              <span className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                Active Custom Price Ranges
              </span>
              {customPrices.map((price, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center text-xs font-bold text-zinc-650 bg-white p-2 border border-zinc-150 rounded-xl"
                >
                  <span>{price.displayRange}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">${price.price}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setCustomPrices(customPrices.filter((_, i) => i !== idx))
                      }
                      className="text-red-500 hover:text-red-700 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-700">
                Weekly offer
              </label>
              <input
                type="checkbox"
                checked={weeklyOffer}
                onChange={(e) => setWeeklyOffer(e.target.checked)}
                className="rounded text-blue-600 cursor-pointer"
              />
            </div>
            {weeklyOffer && (
              <div className="flex items-center gap-2 mt-1 animate-fade-in">
                <input
                  type="number"
                  placeholder="Discount percentage"
                  value={weeklyOfferRate}
                  onChange={(e) => setWeeklyOfferRate(e.target.value)}
                  className="w-32 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white outline-none text-xs font-bold"
                />
                <span className="text-xs text-zinc-400 font-bold">% of total price discount</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5 border-t border-zinc-100 pt-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-700">
                Monthly offer
              </label>
              <input
                type="checkbox"
                checked={monthlyOffer}
                onChange={(e) => setMonthlyOffer(e.target.checked)}
                className="rounded text-blue-600 cursor-pointer"
              />
            </div>
            {monthlyOffer && (
              <div className="flex items-center gap-2 mt-1 animate-fade-in">
                <input
                  type="number"
                  placeholder="Discount percentage"
                  value={monthlyOfferRate}
                  onChange={(e) => setMonthlyOfferRate(e.target.value)}
                  className="w-32 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white outline-none text-xs font-bold"
                />
                <span className="text-xs text-zinc-400 font-bold">% of total price discount</span>
              </div>
            )}
          </div>

            <div className="flex items-center justify-between border-t border-zinc-100 pt-2.5">
              <label className="text-xs font-bold text-zinc-700">
                Available for Booking
              </label>
              <input
                type="checkbox"
                checked={availableForBooking}
                onChange={(e) => setAvailableForBooking(e.target.checked)}
                className="rounded text-blue-600 cursor-pointer"
              />
            </div>

            <div className="border-t border-zinc-100 pt-2.5">
              <label className="flex items-center justify-between text-xs font-bold text-zinc-700">
                <span>Sync with Airbnb</span>
                <input
                  type="checkbox"
                  checked={syncWithAirbnb}
                  onChange={e => setSyncWithAirbnb(e.target.checked)}
                  className="rounded text-blue-600 cursor-pointer"
                />
              </label>
              {syncWithAirbnb && (
                <div className="mt-2">
                  <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1">
                    iCal URL (Airbnb Calendar)
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.airbnb.com/ical/..."
                    value={airbnbIcalUrl}
                    onChange={e => setAirbnbIcalUrl(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white outline-none text-xs font-bold"
                  />
                </div>
              )}
            </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={isLoading}
        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/10 active:scale-[0.99] transition-all text-sm mt-4 cursor-pointer flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Saving Details...
          </>
        ) : (
          "Next → Assign Guard"
        )}
      </button>
    </div>
  );
}
