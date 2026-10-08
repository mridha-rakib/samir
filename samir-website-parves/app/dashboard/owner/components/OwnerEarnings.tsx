import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useGetPartnerTotalEarningsHotelQuery } from "@/redux/api/statisticsApi";
import { useGetMyTransactionsQuery } from "@/redux/api/paymentApi";
import Pagination from "@/app/components/Pagination";

interface OwnerEarningsProps {
  triggerNotification: (msg: string, type?: "success" | "error") => void;
}

const timeRangeOptions = [
  { value: "ALL_TIME", label: "All Time" },
  { value: "THIS_WEEK", label: "This Week" },
  { value: "THIS_MONTH", label: "This Month" },
  { value: "THIS_YEAR", label: "This Year" },
];

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return dateStr;
  }
};

export default function OwnerEarnings({ triggerNotification }: OwnerEarningsProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState("ALL_TIME");
  const { data: statsResponse, isLoading } = useGetPartnerTotalEarningsHotelQuery(selectedTimeRange);
  
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: txResponse, isLoading: isLoadingTx } = useGetMyTransactionsQuery(undefined);
  const [txFilter, setTxFilter] = useState<"ALL" | "INCOMING" | "OUTGOING">("ALL");
  const [page, setPage] = useState(1);
  const limit = 10;

  React.useEffect(() => {
    setPage(1);
  }, [txFilter]);

  const stats = statsResponse?.data || {
    totalEarnings: 0,
    totalBookings: 0,
    earningsTrend: [],
    bookingsTrend: [],
  };

  const transactions = useMemo(() => {
    return Array.isArray(txResponse?.data) ? txResponse.data : [];
  }, [txResponse]);

  const processedTx = useMemo(() => {
    const list = transactions.map((tx: any) => {
      const isIncoming =
        tx.partnerId === user?.id ||
        tx.partnerId === (user as any)?._id ||
        tx.providerId === user?.id ||
        tx.providerId === (user as any)?._id;

      let title = "";
      let subtitle = "";
      if (tx.serviceType === "HOTEL") {
        title = tx.hotel_booking?.hotel?.propertyTitle || tx.description || "Property Booking";
        subtitle = isIncoming
          ? `Guest: ${tx.user?.fullName || "N/A"} (${tx.user?.email || ""})`
          : `Host ID: ${tx.partnerId || "N/A"}`;
      } else if (tx.serviceType === "SERVICE") {
        title = tx.service_booking?.serviceName || tx.description || "Service Booking";
        subtitle = isIncoming
          ? `Client: ${tx.user?.fullName || "N/A"}`
          : `For Property: ${tx.service_booking?.property || "My Property"}`;
      } else {
        title = tx.description || "Subscription Payment";
        subtitle = `Type: ${tx.serviceType}`;
      }

      return {
        ...tx,
        isIncoming,
        title,
        subtitle,
      };
    });

    if (txFilter === "INCOMING") {
      return list.filter((t: any) => t.isIncoming);
    }
    if (txFilter === "OUTGOING") {
      return list.filter((t: any) => !t.isIncoming);
    }
    return list;
  }, [transactions, txFilter, user]);

  const maxEarning = Math.max(...(stats.earningsTrend || []).map((t: any) => t.earnings || 0), 1);
  const maxBooking = Math.max(...(stats.bookingsTrend || []).map((t: any) => t.bookings || 0), 1);

  const paginatedTx = useMemo(() => {
    const startIndex = (page - 1) * limit;
    return processedTx.slice(startIndex, startIndex + limit);
  }, [processedTx, page, limit]);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-10 pb-24 md:pb-8 w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="text-left">
          <h2 className="text-xl sm:text-2xl font-black text-zinc-955 tracking-tight">Earning Overview</h2>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400 font-semibold">Track your payments, revenues, and booking stats</p>
        </div>
        
        {/* Dropdown filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Period:</label>
          <select
            value={selectedTimeRange}
            onChange={(e) => {
              setSelectedTimeRange(e.target.value);
              triggerNotification(`Switched range to ${timeRangeOptions.find(o => o.value === e.target.value)?.label}`);
            }}
            className="bg-white border border-zinc-150 rounded-xl px-4 py-2 text-xs font-bold text-zinc-700 shadow-sm focus:outline-none focus:border-blue-500"
          >
            {timeRangeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-zinc-400 font-bold mt-2">Loading earnings overview...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Total Earnings Card */}
            <div className="bg-blue-600 p-6 rounded-3xl shadow-md text-left text-white relative overflow-hidden group">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-500/20 rounded-full group-hover:scale-110 transition-transform duration-500" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-200">Total Earnings</span>
              <h3 className="text-4xl font-black mt-2 text-gray-300">${stats.totalEarnings?.toFixed(2) || "0.00"}</h3>
              <p className="text-xs text-blue-100 mt-2 font-medium">
                Calculated for range: <span className="font-extrabold">{timeRangeOptions.find(o => o.value === selectedTimeRange)?.label}</span>
              </p>
            </div>

            {/* Total Bookings Card */}
            <div className="bg-zinc-955 p-6 rounded-3xl shadow-md text-left text-white relative overflow-hidden group">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-zinc-800/20 rounded-full group-hover:scale-110 transition-transform duration-500" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">Total Bookings</span>
              <h3 className="text-4xl font-black mt-2 text-gray-300">{stats.totalBookings || 0}</h3>
              <p className="text-xs text-zinc-300 mt-2 font-medium">
                Completed bookings in selected period
              </p>
            </div>
          </div>

          {/* Charts / Trends Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
            {/* Earnings Trend bar chart */}
            <div className="bg-white border border-zinc-150 p-6 rounded-3xl shadow-sm text-left">
              <h4 className="text-sm font-black text-zinc-955 mb-6 uppercase tracking-wider text-zinc-400">Earnings Trend</h4>
              
              <div className="space-y-4">
                <div className="h-64 flex items-end justify-between gap-2 pt-6 border-b border-zinc-200 px-2 relative">
                  {/* Y-Axis Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                    <div className="border-t border-zinc-100 w-full h-0" />
                    <div className="border-t border-zinc-100 w-full h-0" />
                    <div className="border-t border-zinc-100 w-full h-0" />
                    <div className="border-t border-zinc-100 w-full h-0" />
                  </div>
                  {/* Bars */}
                  {(stats.earningsTrend || []).map((trend: any) => {
                    const percent = (trend.earnings / maxEarning) * 100;
                    return (
                      <div key={trend.month} className="flex-1 h-full flex flex-col justify-end items-center group relative z-10">
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 bg-zinc-955 text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                          ${trend.earnings?.toFixed(2)}
                        </div>
                        <div
                          style={{ height: `${Math.max(5, percent)}%` }}
                          className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg group-hover:from-blue-700 group-hover:to-blue-500 transition-all duration-500"
                        />
                        <span className="text-[10px] text-zinc-400 font-bold mt-2 truncate w-full text-center">
                          {trend.monthName?.slice(0, 3)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {(!stats.earningsTrend || stats.earningsTrend.length === 0) && (
                  <p className="text-xs text-zinc-400 py-8 text-center font-bold">No earnings data found for this period</p>
                )}
              </div>
            </div>

            {/* Bookings Trend bar chart */}
            <div className="bg-white border border-zinc-150 p-6 rounded-3xl shadow-sm text-left">
              <h4 className="text-sm font-black text-zinc-955 mb-6 uppercase tracking-wider text-zinc-400">Bookings Trend</h4>
              
              <div className="space-y-4">
                <div className="h-64 flex items-end justify-between gap-2 pt-6 border-b border-zinc-200 px-2 relative">
                  {/* Y-Axis Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                    <div className="border-t border-zinc-100 w-full h-0" />
                    <div className="border-t border-zinc-100 w-full h-0" />
                    <div className="border-t border-zinc-100 w-full h-0" />
                    <div className="border-t border-zinc-100 w-full h-0" />
                  </div>
                  {/* Bars */}
                  {(stats.bookingsTrend || []).map((trend: any) => {
                    const percent = (trend.bookings / maxBooking) * 100;
                    return (
                      <div key={trend.month} className="flex-1 h-full flex flex-col justify-end items-center group relative z-10">
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 bg-zinc-955 text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                          {trend.bookings} bookings
                        </div>
                        <div
                          style={{ height: `${Math.max(5, percent)}%` }}
                          className="w-full bg-gradient-to-t from-zinc-950 to-zinc-800 rounded-t-lg group-hover:from-zinc-900 group-hover:to-zinc-700 transition-all duration-500"
                        />
                        <span className="text-[10px] text-zinc-400 font-bold mt-2 truncate w-full text-center">
                          {trend.monthName?.slice(0, 3)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {(!stats.bookingsTrend || stats.bookingsTrend.length === 0) && (
                  <p className="text-xs text-zinc-400 py-8 text-center font-bold">No bookings data found for this period</p>
                )}
              </div>
            </div>
          </div>

          {/* Statement/Transaction History Section */}
          <div className="bg-white border border-zinc-150 p-6 rounded-3xl shadow-sm text-left space-y-6 mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-100 pb-5">
              <div>
                <h4 className="text-base font-black text-zinc-955 tracking-tight">Statement History</h4>
                <p className="text-xs text-zinc-400 font-semibold mt-0.5">Track your incoming bookings revenue and outgoing service expenses</p>
              </div>

              {/* bKash styled segment filter pills */}
              <div className="flex bg-zinc-50 border border-zinc-200 p-1 rounded-2xl gap-1">
                {(["ALL", "INCOMING", "OUTGOING"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTxFilter(filter)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-wide uppercase transition-all duration-200 ${
                      txFilter === filter
                        ? "bg-zinc-955 text-gray-400 shadow-sm"
                        : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {isLoadingTx ? (
              <div className="py-12 text-center">
                <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-[11px] text-zinc-400 font-bold mt-2">Loading transactions...</p>
              </div>
            ) : processedTx.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-zinc-200 rounded-2xl bg-zinc-50/50">
                <svg className="w-12 h-12 text-zinc-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <p className="text-xs text-zinc-400 font-bold">No statement logs found for this filter.</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {paginatedTx.map((tx: any) => {
                  const isIncoming = tx.isIncoming;
                  return (
                    <div key={tx.id} className="py-4 flex items-center justify-between gap-4 hover:bg-zinc-50/30 px-2 rounded-2xl transition-all">
                      {/* Icon & Title Group */}
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Transaction Icon */}
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${
                            isIncoming
                              ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                              : "bg-zinc-50 border-zinc-200 text-zinc-600"
                          }`}
                        >
                          {isIncoming ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            </svg>
                          )}
                        </div>

                        {/* Title and details */}
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-zinc-955 truncate leading-snug">{tx.title}</h5>
                          <p className="text-[10px] text-zinc-400 font-semibold leading-normal truncate">{tx.subtitle}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] text-zinc-400/80 font-mono">TXN: {tx.id.slice(-8).toUpperCase()}</span>
                            <span className="w-1 h-1 bg-zinc-200 rounded-full" />
                            <span className="text-[9px] text-zinc-400/80 font-semibold">{formatDate(tx.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right amount and status section */}
                      <div className="text-right shrink-0">
                        <span
                          className={`text-xs font-black font-sans block ${
                            isIncoming ? "text-emerald-600" : "text-zinc-955"
                          }`}
                        >
                          {isIncoming ? "+" : "-"}${tx.amount.toFixed(2)}
                        </span>
                        
                        {/* Status Badge */}
                        <span
                          className={`inline-block text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md mt-1 border ${
                            tx.status === "PAID" || tx.status === "SUCCESS"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : tx.status === "IN_HOLD"
                              ? "bg-amber-50 text-amber-700 border-amber-100"
                              : tx.status === "REFUNDED"
                              ? "bg-blue-50 text-blue-700 border-blue-100"
                              : "bg-red-50 text-red-700 border-red-100"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {processedTx.length > 0 && (
              <Pagination
                currentPage={page}
                totalItems={processedTx.length}
                limit={limit}
                onPageChange={setPage}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
