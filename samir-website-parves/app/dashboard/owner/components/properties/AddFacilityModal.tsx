import React, { useState, useEffect, useRef } from "react";

interface AddFacilityModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (facility: {
    category: string;
    subCategory: string;
    floorInfo: string;
    imageFile: File | null;
    lat?: string;
    lng?: string;
  }) => void;
  latitude: string;
  longitude: string;
  triggerNotification: (msg: string, type?: "success" | "error") => void;
}

export default function AddFacilityModal({
  show,
  onClose,
  onSave,
  latitude,
  longitude,
  triggerNotification,
}: AddFacilityModalProps) {
  const [facilityCategory, setFacilityCategory] = useState("Coffee");
  const [facilitySubcategory, setFacilitySubcategory] = useState("");
  const [facilityFloorDetails, setFacilityFloorDetails] = useState("");
  const [facilityImageFile, setFacilityImageFile] = useState<File | null>(null);
  const [facilityImagePreview, setFacilityImagePreview] = useState<string | null>(null);

  const [facilityLat, setFacilityLat] = useState(latitude);
  const [facilityLng, setFacilityLng] = useState(longitude);

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
    const map = new google.maps.Map(mapRef.current, {
      center,
      zoom: 19,
      mapTypeId: "satellite",
      tilt: 0,
      zoomControlsEnabled: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });
    mapInstance.current = map;
    
    const marker = new google.maps.Marker({
      position: center,
      map,
      draggable: true,
    });
    markerRef.current = marker;

    map.addListener("click", (e: any) => {
      marker.setPosition(e.latLng);
      setFacilityLat(String(e.latLng.lat()));
      setFacilityLng(String(e.latLng.lng()));
    });
    
    marker.addListener("dragend", (e: any) => {
      setFacilityLat(String(e.latLng.lat()));
      setFacilityLng(String(e.latLng.lng()));
    });
  };

  useEffect(() => {
    if (show) {
      setFacilityLat(latitude);
      setFacilityLng(longitude);
      setTimeout(() => {
        loadGoogleMaps(() => {
          initMap(Number(latitude || 23.8103), Number(longitude || 90.4125));
        });
      }, 300);
    }
  }, [show, latitude, longitude]);

  if (!show) return null;

  const handleResetAndClose = () => {
    setFacilityCategory("Coffee");
    setFacilitySubcategory("");
    setFacilityFloorDetails("");
    setFacilityImageFile(null);
    setFacilityImagePreview(null);
    onClose();
  };

  const handleSave = () => {
    if (!facilitySubcategory.trim()) {
      triggerNotification("Subcategory is required", "error");
      return;
    }
    if (!facilityFloorDetails.trim()) {
      triggerNotification("Floor Details are required", "error");
      return;
    }

    onSave({
      category: facilityCategory,
      subCategory: facilitySubcategory.trim(),
      floorInfo: facilityFloorDetails.trim(),
      imageFile: facilityImageFile,
      lat: facilityLat,
      lng: facilityLng,
    });

    handleResetAndClose();
    triggerNotification("Indoor facility added!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
      <div className="w-full max-w-[450px] bg-white border border-zinc-200 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="text-center space-y-2">
          <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <svg
              className="w-5.5 h-5.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="font-black text-base text-zinc-950">
            Add Indoor Facility
          </h3>
          <p className="text-[11px] text-zinc-400 font-bold leading-normal">
            Drag marker or tap on the building roof to pin facility location.
          </p>
        </div>

        {/* Google Map Selector */}
        <div className="rounded-2xl overflow-hidden border border-zinc-200 shadow-sm w-full h-44 relative bg-zinc-150">
          <div ref={mapRef} className="w-full h-full" />
        </div>

        <div className="space-y-3 text-left">
          <div>
            <label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">
              Category
            </label>
            <select
              value={facilityCategory}
              onChange={(e) => setFacilityCategory(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 outline-none text-xs font-bold"
            >
              {[
                "Gym",
                "Coffee",
                "Food",
                "Pool",
                "Meeting Room",
                "Lobby",
                "Bathroom",
                "Smoking Zone",
                "Other",
              ].map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">
              Subcategory
            </label>
            <input
              type="text"
              placeholder="e.g. Rooftop Gym, Jamal Coffee Shop"
              value={facilitySubcategory}
              onChange={(e) => setFacilitySubcategory(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 outline-none text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">
              Floor Details
            </label>
            <input
              type="text"
              placeholder="e.g. 10th floor, Near Bathroom"
              value={facilityFloorDetails}
              onChange={(e) => setFacilityFloorDetails(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 outline-none text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">
              Upload Facility Image (Optional)
            </label>
            <label className="border border-dashed border-zinc-200 hover:border-zinc-350 rounded-2xl p-4 text-center bg-zinc-50/50 cursor-pointer transition-all flex flex-col items-center justify-center gap-1 relative overflow-hidden h-24">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    setFacilityImageFile(file);
                    setFacilityImagePreview(URL.createObjectURL(file));
                  }
                }}
                className="hidden"
              />
              {facilityImagePreview ? (
                <img
                  src={facilityImagePreview}
                  alt="Facility Preview"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <>
                  <svg
                    className="w-6 h-6 text-zinc-350"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span className="text-[10px] font-bold text-zinc-500">
                    Upload Image
                  </span>
                </>
              )}
            </label>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={handleResetAndClose}
            className="flex-1 py-2.5 border border-zinc-200 text-zinc-500 rounded-xl text-xs font-bold hover:bg-zinc-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
