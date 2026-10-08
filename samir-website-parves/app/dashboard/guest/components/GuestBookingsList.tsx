import React, { useState } from "react";
import { useGetGuestBookingsQuery } from "@/redux/api/hotelBookingApi";
import Pagination from "@/app/components/Pagination";

interface Booking {
  id: string;
  property_name: string;
  property_image: string;
  check_in_date: string;
  check_out_date: string;
  status: "UPCOMING" | "COMPLETED" | "CANCELLED";
  total_price: string;
}

interface GuestBookingsListProps {
  onSelectBooking: (bookingId: string) => void;
  triggerNotification: (msg: string, type?: "success" | "error") => void;
}

export default function GuestBookingsList({
  onSelectBooking,
  triggerNotification,
}: GuestBookingsListProps) {
  const [activeTab, setActiveTab] = useState<"UPCOMING" | "COMPLETED" | "CANCELLED">("UPCOMING");
  
  const [page, setPage] = useState(1);
  const limit = 5;

  React.useEffect(() => {
    setPage(1);
  }, [activeTab]);

  // Query bookings with status parameter
  const { data: bookingsResponse, isLoading, isFetching } = useGetGuestBookingsQuery({
    status: activeTab,
    page,
    limit,
  });

  const bookings: Booking[] = bookingsResponse?.data || [];

  const handleTabChange = (tab: "UPCOMING" | "COMPLETED" | "CANCELLED") => {
    setActiveTab(tab);
  };

  const getStatusColors = (status: string) => {
    switch (status) {
      case "UPCOMING":
        return "bg-blue-50 text-blue-600 border-blue-100";
      case "COMPLETED":
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "CANCELLED":
      default:
        return "bg-rose-50 text-rose-600 border-rose-100";
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 lg:p-10 max-w-4xl mx-auto space-y-6 text-left animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight">My Bookings</h2>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400 font-semibold">Track and manage your stay reservations</p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-zinc-100 p-1 rounded-2xl w-full sm:w-auto self-start sm:self-center">
          {(["UPCOMING", "COMPLETED", "CANCELLED"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 uppercase tracking-wider ${
                activeTab === tab
                  ? "bg-white text-zinc-950 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              {tab.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading || isFetching ? (
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-zinc-400 font-bold mt-3 animate-pulse">Loading bookings...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-zinc-150 p-8 shadow-sm">
          <svg
            className="w-16 h-16 text-zinc-300 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm font-bold text-zinc-400">No {activeTab.toLowerCase()} bookings found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              onClick={() => onSelectBooking(booking.id)}
              className="bg-white border border-zinc-150 rounded-3xl p-4 flex flex-col md:flex-row gap-4 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group"
            >
              {/* Cover Image */}
              <div className="h-44 md:h-28 w-full md:w-36 rounded-2xl overflow-hidden shrink-0 border relative">
                <img
                  src={booking.property_image}
                  alt={booking.property_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=400&q=80";
                  }}
                />
              </div>

              {/* Booking Details */}
              <div className="flex-1 flex flex-col justify-between text-left">
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-base sm:text-lg font-black text-zinc-900 leading-snug group-hover:text-blue-600 transition-colors truncate max-w-[250px] sm:max-w-md">
                      {booking.property_name}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${getStatusColors(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                  
                  {/* Dates */}
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
                    <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{booking.check_in_date} – {booking.check_out_date}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-zinc-100 mt-4 pt-3">
                  <div className="text-left">
                    <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider block">Total Price</span>
                    <span className="text-base font-extrabold text-blue-600">{booking.total_price}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectBooking(booking.id);
                    }}
                    className="px-4 py-2.5 bg-zinc-50 hover:bg-blue-50 hover:text-blue-600 text-zinc-700 rounded-xl font-bold text-xs transition-colors border border-zinc-150 cursor-pointer"
                  >
                    View details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {bookingsResponse?.meta && (
        <Pagination
          currentPage={page}
          totalItems={bookingsResponse.meta.total}
          limit={limit}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
