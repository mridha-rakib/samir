import React, { useState, useEffect } from "react";
import {
  useGetSingleServiceBookingQuery,
  useInProgressBookingMutation,
  useCompleteBookingMutation,
  useUploadStartingProofVideoMutation,
  useUploadEndingProofVideoMutation,
  useUpdateMultipleInventoryItemsMutation,
  useAcceptBookingMutation,
  useRejectBookingMutation,
} from "@/redux/api/serviceBookingApi";
import { useCreatePropertyOwnerReviewMutation } from "@/redux/api/reviewApi";
import {
  BackArrowIcon,
  StarIcon,
  CalendarIcon,
  CheckIcon,
  AlertTriangleIcon,
  PinIcon,
  VideoCameraIcon,
} from "./Icons";

interface SPJobDetailsProps {
  jobId: string;
  onBack: () => void;
  triggerNotification: (msg: string, type?: "success" | "error") => void;
}

const mockJobs = [
  {
    id: "mock-job-1",
    property: "Sunset Villa Apartments",
    serviceName: "House Cleaning",
    offeredService: { serviceTypeName: "Cleaning" },
    address: "123 Oak Street, Downtown",
    date: "Today, 2:00 PM - 4:00 PM",
    totalPrice: 85,
    bookingStatus: "NEED_ACCEPT",
    user: { fullName: "Mr. Rahman", id: "owner-1" },
    guard: { name: "Ahmed Hassan", phone: "+1 (555) 123-4567", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" },
    inventory: [
      { id: 1, name: "Dinner Plates", qty: "12 Plates", checked: true },
      { id: 2, name: "Spoons & Forks", qty: "24 Units", checked: true },
      { id: 3, name: "Cleaning Cloths", qty: "10 Units", checked: true }
    ],
    videoRecorded: false,
    remarks: "",
  },
  {
    id: "mock-job-2",
    property: "Plumbing Repair",
    serviceName: "Plumbing Repair",
    offeredService: { serviceTypeName: "Plumbing" },
    address: "Sunrise Apartments, Bloc A",
    date: "Oct 10, 3:00 PM - 5:00 PM",
    totalPrice: 90,
    bookingStatus: "CONFIRMED",
    user: { fullName: "Mr. Rahman", id: "owner-1" },
    guard: { name: "Ahmed Hassan", phone: "+1 (555) 123-4567", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" },
    inventory: [
      { id: 1, name: "Copper Pipes", qty: "6 Pipes", checked: false },
      { id: 2, name: "Wrench Tool", qty: "1 Unit", checked: true }
    ],
    videoRecorded: false,
    remarks: "",
  }
];

export default function SPJobDetails({
  jobId,
  onBack,
  triggerNotification,
}: SPJobDetailsProps) {
  // Navigation inside Job Details
  const [viewMode, setViewMode] = useState<"details" | "inventory" | "proof-of-work">("details");
  const [prevViewMode, setPrevViewMode] = useState<"details" | "proof-of-work">("details");

  // Query details
  const isMock = jobId.startsWith("mock");
  const { data: bookingRes, isLoading, refetch, error } = useGetSingleServiceBookingQuery(jobId, { skip: isMock });

  // Mutations
  const [inProgressBooking] = useInProgressBookingMutation();
  const [completeBooking] = useCompleteBookingMutation();
  const [uploadStartingProof] = useUploadStartingProofVideoMutation();
  const [uploadEndingProof] = useUploadEndingProofVideoMutation();
  const [updateInventory] = useUpdateMultipleInventoryItemsMutation();
  const [acceptBooking] = useAcceptBookingMutation();
  const [rejectBooking] = useRejectBookingMutation();
  const [createOwnerReview, { isLoading: isSubmittingReview }] = useCreatePropertyOwnerReviewMutation();

  // Local job replica state (for checklists and simulations)
  const [localJob, setLocalJob] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [tempRemarks, setTempRemarks] = useState("");

  // Review states
  const [ownerRating, setOwnerRating] = useState(5);
  const [ownerComment, setOwnerComment] = useState("");
  const [isOwnerReviewed, setIsOwnerReviewed] = useState(false);

  // Report missing modal states
  const [showMissingModal, setShowMissingModal] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [missingQty, setMissingQty] = useState(1);
  const [missingDetails, setMissingDetails] = useState("");

  // Video proof state
  const [startVideoFile, setStartVideoFile] = useState<File | null>(null);
  const [startVideoPreview, setStartVideoPreview] = useState<string | null>(null);
  const [endVideoFile, setEndVideoFile] = useState<File | null>(null);
  const [endVideoPreview, setEndVideoPreview] = useState<string | null>(null);
  const [showStartUploadModal, setShowStartUploadModal] = useState(false);

  // Hydrate local job from API response or mock
  useEffect(() => {
    if (isMock) {
      const found = mockJobs.find(j => j.id === jobId) || mockJobs[0];
      setLocalJob(JSON.parse(JSON.stringify(found)));
    } else if (bookingRes?.data) {
      const data = bookingRes.data;
      // Map API structure to uniform UI structure
      setLocalJob({
        id: data.id,
        property: data.property || "Assigned Property",
        serviceName: data.serviceName || "Premium Service",
        address: data.hotelInfo?.propertyAddress || data.service?.address || "Location not provided",
        date: data.date || "Scheduled Date",
        totalPrice: data.totalPrice || 0,
        bookingStatus: data.bookingStatus,
        latitude: data.hotelInfo?.latitude || null,
        longitude: data.hotelInfo?.longitude || null,
        user: data.user || { fullName: "Property Manager", id: "owner-1" },
        guard: data.hotelInfo?.guards ? { 
          name: data.hotelInfo.guards.name, 
          phone: data.hotelInfo.guards.phone || data.hotelInfo.guards.whatsapp, 
          avatar: data.hotelInfo.guards.photo || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" 
        } : null,
        inventory: data.hotelInfo?.inventoryItems && data.hotelInfo.inventoryItems.length > 0 ? data.hotelInfo.inventoryItems.map((item: any) => ({
          id: item.id,
          name: item.name,
          qty: `${item.quantity} Units`,
          checked: item.missingQuantity === 0,
          missingQty: item.missingQuantity || undefined,
          missingDetails: item.description || undefined
        })) : [],
        videoRecorded: !!data.startAndEndProofVideos?.isEndedVideo,
        remarks: data.remarks || "",
        hotelId: data.hotelId,
        day: data.day || null,
        timeSlot: data.timeSlot || null,
        serviceType: data.service?.serviceType || "Service",
        serviceRating: data.service?.serviceRating || null,
        serviceReviewCount: data.service?.serviceReviewCount || 0,
        coverImage: data.service?.coverImage || null,
        offered_services: data.service?.offered_services || (data.offeredService ? [data.offeredService] : []),
        specialInstructions: data.specialInstructions || data.addRemark || data.remarks || ""
      });
    }
  }, [bookingRes, jobId, isMock]);

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-2xl font-bold">
          ⚠️
        </div>
        <div className="space-y-1 max-w-md">
          <h3 className="text-lg font-bold text-zinc-900 font-sans">Job Details Not Found</h3>
          <p className="text-xs text-zinc-500 font-semibold leading-relaxed">
            {((error as any)?.data?.message) || "This service booking may have been cancelled, deleted, or is not available."}
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer font-sans"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (isLoading || !localJob) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[300px]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // File handlers for Proof Video Uploads
  const handleStartVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setStartVideoFile(file);
      const url = URL.createObjectURL(file);
      setStartVideoPreview(url);
    }
  };

  const handleRemoveStartVideo = () => {
    if (startVideoPreview) URL.revokeObjectURL(startVideoPreview);
    setStartVideoFile(null);
    setStartVideoPreview(null);
  };

  const handleEndVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEndVideoFile(file);
      const url = URL.createObjectURL(file);
      setEndVideoPreview(url);
    }
  };

  const handleRemoveEndVideo = () => {
    if (endVideoPreview) URL.revokeObjectURL(endVideoPreview);
    setEndVideoFile(null);
    setEndVideoPreview(null);
  };

  // Acceptance / workflow transitions
  const handleStartProofAndWork = async () => {
    if (!startVideoFile) {
      triggerNotification("Please select a video proof file first", "error");
      return;
    }
    setIsRecording(true);
    try {
      if (!isMock) {
        // 1. Upload starting proof video
        const form = new FormData();
        form.append("recordProofVideoStarting", startVideoFile);
        
        await uploadStartingProof({ bookingId: localJob.id, body: form }).unwrap();
        
        // 2. Put booking into progress
        await inProgressBooking(localJob.id).unwrap();
        
        setLocalJob((prev: any) => prev ? {
          ...prev,
          bookingStatus: "IN_WORKING",
          videoRecorded: false
        } : null);

        refetch();
      } else {
        setLocalJob((prev: any) => prev ? {
          ...prev,
          bookingStatus: "IN_WORKING"
        } : null);
      }
      triggerNotification("Service status changed to In Working!");
      setShowStartUploadModal(false);
      handleRemoveStartVideo();
    } catch (err: any) {
      console.error(err);
      triggerNotification(err?.data?.message || "Failed to start working process", "error");
    } finally {
      setIsRecording(false);
    }
  };

  const handleAcceptJob = async () => {
    try {
      if (!isMock) {
        await acceptBooking(localJob.id).unwrap();
        refetch();
      }
      setLocalJob((prev: any) => prev ? { ...prev, bookingStatus: "CONFIRMED" } : null);
      triggerNotification("Job Accepted Successfully!");
    } catch (err: any) {
      console.error(err);
      triggerNotification(err?.data?.message || "Failed to accept job", "error");
    }
  };

  const handleRejectJob = async () => {
    try {
      if (!isMock) {
        await rejectBooking(localJob.id).unwrap();
        refetch();
      }
      setLocalJob((prev: any) => prev ? { ...prev, bookingStatus: "REJECTED" } : null);
      triggerNotification("Job Rejected", "error");
      setTimeout(() => onBack(), 1000);
    } catch (err: any) {
      console.error(err);
      triggerNotification(err?.data?.message || "Failed to reject job", "error");
    }
  };

  const handleToggleInventoryCheck = (itemId: number) => {
    setLocalJob({
      ...localJob,
      inventory: localJob.inventory.map((item: any) => {
        if (item.id === itemId) {
          const nextVal = !item.checked;
          return {
            ...item,
            checked: nextVal,
            ...(nextVal ? { missingQty: undefined, missingDetails: undefined } : {})
          };
        }
        return item;
      })
    });
  };

  const handleOpenReportMissing = (itemId: number) => {
    setEditingItemId(itemId);
    const item = localJob.inventory.find((i: any) => i.id === itemId);
    const parsedQty = parseInt(item?.qty) || 5;
    setMissingQty(parsedQty);
    setMissingDetails("");
    setShowMissingModal(true);
  };

  const handleSaveMissingReport = () => {
    if (editingItemId === null) return;
    setLocalJob({
      ...localJob,
      inventory: localJob.inventory.map((item: any) => {
        if (item.id === editingItemId) {
          return {
            ...item,
            checked: false,
            missingQty,
            missingDetails
          };
        }
        return item;
      })
    });
    setShowMissingModal(false);
    setEditingItemId(null);
    triggerNotification("Inventory missing item recorded.");
  };

  const handleSaveChecklist = async () => {
    try {
      if (!isMock && localJob.hotelId) {
        const bodyPayload = localJob.inventory.map((item: any) => ({
          name: item.name,
          checked: item.checked,
          missingQty: item.missingQty || 0,
          missingDetails: item.missingDetails || ""
        }));
        await updateInventory({ hotelId: localJob.hotelId, body: { items: bodyPayload } }).unwrap();
      }
      triggerNotification("Inventory status verified.");
      setViewMode(prevViewMode);
    } catch (err: any) {
      console.error(err);
      triggerNotification("Failed to save inventory to database", "error");
      setViewMode(prevViewMode);
    }
  };

  const handleSubmitProofOfWork = async () => {
    if (!endVideoFile && !isMock) {
      triggerNotification("Please select ending video proof first", "error");
      return;
    }

    setIsRecording(true);
    try {
      if (!isMock) {
        // 1. Upload ending proof video
        const form = new FormData();
        form.append("recordProofVideoEnding", endVideoFile!);
        await uploadEndingProof({ bookingId: localJob.id, body: form }).unwrap();

        // 2. Complete booking
        await completeBooking(localJob.id).unwrap();
        refetch();
      }
      setLocalJob((prev: any) => prev ? {
        ...prev,
        bookingStatus: "COMPLETED_BY_PROVIDER",
        videoRecorded: true
      } : null);
      triggerNotification("Proof submitted! Payout processed via Stripe.");
      setViewMode("details");
      handleRemoveEndVideo();
      setTempRemarks("");
    } catch (err: any) {
      console.error(err);
      triggerNotification(err?.data?.message || "Failed to submit work completion", "error");
    } finally {
      setIsRecording(false);
    }
  };

  const handleSubmitOwnerReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const ownerId = localJob?.user?.id;
    if (!ownerId) {
      triggerNotification("Owner details not found", "error");
      return;
    }
    try {
      const res = await createOwnerReview({
        reviewedUserId: ownerId,
        rating: ownerRating,
        comment: ownerComment.trim(),
      }).unwrap();
      if (res.success) {
        setIsOwnerReviewed(true);
        triggerNotification("Feedback submitted to Property Owner successfully!", "success");
      } else {
        triggerNotification(res.message || "Failed to submit review", "error");
      }
    } catch (err: any) {
      console.error(err);
      triggerNotification(err?.data?.message || "Failed to submit owner review", "error");
    }
  };

  const renderDetailsView = () => {
    const isWorking = localJob.bookingStatus === "IN_WORKING";
    const isCompleted = localJob.bookingStatus === "COMPLETED_BY_PROVIDER" || localJob.bookingStatus === "COMPLETED";
    const isConfirmed = localJob.bookingStatus === "CONFIRMED";
    const isPending = localJob.bookingStatus === "NEED_ACCEPT";

    return (
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-10 pb-24 md:pb-8 w-full max-w-7xl mx-auto space-y-6 text-left">
        {/* Back and Page Title */}
        <div className="flex items-center gap-4">
          <button onClick={onBack} aria-label="Go back" className="cursor-pointer">
            <BackArrowIcon />
          </button>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">Job Details</h2>
        </div>

        {/* Cover Header Card */}
        <div className="relative h-56 w-full rounded-3xl overflow-hidden mb-6 shrink-0 shadow-sm border border-zinc-200 text-left">
          {localJob.coverImage ? (
            <img src={localJob.coverImage} alt={localJob.serviceName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-800 flex items-center justify-center">
              <svg className="w-16 h-16 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 13a1 1 0 01-1 1h-6v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6H3a1 1 0 01-1-1v-2a1 1 0 011-1h6V3a1 1 0 011-1h2a1 1 0 011 1v6h6a1 1 0 011 1v2z" />
              </svg>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-6 left-6 text-left">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-full text-xs font-black uppercase tracking-wider">
              {localJob.serviceType}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-2 drop-shadow-md">
              {localJob.serviceName}
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start">
          {/* Left Column: Job Info, Schedule, Breakdown, Special Instructions, Checklist, Map */}
          <div className="lg:col-span-7 space-y-6">
            {/* Service Info Card */}
            <div className="bg-white border border-zinc-150 p-6 rounded-3xl shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-black text-zinc-900 leading-snug">{localJob.serviceName}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-550 mt-2 font-bold">
                    <PinIcon />
                    <span>{localJob.property || "Property"}</span>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                  isWorking
                    ? "bg-amber-50 text-amber-600 border border-amber-100"
                    : isCompleted
                    ? "bg-blue-600 text-white"
                    : "bg-blue-50 text-blue-600 border border-blue-100"
                }`}>
                  {isPending ? "Pending" : isWorking ? "In Working" : isCompleted ? "Completed" : "Confirmed"}
                </span>
              </div>
            </div>

            {/* Schedule Card */}
            <div className="bg-white border border-zinc-150 p-6 rounded-3xl shadow-sm space-y-4">
              <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Schedule
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 bg-blue-50/40 border border-blue-100 rounded-2xl flex flex-col gap-1 text-left">
                  <span className="text-[9px] font-black text-blue-500 uppercase tracking-wider">Date</span>
                  <span className="text-xs font-black text-zinc-800">{localJob.date || "N/A"}</span>
                </div>
                <div className="p-3.5 bg-purple-50/40 border border-purple-100 rounded-2xl flex flex-col gap-1 text-left">
                  <span className="text-[9px] font-black text-purple-500 uppercase tracking-wider">Day</span>
                  <span className="text-xs font-black text-zinc-800">{localJob.day || "N/A"}</span>
                </div>
              </div>
              <div className="p-3.5 bg-emerald-50/40 border border-emerald-100 rounded-2xl flex flex-col gap-1 text-left">
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-wider">Time Slot</span>
                <span className="text-xs font-black text-zinc-800">
                  {localJob.timeSlot ? `${localJob.timeSlot.from || 'N/A'} - ${localJob.timeSlot.to || 'N/A'}` : "N/A"}
                </span>
              </div>
            </div>

            {/* Service Breakdown Card */}
            {localJob.offered_services && localJob.offered_services.length > 0 && (
              <div className="bg-white border border-zinc-150 p-6 rounded-3xl shadow-sm space-y-4">
                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Service Breakdown
                </h4>
                <div className="space-y-3">
                  {localJob.offered_services.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-xs font-bold text-zinc-700">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                        <span>{item.serviceTypeName || "Service Type"}</span>
                      </div>
                      <span className="text-blue-600">${item.price ?? 0}</span>
                    </div>
                  ))}
                  <div className="border-t border-zinc-100 pt-3 flex justify-between items-center text-sm font-black text-zinc-900">
                    <span>Total</span>
                    <span className="text-blue-600">${localJob.totalPrice}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Special Instructions */}
            {localJob.specialInstructions && (
              <div className="bg-white border border-zinc-150 p-6 rounded-3xl shadow-sm space-y-4">
                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Special Instructions
                </h4>
                <div className="p-4 bg-orange-50 border border-orange-200 text-orange-850 text-xs font-bold rounded-2xl flex gap-2.5 items-start">
                  <svg className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="leading-relaxed">{localJob.specialInstructions}</p>
                </div>
              </div>
            )}

            {/* Inventory Checklist Preview */}
            {localJob.inventory && localJob.inventory.length > 0 && (
              <div className="bg-white border border-zinc-150 p-6 rounded-3xl shadow-sm space-y-4">
                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  Inventory Checklist Preview
                </h4>
                <div className="space-y-2">
                  {localJob.inventory.map((item: any, idx: number) => (
                    <div key={idx} className="p-3.5 bg-zinc-50 border border-zinc-100 rounded-2xl flex items-center justify-between text-xs font-bold text-zinc-700">
                      <span className="text-zinc-800">{item.name}</span>
                      <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md text-[10px]">{item.qty}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Map */}
            <div className="bg-white border border-zinc-150 p-5 rounded-3xl shadow-sm space-y-4">
              <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Location</h4>
              <div className="relative h-60 w-full rounded-2xl overflow-hidden bg-zinc-150 border border-zinc-200 shadow-inner">
                {localJob.latitude && localJob.longitude ? (
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    src={`https://maps.google.com/maps?q=${localJob.latitude},${localJob.longitude}&z=15&output=embed`}
                  ></iframe>
                ) : (
                  <>
                    <img
                      src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=600&q=80"
                      alt="Map view"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative w-8 h-8 flex items-center justify-center">
                        <span className="absolute w-5 h-5 rounded-full bg-red-500/30 animate-ping" />
                        <svg className="w-8 h-8 text-red-600 fill-current relative drop-shadow" viewBox="0 0 24 24">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                        </svg>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Owner, Guard, Payment Card & Actions */}
          <div className="lg:col-span-5 space-y-6">
            {/* Property Owner */}
            <div className="bg-white border border-zinc-150 p-5 rounded-3xl shadow-sm">
              <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-3">Property Owner</h4>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-zinc-800">{localJob.user?.fullName}</span>
                <span className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold shadow-sm">Client</span>
              </div>
            </div>

            {/* Assigned Security Guard */}
            {localJob.guard && (
              <div className="bg-white border border-zinc-150 p-5 rounded-3xl shadow-sm">
                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-3">Assigned Security Guard</h4>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-200 relative shrink-0">
                    <img src={localJob.guard.avatar} alt="Guard" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-800">{localJob.guard.name}</p>
                    <p className="text-[10px] text-zinc-400 font-bold mt-0.5">{localJob.guard.phone}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Summary Gradient Card */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-800 border-none p-6 rounded-3xl shadow-lg shadow-blue-600/10 text-white space-y-4 text-left">
              <h4 className="text-[9px] font-black text-white/60 uppercase tracking-wider">Payment Summary</h4>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-white/80">Offered Service Price</span>
                <span className="text-lg font-black">${localJob.totalPrice.toFixed(2)}</span>
              </div>
              <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                <span className="text-xs font-bold text-white/80">Payout Method</span>
                <span className="text-xs font-black bg-white/20 px-2.5 py-1 rounded-lg">Stripe Auto-Transfer</span>
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex flex-col gap-3">
              {isPending && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleAcceptJob}
                    className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black shadow-md shadow-blue-500/10 active:scale-[0.98] transition-all text-center cursor-pointer"
                  >
                    Accept Job
                  </button>
                  <button
                    onClick={handleRejectJob}
                    className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-xs font-black shadow-md shadow-red-500/10 active:scale-[0.98] transition-all text-center cursor-pointer"
                  >
                    Decline
                  </button>
                </div>
              )}

              {isConfirmed && (
                <button
                  onClick={() => {
                    handleRemoveStartVideo();
                    setShowStartUploadModal(true);
                  }}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black shadow-md shadow-blue-500/10 active:scale-[0.98] transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
                >
                  Record Start Proof & Start Work
                </button>
              )}

              {isWorking && (
                <>
                  <button
                    onClick={() => {
                      setPrevViewMode("details");
                      setViewMode("inventory");
                    }}
                    className="w-full py-4 border-2 border-blue-600 hover:bg-blue-50 text-blue-600 rounded-2xl text-xs font-black transition-all text-center cursor-pointer"
                  >
                    Inventory Checklist
                  </button>
                  <button
                    onClick={() => setViewMode("proof-of-work")}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black shadow-md shadow-blue-500/10 active:scale-[0.98] transition-all text-center cursor-pointer"
                  >
                    Mark as Completed (End Proof)
                  </button>
                </>
              )}

              {isCompleted && (
                <div className="space-y-4">
                  <div className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold text-center text-sm shadow-md flex items-center justify-center gap-2">
                    Job Done ✓
                  </div>
                  
                  {/* REVIEW OWNER CARD */}
                  <div className="bg-white border border-zinc-150 p-5 rounded-3xl shadow-sm space-y-4 text-left">
                    <h4 className="text-xs font-black text-zinc-950 tracking-tight">Review Property Owner</h4>
                    {isOwnerReviewed ? (
                      <div className="p-4 bg-emerald-50 text-emerald-650 border border-emerald-100 rounded-2xl text-xs font-bold text-center">
                        Thank you! Your feedback has been submitted successfully. ✓
                      </div>
                    ) : (
                      <form onSubmit={handleSubmitOwnerReview} className="space-y-3.5">
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">
                            Rate Owner
                          </label>
                          <div className="flex gap-1.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setOwnerRating(star)}
                                className="focus:outline-none transition-transform hover:scale-110"
                              >
                                <svg
                                  className={`w-6 h-6 ${
                                    star <= ownerRating ? "text-amber-400 fill-amber-400" : "text-zinc-200"
                                  }`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">
                            Feedback Comment
                          </label>
                          <textarea
                            value={ownerComment}
                            onChange={(e) => setOwnerComment(e.target.value)}
                            required
                            placeholder="Write your experience working with this client..."
                            rows={3}
                            className="w-full px-4 py-3 rounded-2xl border border-zinc-200 focus:border-blue-500 outline-none text-xs font-bold bg-zinc-50/50"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmittingReview}
                          className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {isSubmittingReview ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Submitting...
                            </>
                          ) : (
                            "Submit Review"
                          )}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderInventoryView = () => {
    return (
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-10 pb-24 md:pb-8 w-full max-w-7xl mx-auto space-y-6 text-left">
        <div className="flex items-center gap-4">
          <button onClick={() => setViewMode(prevViewMode)} aria-label="Go back">
            <BackArrowIcon />
          </button>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">Inventory Checklist</h2>
        </div>

        {localJob.inventory.length === 0 ? (
          <div className="bg-white border border-zinc-150 p-6 rounded-3xl text-center text-zinc-400 font-semibold">
            No inventory checklist registered for this property.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {localJob.inventory.map((item: any) => (
              <div key={item.id} className="bg-white border border-zinc-150 p-5 rounded-3xl shadow-sm flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => handleToggleInventoryCheck(item.id)}
                    className="mt-1 h-5 w-5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div>
                    <p className="text-sm font-bold text-zinc-950">{item.name}</p>
                    <p className="text-[10px] text-zinc-400 font-extrabold uppercase mt-0.5">{item.qty}</p>

                    {!item.checked && item.missingQty !== undefined && (
                      <div className="mt-2 text-[10px] text-red-650 bg-red-50/50 border border-red-100 p-2.5 rounded-xl font-bold">
                        ⚠️ Missing: {item.missingQty} Units
                        {item.missingDetails && <p className="font-semibold text-red-500/80 mt-1 italic">"{item.missingDetails}"</p>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  {item.checked ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 uppercase">
                      ✓ Verified
                    </span>
                  ) : (
                    <button
                      onClick={() => handleOpenReportMissing(item.id)}
                      className="flex items-center gap-1 text-[11px] font-bold text-red-500 hover:text-red-700 uppercase cursor-pointer"
                    >
                      ⚠️ Report Missing
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-center pt-4">
          <button
            onClick={handleSaveChecklist}
            className="w-full max-w-md py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/10 active:scale-[0.99] transition-all text-sm cursor-pointer"
          >
            Save Checklist State
          </button>
        </div>
      </div>
    );
  };

  const renderProofView = () => {
    return (
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-10 pb-24 md:pb-8 w-full max-w-7xl mx-auto space-y-6 text-left">
        <div className="flex items-center gap-4">
          <button onClick={() => setViewMode("details")} aria-label="Go back">
            <BackArrowIcon />
          </button>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">Upload Proof of Work</h2>
        </div>

        <p className="text-xs text-zinc-400 font-semibold tracking-wide uppercase -mt-2">
          Submit photos or videos as job confirmation proof
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-zinc-150 p-5 rounded-3xl shadow-sm space-y-3.5">
              <div>
                <h3 className="text-base font-extrabold text-zinc-900">{localJob.property}</h3>
                <p className="text-[11px] text-zinc-400 font-bold uppercase mt-0.5">{localJob.serviceName}</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold text-zinc-650 pt-2 border-t border-zinc-100">
                <span><CalendarIcon /> {localJob.date}</span>
              </div>
            </div>

            {/* Video Box */}
            <div className="bg-white border border-zinc-150 p-6 rounded-3xl shadow-sm space-y-4">
              <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">End Proof — Pending</h4>
              
              {!endVideoFile ? (
                <label className="border-2 border-dashed border-zinc-200 rounded-2xl p-8 text-center bg-zinc-55/35 hover:bg-zinc-100/40 transition-colors flex flex-col items-center justify-center gap-3 cursor-pointer">
                  <input type="file" accept="video/*" className="hidden" onChange={handleEndVideoChange} />
                  <VideoCameraIcon />
                  <div>
                    <p className="text-sm font-extrabold text-zinc-900">Select Ending Video Proof</p>
                    <p className="text-[11px] text-zinc-455 font-bold mt-1">Select video capture after job completion</p>
                  </div>
                </label>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-2xl overflow-hidden bg-black aspect-video shadow-inner">
                    <video src={endVideoPreview || undefined} controls className="w-full h-full object-contain" />
                  </div>
                  <div className="flex justify-end">
                    <button 
                      onClick={handleRemoveEndVideo}
                      className="px-4 py-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-xl font-bold text-xs transition-all cursor-pointer"
                    >
                      Change Video
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Remarks & actions */}
          <div className="lg:col-span-5 space-y-6">
            {localJob.inventory && localJob.inventory.length > 0 && (
              <button
                onClick={() => {
                  setPrevViewMode("proof-of-work");
                  setViewMode("inventory");
                }}
                className="w-full py-4 border-2 border-blue-600 hover:bg-blue-50 text-blue-600 rounded-2xl text-xs font-black transition-all text-center cursor-pointer"
              >
                Update Inventory Checklist
              </button>
            )}
            <div className="bg-white border border-zinc-150 p-5 rounded-3xl shadow-sm space-y-2">
              <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider">Add Remarks (Optional)</label>
              <textarea
                placeholder="Write here..."
                rows={6}
                value={tempRemarks}
                onChange={(e) => setTempRemarks(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:border-blue-500 bg-zinc-50/50 outline-none text-xs font-bold text-zinc-800 resize-none"
              />
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleSubmitProofOfWork}
                disabled={isRecording || !endVideoFile}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-500/10 active:scale-[0.98] transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
              >
                {isRecording && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Submit Proof
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden w-full h-full relative">
      {viewMode === "details" && renderDetailsView()}
      {viewMode === "inventory" && renderInventoryView()}
      {viewMode === "proof-of-work" && renderProofView()}

      {/* REPORT MISSING ITEM MODAL */}
      {showMissingModal && editingItemId !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm text-left">
          <div className="w-full max-w-[340px] bg-white border border-zinc-150 rounded-3xl p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => {
                setShowMissingModal(false);
                setEditingItemId(null);
              }}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-650 transition-colors font-extrabold text-sm"
              aria-label="Close"
            >
              ✕
            </button>

            <div>
              <h3 className="text-sm font-black text-zinc-955 uppercase tracking-wider">Report Missing Item</h3>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">
                {localJob.inventory.find((i: any) => i.id === editingItemId)?.name}
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-b border-zinc-100 py-3.5 text-xs font-bold text-zinc-700">
              <span>Missing Quantity</span>
              <div className="flex items-center gap-3.5">
                <button
                  type="button"
                  onClick={() => setMissingQty(Math.max(1, missingQty - 1))}
                  className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center hover:bg-zinc-200 transition-colors text-sm font-black"
                >
                  -
                </button>
                <span className="text-sm font-extrabold">{missingQty}</span>
                <button
                  type="button"
                  onClick={() => setMissingQty(missingQty + 1)}
                  className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center hover:bg-zinc-200 transition-colors text-sm font-black"
                >
                  +
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider">Provide details about the missing</label>
              <textarea
                placeholder="Example: Broken during the cleaning process."
                rows={3}
                value={missingDetails}
                onChange={(e) => setMissingDetails(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 outline-none text-xs font-bold text-zinc-800 resize-none"
              />
            </div>

            <button
              onClick={handleSaveMissingReport}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow transition-all cursor-pointer"
            >
              Report Missing
            </button>
          </div>
        </div>
      )}

      {/* START PROOF UPLOAD MODAL */}
      {showStartUploadModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm">
          <div className="w-full max-w-[500px] bg-white border border-zinc-200 rounded-3xl p-6 shadow-2xl relative animate-zoom-in flex flex-col text-left">
            <button 
              onClick={() => setShowStartUploadModal(false)}
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-500 font-bold transition-colors cursor-pointer"
            >
              ✕
            </button>
            
            <h3 className="text-lg font-black text-zinc-900 tracking-tight">Start Proof</h3>
            <p className="text-xs text-zinc-400 font-bold mt-1 uppercase tracking-wide">Upload work starting video proof</p>

            {/* Job details box */}
            <div className="border border-zinc-200 rounded-2xl p-4 bg-zinc-50/55 space-y-2 mt-4 text-xs font-semibold text-zinc-650">
              <h4 className="text-sm font-black text-zinc-900">{localJob.property}</h4>
              <p className="text-xs text-zinc-500 font-bold">{localJob.serviceName}</p>
              <div className="grid grid-cols-2 gap-3 pt-3 mt-1 border-t border-zinc-150 text-zinc-500">
                <div>📅 {localJob.date}</div>
                <div className="font-bold text-zinc-900">💵 ${localJob.totalPrice}</div>
              </div>
            </div>

            {/* File drag selector */}
            {!startVideoFile ? (
              <label className="border-2 border-dashed border-blue-200 rounded-2xl p-8 text-center bg-blue-50/10 hover:bg-blue-50/20 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer mt-6">
                <input type="file" accept="video/*" className="hidden" onChange={handleStartVideoChange} />
                <div className="p-3.5 rounded-full bg-blue-50 text-blue-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 10l-4 4m0 0l-4-4m4 4V3m-9 8h18" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-800">Select Video Proof</p>
                  <p className="text-xs text-zinc-400 mt-1">Select short video capture before starting job</p>
                </div>
              </label>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-video shadow-inner">
                  <video src={startVideoPreview || undefined} controls className="w-full h-full object-contain" />
                </div>
                <div className="flex gap-3 justify-end">
                  <button 
                    onClick={handleRemoveStartVideo}
                    className="px-4 py-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-xl font-bold text-xs transition-all cursor-pointer"
                  >
                    Change Video
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button 
                onClick={() => setShowStartUploadModal(false)}
                className="flex-1 py-3 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-xl font-bold text-sm transition-all text-center cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleStartProofAndWork}
                disabled={isRecording || !startVideoFile}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-bold text-sm shadow-md active:scale-[0.99] transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
              >
                {isRecording && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Submit Proof
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
