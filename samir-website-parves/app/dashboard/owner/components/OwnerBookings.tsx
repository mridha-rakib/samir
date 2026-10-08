import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  useGetActivePastBookingsQuery, 
  useConfirmBookingAndReleasePaymentMutation,
  useGetSingleServiceBookingQuery
} from "@/redux/api/serviceBookingApi";
import { useCreateServiceReviewMutation } from "@/redux/api/reviewApi";

import Pagination from "@/app/components/Pagination";
import { useNotification } from "./PropertyOwnerLayout";

interface OwnerBookingsProps {
  triggerNotification?: (msg: string, type?: "success" | "error") => void;
}

export default function OwnerBookings({ triggerNotification: propTriggerNotification }: OwnerBookingsProps) {
  const { triggerNotification: layoutTriggerNotification } = useNotification();
  const triggerNotification = propTriggerNotification && propTriggerNotification.name !== "" ? propTriggerNotification : layoutTriggerNotification;
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryBookingId = searchParams.get("bookingId");
  const [activeBookingTab, setActiveBookingTab] = useState<"active" | "past" | "to-confirm">("active");
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  React.useEffect(() => {
    if (queryBookingId) {
      setSelectedBookingId(queryBookingId);
    }
  }, [queryBookingId]);

  // Review states
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [createServiceReview, { isLoading: isSubmittingReview }] = useCreateServiceReviewMutation();

  const handleCloseModal = () => {
    setSelectedBookingId(null);
    setRating(0);
    setHoveredRating(0);
    setComment("");
    setReviewSubmitted(false);
    router.replace("/dashboard/propertyowner/bookings");
  };

  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    setPage(1);
  }, [activeBookingTab]);

  // Fetch live bookings dynamically using the selected tab filter
  const { data: bookingsResponse, isLoading, isFetching, refetch } = useGetActivePastBookingsQuery({
    bookingType: activeBookingTab,
    page,
    limit,
  });

  const [confirmBooking, { isLoading: isConfirming }] = useConfirmBookingAndReleasePaymentMutation();

  // Fetch single booking details dynamically when selected
  const { data: detailsResponse, isLoading: isLoadingDetails, error: detailsError } = useGetSingleServiceBookingQuery(
    selectedBookingId || "",
    { skip: !selectedBookingId }
  );

  const bookings = bookingsResponse?.data?.data || bookingsResponse?.data || [];
  const selectedBookingDetails = detailsResponse?.data;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      const dayName = d.toLocaleDateString("en-US", { weekday: "long" });
      const formattedDate = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      return `${dayName}, ${formattedDate}`;
    } catch (e) {
      return dateStr;
    }
  };

  const handleConfirmCompletion = async (bookingId: string) => {
    try {
      const res = await confirmBooking(bookingId).unwrap();
      if (res.success || res.statusCode === 200) {
        triggerNotification("Booking confirmed and payment released successfully!", "success");
        setSelectedBookingId(null);
        refetch();
      } else {
        triggerNotification(res.message || "Failed to confirm booking", "error");
      }
    } catch (err: any) {
      triggerNotification(err?.data?.message || "Error confirming booking", "error");
    }
  };

  const handleMessageProvider = (providerId: string) => {
    if (providerId) {
      setSelectedBookingId(null);
      router.push(`/dashboard/propertyowner/chat?role=property%20owner&providerId=${providerId}`);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-10 pb-24 md:pb-8 w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="text-left">
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight">Service Bookings</h2>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400 font-semibold">Track active maintenance and service jobs</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-zinc-100 p-1 rounded-2xl w-full md:w-auto">
          <button
            onClick={() => setActiveBookingTab("active")}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeBookingTab === "active"
                ? "bg-white text-zinc-950 shadow-sm"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setActiveBookingTab("past")}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeBookingTab === "past"
                ? "bg-white text-zinc-950 shadow-sm"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Past
          </button>
          <button
            onClick={() => setActiveBookingTab("to-confirm")}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeBookingTab === "to-confirm"
                ? "bg-white text-zinc-950 shadow-sm"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Need Accept
          </button>
        </div>
      </div>

      {isLoading || isFetching ? (
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-zinc-400 font-bold mt-2">Loading bookings...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="py-24 text-center bg-white border border-zinc-150 rounded-3xl shadow-sm">
          <svg
            className="w-12 h-12 text-zinc-300 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
          <p className="text-sm font-bold text-zinc-500">No bookings found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {bookings.map((booking: any) => {
            const status = booking.bookingStatus?.toUpperCase();
            const provider = booking.service?.user;
            const rating = booking.service?.serviceRating || "0.0";
            const formattedDate = formatDate(booking.date);
            const timeRange = booking.timeSlot ? `${booking.timeSlot.from || 'N/A'} - ${booking.timeSlot.to || 'N/A'}` : "";

            return (
              <div
                key={booking.id || booking._id}
                className="bg-white border border-zinc-150 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col md:flex-row gap-6 items-start md:items-center text-left"
              >
                {/* Details Container */}
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-base font-black text-zinc-950 tracking-tight">
                      {booking.serviceName || "Service Booking"}
                    </h3>

                    {/* Status Badge */}
                    {status === "CONFIRMED" && (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
                        Confirmed
                      </span>
                    )}
                    {status === "COMPLETED" && (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
                        Completed
                      </span>
                    )}
                    {status === "CANCELLED" && (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-red-50 text-red-600 border border-red-100">
                        Cancelled
                      </span>
                    )}
                    {status === "REJECTED" && (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-red-50 text-red-600 border border-red-100">
                        Rejected
                      </span>
                    )}
                    {status === "EXPIRED" && (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-zinc-100 text-zinc-600 border border-zinc-200">
                        Expired
                      </span>
                    )}
                    {status === "COMPLETED_BY_PROVIDER" && (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-100">
                        Need Accept
                      </span>
                    )}
                  </div>

                  {/* Location Info */}
                  <p className="text-xs text-zinc-500 font-bold">
                    {booking.property || "No Property Location Details"}
                  </p>

                  {/* Provider Info Row */}
                  <div className="flex items-center gap-3 pt-1">
                    <div className="relative w-9 h-9 rounded-full overflow-hidden bg-zinc-100 shrink-0 border border-zinc-200">
                      <img
                        src={provider?.profileImage || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80"}
                        alt="Provider Avatar"
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80";
                        }}
                      />
                    </div>
                    <div>
                      <span className="block text-xs font-black text-zinc-900">
                        {provider?.fullName || "Unassigned Provider"}
                      </span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-amber-500 text-xs">★</span>
                        <span className="text-[10px] text-zinc-400 font-extrabold">
                          {rating} Rating
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Date & Action Buttons Container */}
                <div className="flex flex-col sm:flex-row md:flex-col gap-4 w-full md:w-auto items-start sm:items-center md:items-end justify-between md:justify-center border-t md:border-t-0 border-zinc-100 pt-4 md:pt-0">
                  <div className="text-left md:text-right">
                    <span className="block text-[9px] uppercase text-zinc-400 font-extrabold tracking-wider">Date & Time</span>
                    <span className="text-xs font-bold text-zinc-700">
                      {formattedDate} {timeRange ? `| ${timeRange}` : ""}
                    </span>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto">
                    {status === "COMPLETED_BY_PROVIDER" && (
                      <button
                        onClick={() => handleConfirmCompletion(booking.id || booking._id)}
                        disabled={isConfirming}
                        className="flex-1 sm:flex-none px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/10 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
                      >
                        {isConfirming ? "Confirming..." : "Confirm Completion"}
                      </button>
                    )}
                    {(status === "CANCELLED" || status === "REJECTED" || status === "EXPIRED") && (
                      <button
                        onClick={() => router.push(`/dashboard/propertyowner/services`)}
                        className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/10 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
                      >
                        Book Again
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedBookingId(booking.id || booking._id)}
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {bookingsResponse?.data?.meta && (
        <Pagination
          currentPage={page}
          totalItems={bookingsResponse.data.meta.total}
          limit={limit}
          onPageChange={setPage}
        />
      )}

      {/* Booking Details Modal */}
      {selectedBookingId && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative text-left flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-150 flex items-center justify-between shrink-0">
              <h3 className="text-lg font-black text-zinc-950 tracking-tight">Service Booking Details</h3>
              <button
                onClick={handleCloseModal}
                className="text-zinc-400 hover:text-zinc-650 p-1.5 rounded-full transition-all duration-150 cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {isLoadingDetails ? (
                <div className="py-12 text-center">
                  <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs text-zinc-400 font-bold mt-2">Loading details...</p>
                </div>
              ) : selectedBookingDetails ? (
                <>
                  {/* Service Header Info */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-xl font-black text-zinc-955">{selectedBookingDetails.serviceName || "Service"}</h4>
                      <p className="text-xs text-zinc-400 font-semibold mt-1">
                        Scheduled Slot: {formatDate(selectedBookingDetails.date)} | {selectedBookingDetails.timeSlot?.from || "N/A"} - {selectedBookingDetails.timeSlot?.to || "N/A"}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        selectedBookingDetails.bookingStatus?.toUpperCase() === "CONFIRMED" || selectedBookingDetails.bookingStatus?.toUpperCase() === "COMPLETED"
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          : selectedBookingDetails.bookingStatus?.toUpperCase() === "CANCELLED"
                          ? "bg-red-50 text-red-655 border border-red-100"
                          : "bg-amber-50 text-amber-600 border border-amber-100"
                      }`}
                    >
                      {selectedBookingDetails.bookingStatus || "PENDING"}
                    </span>
                  </div>

                  <hr className="border-zinc-100" />

                  {/* Property Info */}
                  <div>
                    <h5 className="text-xs font-black text-zinc-955 uppercase tracking-wider mb-2">Property Information</h5>
                    <p className="text-sm font-bold text-zinc-800">
                      {selectedBookingDetails.hotelInfo?.propertyTitle || selectedBookingDetails.property || "Property Title"}
                    </p>
                    <p className="text-xs text-zinc-500 font-medium mt-1">
                      {selectedBookingDetails.hotelInfo?.propertyAddress || "Property Address not specified"}
                    </p>
                  </div>

                  <hr className="border-zinc-100" />

                  {/* Provider Info */}
                  <div>
                    <h5 className="text-xs font-black text-zinc-955 uppercase tracking-wider mb-3">Service Provider Details</h5>
                    <div className="bg-zinc-50 p-4 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-zinc-200 border border-zinc-300">
                          <img
                            src={selectedBookingDetails.service?.user?.profileImage || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"}
                            alt="Provider Avatar"
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <div>
                          <span className="block text-sm font-black text-zinc-900">
                            {selectedBookingDetails.service?.user?.fullName || "Unassigned Provider"}
                          </span>
                          <span className="block text-[10px] text-zinc-400 font-bold mt-0.5">
                            Rating: ★ {selectedBookingDetails.service?.serviceRating || "0.0"}
                          </span>
                        </div>
                      </div>
                      
                      {selectedBookingDetails.service?.user?.id && (
                        <button
                          onClick={() => {
                            handleMessageProvider(selectedBookingDetails.service.user.id);
                          }}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-extrabold cursor-pointer"
                        >
                          Message
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Special Instructions */}
                  {selectedBookingDetails.specialInstructions && (
                    <>
                      <hr className="border-zinc-100" />
                      <div>
                        <h5 className="text-xs font-black text-zinc-955 uppercase tracking-wider mb-2">Special Instructions</h5>
                        <p className="text-sm font-semibold text-zinc-700 bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                          {selectedBookingDetails.specialInstructions}
                        </p>
                      </div>
                    </>
                  )}

                  {/* Proof of Work Video if present */}
                  {selectedBookingDetails.startAndEndProofVideos && (selectedBookingDetails.startAndEndProofVideos.recordProofVideoStarting?.length > 0 || selectedBookingDetails.startAndEndProofVideos.recordProofVideoEnding?.length > 0) && (
                    <>
                      <hr className="border-zinc-100" />
                      <div>
                        <h5 className="text-xs font-black text-zinc-955 uppercase tracking-wider mb-2">Proof of Work</h5>
                        <p className="text-xs text-zinc-400 font-semibold mb-3">Service provider uploaded proof videos:</p>
                        <div className="flex flex-col gap-3">
                          {/* Starting Video */}
                          {selectedBookingDetails.startAndEndProofVideos.recordProofVideoStarting?.[0] && (
                            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-center justify-between">
                              <span className="text-xs font-bold text-blue-700">Starting Video Proof</span>
                              <a
                                href={selectedBookingDetails.startAndEndProofVideos.recordProofVideoStarting[0]}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                              >
                                Watch Video
                              </a>
                            </div>
                          )}
                          
                          {/* Ending Video */}
                          {selectedBookingDetails.startAndEndProofVideos.recordProofVideoEnding?.[0] && (
                            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between">
                              <span className="text-xs font-bold text-emerald-700">Completion Video Proof</span>
                              <a
                                href={selectedBookingDetails.startAndEndProofVideos.recordProofVideoEnding[0]}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                              >
                                Watch Video
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Rate Service Provider Form (Completed status only) */}
                  {selectedBookingDetails.bookingStatus?.toUpperCase() === "COMPLETED" && (
                    <>
                      <hr className="border-zinc-100" />
                      <div>
                        <h5 className="text-xs font-black text-zinc-955 uppercase tracking-wider mb-2">Rate Service Provider</h5>
                        
                        {reviewSubmitted ? (
                          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
                            <p className="text-xs font-bold text-emerald-800">Thank you! Your review has been submitted successfully.</p>
                          </div>
                        ) : (
                          <div className="bg-zinc-50 border border-zinc-150 rounded-2xl p-4 space-y-3">
                            <p className="text-xs text-zinc-500 font-bold">How was your service experience?</p>
                            
                            {/* Star Rating Row */}
                            <div className="flex gap-1.5 justify-center py-1">
                              {[1, 2, 3, 4, 5].map((star) => {
                                const isHighlighted = star <= (hoveredRating > 0 ? hoveredRating : rating);
                                return (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoveredRating(star)}
                                    onMouseLeave={() => setHoveredRating(0)}
                                    className="text-zinc-350 hover:scale-125 transition-transform cursor-pointer duration-150"
                                  >
                                    <svg
                                      className={`w-7 h-7 ${isHighlighted ? "text-amber-400 fill-amber-400" : "text-gray-400 fill-gray-200"}`}
                                      viewBox="0 0 24 24"
                                    >
                                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                    </svg>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Comment Textarea */}
                            <textarea
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                              placeholder="Describe provider's work quality, timing, response..."
                              rows={2}
                              className="w-full text-xs font-bold text-zinc-800 bg-white border border-zinc-200 rounded-xl p-2.5 focus:outline-none focus:border-blue-600"
                            />

                            <button
                              type="button"
                              disabled={rating === 0 || isSubmittingReview}
                              onClick={async () => {
                                try {
                                  await createServiceReview({
                                    serviceId: selectedBookingDetails.service?.id || selectedBookingDetails.serviceId,
                                    rating,
                                    comment: comment.trim(),
                                    bookingId: selectedBookingDetails.id || selectedBookingDetails._id,
                                  }).unwrap();
                                  setReviewSubmitted(true);
                                  triggerNotification("Review submitted successfully!", "success");
                                } catch (err: any) {
                                  triggerNotification(err?.data?.message || "Failed to submit review", "error");
                                }
                              }}
                              className={`w-full py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer text-center ${
                                rating === 0 || isSubmittingReview
                                  ? "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                                  : "bg-blue-600 hover:bg-blue-700 text-white"
                              }`}
                            >
                              {isSubmittingReview ? "Submitting..." : "Submit Review"}
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </>
              ) : detailsError ? (
                <div className="py-12 text-center space-y-2">
                  <span className="text-2xl">⚠️</span>
                  <p className="text-sm font-bold text-red-500">Failed to load booking details.</p>
                  <p className="text-xs text-zinc-400 font-semibold max-w-xs mx-auto">
                    {((detailsError as any)?.data?.message) || "An unexpected error occurred. Please try again later."}
                  </p>
                  {((detailsError as any)?.data?.message)?.toLowerCase().includes("not found") && (
                    <div className="pt-4 flex flex-col items-center">
                      <p className="text-xs text-zinc-500 mb-3 font-semibold">Is this a property booking? Try checking Guest Management.</p>
                      <button
                        onClick={() => router.push(`/dashboard/propertyowner/guests?bookingId=${selectedBookingId}`)}
                        className="px-4 py-2 bg-zinc-100 border border-zinc-200 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                      >
                        Check Guest Management
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm font-bold text-zinc-400 py-6 text-center">No details could be retrieved.</p>
              )}
            </div>

            {/* Modal Footer */}
            {selectedBookingDetails && (
              <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex gap-3 shrink-0">
                {selectedBookingDetails.bookingStatus?.toUpperCase() === "COMPLETED_BY_PROVIDER" && (
                  <button
                    onClick={() => handleConfirmCompletion(selectedBookingDetails.id || selectedBookingDetails._id)}
                    disabled={isConfirming}
                    className="flex-1 px-4 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer text-center shadow-md shadow-amber-500/10"
                  >
                    {isConfirming ? "Confirming..." : "Confirm & Release Payment"}
                  </button>
                )}
                <button
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-3 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-extrabold rounded-xl transition-all cursor-pointer text-center"
                >
                  Close Details
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
