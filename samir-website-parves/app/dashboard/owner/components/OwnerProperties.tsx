import React, { useState, useEffect } from "react";
import { 
  useGetPartnerHotelsQuery, 
  useCreateHotelMutation, 
  useDeleteHotelMutation,
  useCreateGuardMutation,
  useGetSingleHotelQuery,
  useUpdateHotelMutation,
  useUpdateCategoryMutation
} from "@/redux/api/hotelApi";
import { useGetMyProfileQuery } from "@/redux/api/userApi";
import { useNotification } from "./PropertyOwnerLayout";
import Pagination from "@/app/components/Pagination";

// Import modular subcomponents
import PropertiesList from "./properties/PropertiesList";
import WizardStep1 from "./properties/WizardStep1";
import WizardStep2 from "./properties/WizardStep2";
import WizardStep3 from "./properties/WizardStep3";
import SecurityModal from "./properties/SecurityModal";
import InventoryModal from "./properties/InventoryModal";
import AddInventoryItemModal from "./properties/AddInventoryItemModal";
import ShareQRModal from "./properties/ShareQRModal";
import LocationModals from "./properties/LocationModals";
import AddFacilityModal from "./properties/AddFacilityModal";
import DeleteConfirmModal from "./properties/DeleteConfirmModal";

interface OwnerPropertiesProps {
  wizardActive: boolean;
  setWizardActive: (val: boolean) => void;
  triggerNotification: (msg: string, type?: "success" | "error") => void;
}

const getErrorMessage = (err: any): string => {
  if (err?.data?.errorMessages && Array.isArray(err.data.errorMessages) && err.data.errorMessages.length > 0) {
    const mainMsg = err.data.errorMessages[0].message;
    if (mainMsg.includes("Argument `quantity`")) {
      return "Inventory quantity must be a valid number (e.g. 12 instead of '12 Plates').";
    }
    if (mainMsg.includes("Invalid `prisma")) {
      const parts = mainMsg.split("\n");
      const cleanMsg = parts.find((p: string) => p.includes("Argument") || p.includes("Invalid value") || p.includes("Expected"));
      if (cleanMsg) return cleanMsg.trim();
    }
    return mainMsg;
  }
  return err?.data?.message || err?.message || "An unexpected error occurred";
};

export default function OwnerProperties({
  wizardActive,
  setWizardActive,
  triggerNotification: propTriggerNotification,
}: OwnerPropertiesProps) {
  const { triggerNotification: contextTrigger } = useNotification();
  const triggerNotification = contextTrigger || propTriggerNotification;

  // RTK Query hooks
  const [page, setPage] = useState(1);
  const limit = 9;
  const { data: propertiesResponse, isLoading: isPropertiesLoading, refetch } = useGetPartnerHotelsQuery({ page, limit });
  const [sharingProperty, setSharingProperty] = useState<any | null>(null);
  const [createHotel, { isLoading: isCreatingHotel }] = useCreateHotelMutation();
  const [deleteHotel, { isLoading: isDeletingHotel }] = useDeleteHotelMutation();
  const [createGuard, { isLoading: isAssigningGuard }] = useCreateGuardMutation();
  const { data: profileResponse } = useGetMyProfileQuery(undefined);
  const profile = profileResponse?.data;

  const handleStartAddProperty = () => {
    if (profile?.isStripeConnected) {
      setWizardActive(true);
      setWizardStep(1);
    } else {
      triggerNotification(
        "Please complete your Stripe onboarding from Payment Settings to add a property.",
        "error"
      );
    }
  };

  // Local state for properties created in session
  const [localProperties, setLocalProperties] = useState<any[]>([]);

  // Wizard workflow state
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);

  // Form parameters
  const [propTitle, setPropTitle] = useState("");
  const [propLocation, setPropLocation] = useState("");
  const [latitude, setLatitude] = useState("23.8103");
  const [longitude, setLongitude] = useState("90.4125");
  const [propDesc, setPropDesc] = useState("");
  const [propMaxGuests, setPropMaxGuests] = useState(4);
  const [propBedrooms, setPropBedrooms] = useState(2);
  const [propBathrooms, setPropBathrooms] = useState(1);
  const [propAmenities, setPropAmenities] = useState(["Air Conditioner", "Wi-Fi"]);
  const [propImageFiles, setPropImageFiles] = useState<File[]>([]);
  const [propImagePreviews, setPropImagePreviews] = useState<string[]>([]);
  const [houseRulesFile, setHouseRulesFile] = useState<File | null>(null);
  const [houseRulesPreview, setHouseRulesPreview] = useState<string | null>(null);

  // Geolocation & Dialogs States
  const [showLocationRequiredModal, setShowLocationRequiredModal] = useState(false);
  const [showPermissionDeniedModal, setShowPermissionDeniedModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<string | null>(null);

  // Security Access State
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [smartLockCode, setSmartLockCode] = useState("");
  const [keyBoxPin, setKeyBoxPin] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [confirmCodes, setConfirmCodes] = useState(false);
  const [areSecurityKeysAdded, setAreSecurityKeysAdded] = useState(false);

  // Indoor Facilities State
  const [showAddFacilityModal, setShowAddFacilityModal] = useState(false);
  const [savedFacilities, setSavedFacilities] = useState<any[]>([]);

  // Pricing & Calendar states
  const [basePrice, setBasePrice] = useState("");
  const [customPrices, setCustomPrices] = useState<any[]>([]);

  const [weeklyOffer, setWeeklyOffer] = useState(true);
  const [weeklyOfferRate, setWeeklyOfferRate] = useState("10");
  const [monthlyOffer, setMonthlyOffer] = useState(true);
  const [monthlyOfferRate, setMonthlyOfferRate] = useState("15");
  const [availableForBooking, setAvailableForBooking] = useState(true);
  const [syncWithAirbnb, setSyncWithAirbnb] = useState(false);
  const [airbnbIcalUrl, setAirbnbIcalUrl] = useState("");

  // Step 2 Guard Parameters
  const [guardName, setGuardName] = useState("");
  const [guardPhone, setGuardPhone] = useState("");
  const [guardWhatsapp, setGuardWhatsapp] = useState("");
  const [guardImageFile, setGuardImageFile] = useState<File | null>(null);
  const [guardImagePreview, setGuardImagePreview] = useState<string | null>(null);

  // Step 3 Confirmation & Sync
  const [currentPropertyId, setCurrentPropertyId] = useState<string>("");
  const [updateHotel, { isLoading: isUpdatingHotel }] = useUpdateHotelMutation();
  const [updateCategory, { isLoading: isUpdatingCategory }] = useUpdateCategoryMutation();
  const { data: singlePropertyResponse, isLoading: isLoadingSingleProperty } = useGetSingleHotelQuery(currentPropertyId, { skip: !currentPropertyId || wizardStep !== 3 });
  
  const [localTipCategories, setLocalTipCategories] = useState<string[]>([]);
  const [categoryToggleState, setCategoryToggleState] = useState<Record<string, boolean>>({});
  const [isExportVisible, setIsExportVisible] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [airbnbUrlInput, setAirbnbUrlInput] = useState("");
  const [isAirbnbSyncedLocal, setIsAirbnbSyncedLocal] = useState(false);

  // Sync state with singlePropertyResponse data
  useEffect(() => {
    if (singlePropertyResponse?.success && singlePropertyResponse?.data) {
      const airbnbUrl = singlePropertyResponse.data.airbnbIcalUrl;
      if (airbnbUrl) {
        setAirbnbUrlInput(airbnbUrl);
        setIsAirbnbSyncedLocal(true);
        setIsExportVisible(true);
      } else {
        setAirbnbUrlInput("");
        setIsAirbnbSyncedLocal(false);
        setIsExportVisible(false);
      }
    }
  }, [singlePropertyResponse]);

  const handleSyncAirbnb = async () => {
    if (!airbnbUrlInput.trim()) {
      triggerNotification("Please enter Airbnb iCal URL", "error");
      return;
    }
    try {
      const body = {
        airbnbIcalUrl: airbnbUrlInput.trim(),
        syncWithAirbnb: true,
      };
      const response = await updateHotel({ hotelId: currentPropertyId, body }).unwrap();
      if (response.success) {
        setIsAirbnbSyncedLocal(true);
        setIsExportVisible(true);
        triggerNotification(response.message || "Airbnb synced successfully", "success");
      } else {
        triggerNotification(response.message || "Failed to sync with Airbnb", "error");
      }
    } catch (err: any) {
      console.error(err);
      triggerNotification(err?.data?.message || err?.message || "Failed to sync with Airbnb", "error");
    }
  };

  // Set up categories from single property data in Step 3
  useEffect(() => {
    if (singlePropertyResponse?.success && singlePropertyResponse?.data) {
      const data = singlePropertyResponse.data;
      const tips = data.addLocalTips || [];
      const uniqueCategories = Array.from(new Set(tips.map((t: any) => t.category).filter(Boolean))) as string[];
      setLocalTipCategories(uniqueCategories);

      const toggles: Record<string, boolean> = {};
      uniqueCategories.forEach((cat) => {
        const catTips = tips.filter((t: any) => t.category === cat);
        const allActive = catTips.every((t: any) => t.isActive);
        toggles[cat] = allActive;
      });
      setCategoryToggleState(toggles);
    }
  }, [singlePropertyResponse]);

  // Request location and permission (triggered on location modal retry)
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
        triggerNotification("Location detected successfully!");
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

  // Inventory Checklist Overlay State
  const [selectedHotelIdForInventory, setSelectedHotelIdForInventory] = useState<string | null>(null);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showAddInventoryItemModal, setShowAddInventoryItemModal] = useState(false);
  const [propInventory, setPropInventory] = useState([
    { name: "Dinner Plates", qty: "12" },
    { name: "Forks", qty: "12" },
    { name: "Knives", qty: "4" },
    { name: "Spoons", qty: "10" },
    { name: "Coffee Cups", qty: "15" },
  ]);

  const handleViewInventory = (hotelId: string) => {
    setSelectedHotelIdForInventory(hotelId);
    setShowInventoryModal(true);
  };

  const handleAddInventoryItem = (name: string, qty: string) => {
    setPropInventory([...propInventory, { name, qty }]);
    setShowAddInventoryItemModal(false);
    triggerNotification("Item added to inventory!");
  };

  const handleAddIndoorFacility = (facility: {
    category: string;
    subCategory: string;
    floorInfo: string;
    imageFile: File | null;
    lat?: string;
    lng?: string;
  }) => {
    setSavedFacilities([
      ...savedFacilities,
      {
        ...facility,
        lat: facility.lat || latitude,
        lng: facility.lng || longitude,
      },
    ]);
  };

  const handleDeleteProperty = async (hotelId: string) => {
    setPropertyToDelete(hotelId);
    setShowDeleteModal(true);
  };

  const confirmDeleteProperty = async () => {
    if (!propertyToDelete) return;
    
    try {
      if (propertyToDelete.startsWith("mock-") || propertyToDelete.startsWith("local-")) {
        setLocalProperties(localProperties.filter(p => p.id !== propertyToDelete));
        triggerNotification("Property deleted successfully!");
        setShowDeleteModal(false);
        setPropertyToDelete(null);
        return;
      }
      const res = await deleteHotel(propertyToDelete).unwrap();
      if (res.success) {
        triggerNotification("Property deleted from server!");
      }
    } catch (err: any) {
      console.error(err);
      triggerNotification("Failed to delete property", "error");
    }
    setShowDeleteModal(false);
    setPropertyToDelete(null);
  };

  const handleCreatePropertyStep1 = async () => {
    if (!propTitle.trim()) {
      triggerNotification("Property Title is required", "error");
      return;
    }
    if (!basePrice.trim()) {
      triggerNotification("Base Price is required", "error");
      return;
    }

    try {
      const formData = new FormData();
      
      // Sort local tips so that facilities with images come first, matching mobile app backend matching order!
      const sortedFacilities = [...savedFacilities].sort((a, b) => {
        const aHasImg = a.imageFile ? 1 : 0;
        const bHasImg = b.imageFile ? 1 : 0;
        return bHasImg - aHasImg;
      });

      const formattedLocalTips = sortedFacilities.map((f) => ({
        category: f.category || "",
        subcategory: f.subCategory || "",
        floor_details: f.floorInfo || "",
        latitude: String(f.lat || latitude),
        longitude: String(f.lng || longitude),
      }));

      const bodyData = {
        propertyTitle: propTitle.trim(),
        propertyAddress: propLocation || "Location picked from map",
        propertyDescription: propDesc.trim(),
        latitude: String(latitude || "23.8103"),
        longitude: String(longitude || "90.4125"),
        maxGuests: String(propMaxGuests),
        bedrooms: String(propBedrooms),
        bathrooms: String(propBathrooms),
        smartLockCode: smartLockCode || "1234",
        keyBoxPin: keyBoxPin || "5678",
        wifiPassword: wifiPassword || "12345",
        amenities: JSON.stringify(propAmenities),
        addSecurityKeys: "Security keys info...",
        addLocalTips: formattedLocalTips,
        basePrice: String(basePrice),
        weeklyOffers: weeklyOffer ? String(weeklyOfferRate) : "0",
        monthlyOffers: monthlyOffer ? String(monthlyOfferRate) : "0",
        customPrices: JSON.stringify(customPrices.map((p) => ({
          startDate: p.startDate,
          endDate: p.endDate,
          price: Number(p.price)
        }))),
        inventoryItems: JSON.stringify(propInventory.map(item => {
          const parsedQty = parseInt(String(item.qty).replace(/\D/g, ""), 10) || 0;
          return { name: item.name, quantity: parsedQty };
        })),
        availableForBooking: availableForBooking ? "AVAILABLE" : "UNAVAILABLE",
        syncWithAirbnb: syncWithAirbnb ? "true" : "false",
        airbnbIcalUrl: airbnbIcalUrl || "",
      };

      formData.append("data", JSON.stringify(bodyData));

      // Append multiple images for uploadPhotosOrVideos
      if (propImageFiles.length > 0) {
        propImageFiles.forEach((file) => {
          formData.append("uploadPhotosOrVideos", file);
        });
      }

      if (houseRulesFile) {
        formData.append("houseRules", houseRulesFile);
      } else if (propImageFiles.length > 0) {
        formData.append("houseRules", propImageFiles[0]);
      }

      // Facility images uploaded in the sorted order
      sortedFacilities.forEach((facility) => {
        if (facility.imageFile) {
          formData.append("subcategoryImage", facility.imageFile);
        }
      });

      const response = await createHotel(formData).unwrap();
      if (response.success && response.data) {
        const createdId = response.data.id || response.data._id;
        setCurrentPropertyId(createdId);
        triggerNotification(response.message || "Hotel created successfully", "success");
        setWizardStep(2);
      } else {
        triggerNotification(response.message || "Failed to create property", "error");
      }
    } catch (err: any) {
      console.error(err);
      triggerNotification(getErrorMessage(err), "error");
    }
  };

  const handleAssignGuardStep2 = async () => {
    if (!guardName.trim() || !guardPhone.trim() || !guardWhatsapp.trim()) {
      triggerNotification("Please fill all text fields", "error");
      return;
    }
    if (!guardImageFile) {
      triggerNotification("Please upload a guard photo", "error");
      return;
    }

    try {
      const guardData = new FormData();
      const guardBody = {
        name: guardName.trim(),
        phone: guardPhone.trim(),
        whatsapp: guardWhatsapp.trim(),
      };
      guardData.append("data", JSON.stringify(guardBody));
      guardData.append("guardPhoto", guardImageFile);

      const response = await createGuard({ hotelId: currentPropertyId, body: guardData }).unwrap();
      if (response.success) {
        triggerNotification(response.message || "Guard assigned successfully", "success");
        setWizardStep(3);
      } else {
        triggerNotification(response.message || "Failed to assign guard", "error");
      }
    } catch (err: any) {
      console.error(err);
      triggerNotification(err?.data?.message || err?.message || "Error assigning guard", "error");
    }
  };

  const handleSavePropertyFinalStep3 = async () => {
    // Only check link copy if export is available
    if (isExportVisible && !isLinkCopied) {
      triggerNotification("You have to copy the property export link", "error");
      return;
    }

    try {
      const tips = singlePropertyResponse?.data?.addLocalTips || [];
      const updatedTips = tips.map((tip: any) => ({
        category: tip.category || "",
        subcategory: tip.subcategory || "",
        subcategoryImage: tip.subcategoryImage || "",
        floor_details: tip.floorDetails || tip.floor_details || "",
        latitude: String(tip.latitude || ""),
        longitude: String(tip.longitude || ""),
        isActive: categoryToggleState[tip.category] !== false,
      }));

      const body = {
        data: JSON.stringify({ addLocalTips: updatedTips }),
      };

      const response = await updateCategory({ hotelId: currentPropertyId, body }).unwrap();
      if (response.success) {
        triggerNotification(response.message || "Categories updated successfully", "success");
        
        // Reset wizard and refetch properties list
        setWizardActive(false);
        setWizardStep(1);
        setCurrentPropertyId("");
        
        // Reset Form State
        setPropTitle("");
        setPropLocation("");
        setLatitude("23.8103");
        setLongitude("90.4125");
        setPropDesc("");
        setGuardName("");
        setGuardPhone("");
        setGuardWhatsapp("");
        setSmartLockCode("");
        setKeyBoxPin("");
        setWifiPassword("");
        setConfirmCodes(false);
        setAreSecurityKeysAdded(false);
        setSavedFacilities([]);
        setCustomPrices([]);
        setPropImageFiles([]);
        setPropImagePreviews([]);
        setHouseRulesFile(null);
        setHouseRulesPreview(null);
        setGuardImageFile(null);
        setGuardImagePreview(null);
        setBasePrice("");
        setAirbnbIcalUrl("");
        setSyncWithAirbnb(false);
        setIsLinkCopied(false);
        setIsExportVisible(false);

        refetch();
      } else {
        triggerNotification(response.message || "Failed to update categories", "error");
      }
    } catch (err: any) {
      console.error(err);
      triggerNotification(err?.data?.message || err?.message || "Failed to finalize property setup", "error");
    }
  };

  // Map server properties
  const displayedProperties = (propertiesResponse?.data?.data || []).map((p: any) => {
    const isGuardActive = p.guards && Object.keys(p.guards).length > 0;
    return {
      id: p.id || p._id,
      title: p.propertyTitle || "Untitled Property",
      location: p.propertyAddress || "No Address",
      guard: isGuardActive ? "Guard: Active" : "Guard: Not Assigned",
      status: p.availableForBooking || "AVAILABLE",
      image: p.uploadPhotosOrVideos?.[0] || "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80",
      rawData: p, // Keep reference for QR code generation
    };
  });

  const getStatusBadgeStyles = (status: string) => {
    switch (status?.toUpperCase()) {
      case "AVAILABLE":
        return "bg-emerald-50 text-emerald-600 border border-emerald-100";
      case "BOOKED":
        return "bg-blue-50 text-blue-600 border border-blue-100";
      case "MAINTENANCE":
        return "bg-orange-50 text-orange-600 border border-orange-100";
      default:
        return "bg-zinc-50 text-zinc-550 border border-zinc-100";
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-10 pb-24 md:pb-8 w-full max-w-7xl mx-auto space-y-6">
      
      {!wizardActive ? (
        <PropertiesList
          displayedProperties={displayedProperties}
          isPropertiesLoading={isPropertiesLoading}
          onStartAddProperty={handleStartAddProperty}
          onDeleteProperty={handleDeleteProperty}
          onShareProperty={setSharingProperty}
          onViewInventory={handleViewInventory}
          getStatusBadgeStyles={getStatusBadgeStyles}
          meta={propertiesResponse?.data?.meta}
          page={page}
          limit={limit}
          onPageChange={setPage}
        />
      ) : (
        /* WIZARD ACTIVE: ADD PROPERTY */
        <div className="bg-white border border-zinc-150 rounded-3xl p-6 sm:p-8 max-w-2xl mx-auto shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-zinc-150">
            <button
              onClick={() => {
                setWizardActive(false);
                setWizardStep(1);
                setCurrentPropertyId("");
              }}
              className="flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-zinc-650 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
              Back to List
            </button>
            <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider">
              Step {wizardStep} of 3 – {wizardStep === 1 ? "Basic Information" : wizardStep === 2 ? "Assign Guard" : "Confirm Details"}
            </span>
          </div>

          {/* PROGRESS BAR */}
          <div className="flex gap-2.5 mb-8">
            <div className="flex-1 h-2 rounded-full bg-blue-600" />
            <div className={`flex-1 h-2 rounded-full transition-all ${wizardStep >= 2 ? "bg-blue-600" : "bg-zinc-200"}`} />
            <div className={`flex-1 h-2 rounded-full transition-all ${wizardStep === 3 ? "bg-blue-600" : "bg-zinc-200"}`} />
          </div>

          {/* STEP 1: BASIC INFO */}
          {wizardStep === 1 && (
            <WizardStep1
              onNext={handleCreatePropertyStep1}
              isLoading={isCreatingHotel}
              propTitle={propTitle}
              setPropTitle={setPropTitle}
              propLocation={propLocation}
              setPropLocation={setPropLocation}
              latitude={latitude}
              setLatitude={setLatitude}
              longitude={longitude}
              setLongitude={setLongitude}
              propDesc={propDesc}
              setPropDesc={setPropDesc}
              propImageFiles={propImageFiles}
              setPropImageFiles={setPropImageFiles}
              propImagePreviews={propImagePreviews}
              setPropImagePreviews={setPropImagePreviews}
              houseRulesFile={houseRulesFile}
              setHouseRulesFile={setHouseRulesFile}
              houseRulesPreview={houseRulesPreview}
              setHouseRulesPreview={setHouseRulesPreview}
              propMaxGuests={propMaxGuests}
              setPropMaxGuests={setPropMaxGuests}
              propBedrooms={propBedrooms}
              setPropBedrooms={setPropBedrooms}
              propBathrooms={propBathrooms}
              setPropBathrooms={setPropBathrooms}
              propAmenities={propAmenities}
              setPropAmenities={setPropAmenities}
              propInventory={propInventory}
              onOpenInventoryModal={() => setShowInventoryModal(true)}
              areSecurityKeysAdded={areSecurityKeysAdded}
              onOpenSecurityModal={() => setShowSecurityModal(true)}
              smartLockCode={smartLockCode}
              keyBoxPin={keyBoxPin}
              wifiPassword={wifiPassword}
              setWifiPassword={setWifiPassword}
              savedFacilities={savedFacilities}
              onOpenFacilityModal={() => setShowAddFacilityModal(true)}
              onDeleteFacility={(idx) => setSavedFacilities(savedFacilities.filter((_, i) => i !== idx))}
              basePrice={basePrice}
              setBasePrice={setBasePrice}
              customPrices={customPrices}
              setCustomPrices={setCustomPrices}
              weeklyOffer={weeklyOffer}
              setWeeklyOffer={setWeeklyOffer}
              weeklyOfferRate={weeklyOfferRate}
              setWeeklyOfferRate={setWeeklyOfferRate}
              monthlyOffer={monthlyOffer}
              setMonthlyOffer={setMonthlyOffer}
              monthlyOfferRate={monthlyOfferRate}
              setMonthlyOfferRate={setMonthlyOfferRate}
              availableForBooking={availableForBooking}
              setAvailableForBooking={setAvailableForBooking}
              syncWithAirbnb={syncWithAirbnb}
              setSyncWithAirbnb={setSyncWithAirbnb}
              airbnbIcalUrl={airbnbIcalUrl}
              setAirbnbIcalUrl={setAirbnbIcalUrl}
              setShowLocationRequiredModal={setShowLocationRequiredModal}
              setShowPermissionDeniedModal={setShowPermissionDeniedModal}
              triggerNotification={triggerNotification}
            />
          )}

          {/* STEP 2: ASSIGN SECURITY GUARD */}
          {wizardStep === 2 && (
            <WizardStep2
              onBack={() => setWizardStep(1)}
              onNext={handleAssignGuardStep2}
              isLoading={isAssigningGuard}
              guardName={guardName}
              setGuardName={setGuardName}
              guardPhone={guardPhone}
              setGuardPhone={setGuardPhone}
              guardWhatsapp={guardWhatsapp}
              setGuardWhatsapp={setGuardWhatsapp}
              guardImageFile={guardImageFile}
              setGuardImageFile={setGuardImageFile}
              guardImagePreview={guardImagePreview}
              setGuardImagePreview={setGuardImagePreview}
            />
          )}

          {/* STEP 3: REVIEW DETAILS */}
          {wizardStep === 3 && (
            <WizardStep3
              onBack={() => setWizardStep(2)}
              onSave={handleSavePropertyFinalStep3}
              isLoadingSingleProperty={isLoadingSingleProperty}
              singlePropertyResponse={singlePropertyResponse}
              localTipCategories={localTipCategories}
              categoryToggleState={categoryToggleState}
              setCategoryToggleState={setCategoryToggleState}
              airbnbUrlInput={airbnbUrlInput}
              setAirbnbUrlInput={setAirbnbUrlInput}
              isAirbnbSyncedLocal={isAirbnbSyncedLocal}
              handleSyncAirbnb={handleSyncAirbnb}
              isUpdatingHotel={isUpdatingHotel}
              isUpdatingCategory={isUpdatingCategory}
              isExportVisible={isExportVisible}
              isLinkCopied={isLinkCopied}
              setIsLinkCopied={setIsLinkCopied}
              currentPropertyId={currentPropertyId}
              triggerNotification={triggerNotification}
            />
          )}
        </div>
      )}
      
      {/* MODAL DIALOGS */}
      <SecurityModal
        show={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
        smartLockCode={smartLockCode}
        setSmartLockCode={setSmartLockCode}
        keyBoxPin={keyBoxPin}
        setKeyBoxPin={setKeyBoxPin}
        wifiPassword={wifiPassword}
        setWifiPassword={setWifiPassword}
        confirmCodes={confirmCodes}
        setConfirmCodes={setConfirmCodes}
        setAreSecurityKeysAdded={setAreSecurityKeysAdded}
        triggerNotification={triggerNotification}
      />

      <InventoryModal
        show={showInventoryModal}
        onClose={() => {
          setShowInventoryModal(false);
          setSelectedHotelIdForInventory(null);
        }}
        hotelId={selectedHotelIdForInventory}
        propInventory={propInventory}
        setPropInventory={setPropInventory}
        onOpenAddItem={() => setShowAddInventoryItemModal(true)}
        triggerNotification={triggerNotification}
      />

      <AddInventoryItemModal
        show={showAddInventoryItemModal}
        onCancel={() => setShowAddInventoryItemModal(false)}
        onAdd={handleAddInventoryItem}
      />

      <ShareQRModal
        property={sharingProperty}
        onClose={() => setSharingProperty(null)}
        triggerNotification={triggerNotification}
      />

      <LocationModals
        showLocationRequiredModal={showLocationRequiredModal}
        setShowLocationRequiredModal={setShowLocationRequiredModal}
        showPermissionDeniedModal={showPermissionDeniedModal}
        setShowPermissionDeniedModal={setShowPermissionDeniedModal}
        checkLocationAndRequest={checkLocationAndRequest}
        triggerNotification={triggerNotification}
      />

      <AddFacilityModal
        show={showAddFacilityModal}
        onClose={() => setShowAddFacilityModal(false)}
        onSave={handleAddIndoorFacility}
        latitude={latitude}
        longitude={longitude}
        triggerNotification={triggerNotification}
      />

      <DeleteConfirmModal
        show={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setPropertyToDelete(null);
        }}
        onConfirm={confirmDeleteProperty}
      />
    </div>
  );
}
