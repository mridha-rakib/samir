import React, { useState } from "react";
import { useGetServiceProviderTotalEarningsServiceQuery } from "@/redux/api/statisticsApi";

interface ProviderEarningsProps {
  onBack: () => void;
  triggerNotification: (msg: string, type?: "success" | "error") => void;
}

const timeRangeOptions = [
  { value: "ALL_TIME", label: "All Time" },
  { value: "THIS_WEEK", label: "This Week" },
  { value: "THIS_MONTH", label: "This Month" },
  { value: "THIS_YEAR", label: "This Year" },
];

export default function ProviderEarnings({ onBack, triggerNotification }: ProviderEarningsProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState("ALL_TIME");
  const { data: statsResponse, isLoading } = useGetServiceProviderTotalEarningsServiceQuery(selectedTimeRange);

  const stats = statsResponse?.data || {
    totalEarnings: 0,
    totalBookings: 0,
    earningsTrend: [],
    bookingsTrend: [],
  };

  const maxEarning = Math.max(...(stats.earningsTrend || []).map((t: any) => t.earnings || 0), 1);
  const maxBooking = Math.max(...(stats.bookingsTrend || []).map((t: any) => t.bookings || 0), 1);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-10 pb-24 md:pb-8 w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="text-left">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-zinc-900 transition-colors uppercase tracking-wider mb-2 cursor-pointer"
          >
            ← Back to Home
          </button>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight">Earning Overview</h2>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400 font-semibold">Track your payments, service revenues, and work slots stats</p>
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
            <div className="bg-zinc-950 p-6 rounded-3xl shadow-md text-left text-white relative overflow-hidden group">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-zinc-800/20 rounded-full group-hover:scale-110 transition-transform duration-500" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">Total Bookings</span>
              <h3 className="text-4xl font-black mt-2 text-gray-300">{stats.totalBookings || 0}</h3>
              <p className="text-xs text-zinc-300 mt-2 font-medium">
                Completed jobs in selected period
              </p>
            </div>
          </div>

          {/* Charts / Trends Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
            {/* Earnings Trend bar chart */}
            <div className="bg-white border border-zinc-150 p-6 rounded-3xl shadow-sm text-left">
              <h4 className="text-sm font-black text-zinc-950 mb-6 uppercase tracking-wider text-zinc-400">Earnings Trend</h4>
              
              {/* Vertical bar chart container */}
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
                        <div className="absolute bottom-full mb-2 bg-zinc-950 text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
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
              <h4 className="text-sm font-black text-zinc-950 mb-6 uppercase tracking-wider text-zinc-400">Bookings Trend</h4>
              
              {/* Vertical bar chart container */}
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
                        <div className="absolute bottom-full mb-2 bg-zinc-950 text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
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
        </div>
      )}
    </div>
  );
}
