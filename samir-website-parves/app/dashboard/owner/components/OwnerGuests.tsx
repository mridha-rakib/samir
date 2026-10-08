import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useGetAllHotelBookingsQuery } from "@/redux/api/hotelBookingApi";
import Pagination from "@/app/components/Pagination";

interface OwnerGuestsProps {
  triggerNotification?: (msg: string, type?: "success" | "error") => void;
}

export default function OwnerGuests({ triggerNotification }: OwnerGuestsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryBookingId = searchParams.get("bookingId");
  
  const [activeTab, setActiveTab] = useState<"current" | "completed">("current");
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  // Fetch dynamic data from the backend using the selected tab filter
  const { data: response, isLoading } = useGetAllHotelBookingsQuery({
    filter: activeTab === "current" ? "ongoing" : "completed",
    page,
    limit,
  });

  const bookings = response?.data?.data || [];

  useEffect(() => {
    if (queryBookingId && bookings.length > 0 && !selectedBooking) {
      const found = bookings.find((b: any) => (b.id === queryBookingId || b._id === queryBookingId));
      if (found) {
        setSelectedBooking(found);
      }
    }
  }, [queryBookingId, bookings]);

  const handleCloseModal = () => {
    setSelectedBooking(null);
    if (queryBookingId) {
      router.replace("/dashboard/propertyowner/guests");
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    } catch (e) {
      return dateStr;
    }
  };

  const calculateNights = (fromStr: string, toStr: string) => {
    if (!fromStr || !toStr) return 0;
    try {
      const from = new Date(fromStr);
      const to = new Date(toStr);
      const diff = to.getTime() - from.getTime();
      return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    } catch (e) {
      return 0;
    }
  };

  const handleMessageUser = (booking: any) => {
    if (booking.bookingSource === "AIRBNB") {
      triggerNotification?.("Cannot message Airbnb guests directly through the website.", "error");
      return;
    }
    
    if (booking.user?.id) {
      // Redirect to the chat tab in propertyowner dashboard
      router.push(`/dashboard/propertyowner/chat?role=property%20owner&providerId=${booking.user.id}`);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-10 pb-24 md:pb-8 w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="text-left">
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight">Guest Management</h2>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400 font-semibold">Track and manage guests booking your properties</p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-zinc-100 p-1 rounded-2xl w-full md:w-auto">
          <button
            onClick={() => setActiveTab("current")}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeTab === "current"
                ? "bg-white text-zinc-950 shadow-sm"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Current
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeTab === "completed"
                ? "bg-white text-zinc-950 shadow-sm"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {isLoading ? (
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
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm font-bold text-zinc-500">No bookings found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {bookings.map((booking: any) => {
            const isAirbnb = booking.bookingSource === "AIRBNB";
            const guestName = isAirbnb ? "Property booked from Airbnb" : (booking.user?.fullName || "Guest Name");
            const fromDate = booking.bookedFromDate || "";
            const toDate = booking.bookedToDate || "";
            const nights = calculateNights(fromDate, toDate);
            const propertyImage = booking.hotel?.uploadPhotosOrVideos?.[0] || "/placeholder-property.jpg";
            const rating = booking.hotel?.hotelRating ? parseFloat(booking.hotel.hotelRating) : 0;

            let reviewText = "No reviews have been given for this property yet!";
            if (booking.hotel?.review && booking.hotel.review.length > 0) {
              reviewText = booking.hotel.review[0].comment || reviewText;
            }

            return (
              <div
                key={booking.id}
                className="bg-white border border-zinc-150 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col md:flex-row gap-6 items-start md:items-center text-left"
              >
                {/* Property Image */}
                <div className="w-full md:w-36 h-36 md:h-24 rounded-2xl overflow-hidden bg-zinc-100 flex-shrink-0 relative">
                  <img
                    src={propertyImage}
                    alt={booking.hotel?.propertyTitle || "Property"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=300&q=80";
                    }}
                  />
                  {isAirbnb && (
                    <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md">
                      Airbnb
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-black text-zinc-950 tracking-tight">
                      {booking.hotel?.propertyTitle || "Property Name"}
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                        activeTab === "current"
                          ? "bg-amber-50 text-amber-600 border border-amber-100"
                          : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      }`}
                    >
                      {activeTab === "current" ? "Ongoing" : "Completed Stay"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-1 gap-x-4 text-xs font-bold text-zinc-500">
                    <div>
                      Guest: <span className="text-zinc-800">{guestName}</span>
                    </div>
                    <div>
                      Stay: <span className="text-zinc-800">{formatDate(fromDate)} - {formatDate(toDate)}</span>
                    </div>
                    <div>
                      Nights: <span className="text-zinc-800">{nights} Nights</span>
                    </div>
                    <div>
                      Guests: <span className="text-zinc-800">{booking.personOfGuests || 1} Guests</span>
                    </div>
                    <div>
                      Price: <span className="text-zinc-800">${booking.totalPrice?.toFixed(2) || "0.00"}</span>
                    </div>
                    {rating > 0 && (
                      <div className="flex items-center gap-1">
                        Rating: <span className="text-amber-500">★ {rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-zinc-400 italic mt-1 line-clamp-1">
                    "{reviewText}"
                  </p>
                </div>

                {/* Actions */}
                <div className="flex md:flex-col gap-2 w-full md:w-auto self-stretch justify-end">
                  {!isAirbnb && booking.user?.id && (
                    <button
                      onClick={() => handleMessageUser(booking)}
                      className="flex-1 md:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl transition-all duration-150 cursor-pointer text-center"
                    >
                      Message
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedBooking(booking)}
                    className="flex-1 md:flex-none px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-extrabold rounded-xl transition-all duration-150 cursor-pointer text-center border border-zinc-200"
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {response?.data?.meta && (
        <Pagination
          currentPage={page}
          totalItems={response.data.meta.total}
          limit={limit}
          onPageChange={setPage}
        />
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative text-left flex flex-col max-h-[90vh]">
            
            {/* Header Image */}
            <div className="h-48 w-full bg-zinc-100 relative">
              <img
                src={selectedBooking.hotel?.uploadPhotosOrVideos?.[0] || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=500&q=80"}
                alt="Property Banner"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=500&q=80";
                }}
              />
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 bg-white/80 hover:bg-white text-zinc-800 p-2 rounded-full transition-all duration-150 shadow-sm cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content Area */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Title & Status */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-zinc-950 tracking-tight leading-snug">
                    {selectedBooking.hotel?.propertyTitle || "Property Details"}
                  </h3>
                  <p className="text-xs text-zinc-400 font-semibold mt-1">
                    {selectedBooking.hotel?.propertyAddress || "No Address Available"}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                    activeTab === "current"
                      ? "bg-amber-50 text-amber-600 border border-amber-100"
                      : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                  }`}
                >
                  {activeTab === "current" ? "Ongoing" : "Completed Stay"}
                </span>
              </div>

              <hr className="border-zinc-100" />

              {/* Booking Timeline */}
              <div>
                <h4 className="text-xs font-black text-zinc-950 uppercase tracking-wider mb-3">Booking Timeline</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-50 p-3 rounded-2xl">
                    <span className="block text-[10px] text-zinc-450 font-bold uppercase">Check-In</span>
                    <span className="text-xs font-extrabold text-zinc-800 mt-0.5 block">
                      {formatDate(selectedBooking.bookedFromDate)}
                    </span>
                  </div>
                  <div className="bg-zinc-50 p-3 rounded-2xl">
                    <span className="block text-[10px] text-zinc-450 font-bold uppercase">Check-Out</span>
                    <span className="text-xs font-extrabold text-zinc-800 mt-0.5 block">
                      {formatDate(selectedBooking.bookedToDate)}
                    </span>
                  </div>
                  <div className="bg-zinc-50 p-3 rounded-2xl">
                    <span className="block text-[10px] text-zinc-450 font-bold uppercase">Duration</span>
                    <span className="text-xs font-extrabold text-zinc-800 mt-0.5 block">
                      {calculateNights(selectedBooking.bookedFromDate, selectedBooking.bookedToDate)} Nights
                    </span>
                  </div>
                  <div className="bg-zinc-50 p-3 rounded-2xl">
                    <span className="block text-[10px] text-zinc-450 font-bold uppercase">Guests</span>
                    <span className="text-xs font-extrabold text-zinc-800 mt-0.5 block">
                      {selectedBooking.personOfGuests || 1} Guests
                    </span>
                  </div>
                </div>
              </div>

              <hr className="border-zinc-100" />

              {/* Guest & Payment Info */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-black text-zinc-950 uppercase tracking-wider mb-2">Guest Information</h4>
                  <p className="text-xs font-bold text-zinc-700">
                    Name: <span className="text-zinc-650 font-semibold">{selectedBooking.bookingSource === "AIRBNB" ? "Airbnb Guest" : (selectedBooking.user?.fullName || "Guest Name")}</span>
                  </p>
                  <p className="text-xs font-bold text-zinc-700 mt-1">
                    Booking Source: <span className="text-zinc-650 font-semibold uppercase tracking-wider">{selectedBooking.bookingSource || "Hostibook Direct"}</span>
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-black text-zinc-950 uppercase tracking-wider mb-2">Payment Information</h4>
                  <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-blue-600 font-extrabold uppercase">Total Paid Amount</span>
                      <span className="block text-xl font-black text-blue-700 mt-0.5">
                        ${selectedBooking.totalPrice?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-[10px] font-extrabold uppercase rounded-lg">
                      PAID SUCCESS
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer Actions */}
            <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex gap-3">
              {selectedBooking.bookingSource !== "AIRBNB" && selectedBooking.user?.id && (
                <button
                  onClick={() => {
                    handleMessageUser(selectedBooking);
                    setSelectedBooking(null);
                  }}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer text-center"
                >
                  Message Guest
                </button>
              )}
              <button
                onClick={handleCloseModal}
                className="flex-1 px-4 py-3 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-extrabold rounded-xl transition-all cursor-pointer text-center"
              >
                Close Details
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
