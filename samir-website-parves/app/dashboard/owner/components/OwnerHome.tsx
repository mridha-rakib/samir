import React from "react";
import { CalendarIcon } from "./Icons";
import { useGetMyDashboardForPropertyOwnerQuery } from "@/redux/api/statisticsApi";
import { useGetMyProfileQuery } from "@/redux/api/userApi";
import { useGetAllHotelBookingsQuery } from "@/redux/api/hotelBookingApi";
import { useNotification } from "./PropertyOwnerLayout";
import { useGetPartnerHotelsQuery } from "@/redux/api/hotelApi";
import { useGetAllServicesQuery } from "@/redux/api/serviceApi";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

interface OwnerHomeProps {
  profName: string;
  onNavigateTab: (tab: "home" | "properties" | "bookings" | "guests" | "earnings" | "chat" | "profile") => void;
  onStartWizard: () => void;
  triggerNotification: (msg: string, type?: "success" | "error") => void;
}

export default function OwnerHome({
  profName,
  onNavigateTab,
  onStartWizard,
  triggerNotification: propTriggerNotification,
}: OwnerHomeProps) {
  const { triggerNotification: contextTrigger, openNotifications, unreadCount, navigateTab: contextNavigateTab } = useNotification();
  const triggerNotification = contextTrigger || propTriggerNotification;
  const onNavigateTabFn = contextNavigateTab || onNavigateTab;
  const router = useRouter();
  const { data: statsResponse, isLoading } = useGetMyDashboardForPropertyOwnerQuery(undefined);
  const { data: profileResponse } = useGetMyProfileQuery(undefined);
  const profile = profileResponse?.data;
  const { data: bookingsResponse } = useGetAllHotelBookingsQuery(undefined);
  const bookings = bookingsResponse?.data?.data || [];

  // Dynamic dashboard collections queries
  const { data: hotelsResponse, isLoading: isLoadingHotels } = useGetPartnerHotelsQuery(undefined);
  const myProperties = hotelsResponse?.data?.data || [];

  const { data: servicesResponse, isLoading: isLoadingServices } = useGetAllServicesQuery({ limit: 1 });
  const featuredService = servicesResponse?.data?.data?.[0];

  const handleAddProperty = () => {
    if (profile?.isStripeConnected) {
      router.push("/dashboard/propertyowner/my_properties?role=property+owner&wizard=true");
    } else {
      triggerNotification(
        "Please complete your Stripe onboarding from Payment Settings to add a property.",
        "error"
      );
    }
  };

  // Dynamic calendar calculations
  const [showCalendarInfo, setShowCalendarInfo] = React.useState(false);
  const [currentDate] = React.useState(() => new Date());
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthLabel = `${monthNames[currentMonth]} ${currentYear}`;

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const totalDaysInPrevMonth = new Date(prevMonthYear, prevMonth + 1, 0).getDate();

  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => {
    return totalDaysInPrevMonth - firstDayOfMonth + 1 + i;
  });
  const daysInMonth = Array.from({ length: totalDaysInMonth }, (_, i) => i + 1);

  const getBookingForDay = (day: number) => {
    const dayDate = new Date(currentYear, currentMonth, day);
    dayDate.setHours(0, 0, 0, 0);

    return bookings.find((b: any) => {
      if (!b.bookedFromDate || !b.bookedToDate) return false;
      const start = new Date(b.bookedFromDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(b.bookedToDate);
      end.setHours(0, 0, 0, 0);
      return dayDate >= start && dayDate <= end;
    });
  };
  const stats = statsResponse?.data || {
    totalProperties: 0,
    totalServices: 0,
    totalBookings: 0,
    totalPayments: 0,
  };

  const statCards = [
    { title: "My Properties", value: isLoading ? "..." : stats.totalProperties.toString(), badge: "Active", key: "properties" as const },
    { title: "Service Bookings", value: isLoading ? "..." : stats.totalServices.toString(), badge: "Pending", key: "bookings" as const },
    { title: "Guest Management", value: isLoading ? "..." : stats.totalBookings.toString(), badge: "Guests", key: "guests" as const },
    { title: "My Earnings", value: isLoading ? "..." : `$${stats.totalPayments}`, badge: "Total", key: "earnings" as const },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-10 pb-24 md:pb-8 w-full max-w-7xl mx-auto space-y-8">
      {/* Welcome banner */}
      <div className="relative overflow-hidden flex items-center justify-between p-6 sm:p-8 rounded-[2rem] bg-gradient-to-br from-blue-900 via-indigo-900 to-indigo-950 text-white shadow-xl shadow-blue-900/20 text-left border border-white/10">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-blue-400/20 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-10 -mb-20 w-48 h-48 rounded-full bg-purple-500/20 blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-sm flex items-center gap-2">
            Good Evening, {profName} <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-blue-300 fill-blue-300/30 animate-pulse" />
          </h2>
          <p className="mt-2 text-sm sm:text-base text-blue-100/80 font-medium">
            Here's your today's overview. Manage your properties effortlessly.
          </p>
        </div>
        <button
          onClick={openNotifications}
          className="hidden sm:flex relative z-10 h-14 w-14 rounded-full border border-white/20 bg-white/10 backdrop-blur-md p-3 text-white items-center justify-center shrink-0 hover:bg-white/20 transition-all cursor-pointer shadow-lg shadow-black/10 hover:scale-105 active:scale-95"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 w-5 h-5 bg-pink-500 text-white rounded-full text-[10px] font-black flex items-center justify-center shadow-md">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Stat cards grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {statCards.map((stat, idx) => (
          <button
            key={idx}
            onClick={() => {
              onNavigateTabFn(stat.key);
            }}
            className="group relative p-6 bg-white/60 backdrop-blur-lg border border-white rounded-[2rem] text-left shadow-lg shadow-zinc-200/40 hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-500 hover:-translate-y-1 overflow-hidden"
          >
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-blue-400/10 to-purple-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative z-10 flex flex-col justify-between h-full">
                <span className="text-xs font-black text-zinc-400 uppercase tracking-wider group-hover:text-blue-500 transition-colors">{stat.title}</span>
                <div className="flex flex-col sm:flex-row sm:items-end justify-between mt-4 gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-zinc-900 drop-shadow-sm">{stat.value}</span>
                    <span className="w-fit px-3 py-1 bg-white border border-blue-100 text-blue-600 font-black text-[10px] rounded-full shadow-sm group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-300">
                        {stat.badge}
                    </span>
                </div>
            </div>
          </button>
        ))}
      </div>

      {/* Quick actions & Calendar Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Quick actions (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-zinc-150 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-black tracking-tight text-zinc-950 mb-4 text-left">Quick Actions</h3>
            
            <div className="space-y-3">
              <button
                onClick={handleAddProperty}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/10 active:scale-[0.99] transition-all text-sm"
              >
                + ADD PROPERTY
              </button>
              <button
                  onClick={() => onNavigateTabFn("bookings")}
                  className="w-full py-4 border-2 border-blue-600 hover:bg-blue-50 text-blue-600 rounded-2xl font-bold transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  BOOKING
                </button>
                <button
                  onClick={() => onNavigateTabFn("earnings")}
                  className="w-full py-4 border-2 border-blue-600 hover:bg-blue-50 text-blue-600 rounded-2xl font-bold transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  VIEW ANALYTICS
                </button>
            </div>
          </div>
        </div>

        {/* Calendar Widget (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-zinc-150 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-4 relative">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black tracking-tight text-zinc-955">Calendar Overview</h3>
              <button
                type="button"
                onClick={() => setShowCalendarInfo(!showCalendarInfo)}
                className="text-zinc-400 hover:text-blue-600 transition-colors p-1 rounded-full hover:bg-zinc-50 cursor-pointer"
                title="View Calendar Legend"
              >
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>

              {/* Calendar Info Legend Popover */}
              {showCalendarInfo && (
                <div className="absolute left-0 top-8 z-30 w-72 bg-white border border-zinc-200 p-4 rounded-2xl shadow-xl animate-fade-in text-left">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-100 mb-2.5">
                    <span className="text-xs font-black text-zinc-900 uppercase tracking-wider">Calendar Legend</span>
                    <button
                      onClick={() => setShowCalendarInfo(false)}
                      className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <p className="text-[10px] text-zinc-500 font-semibold leading-relaxed mb-3">
                    This calendar displays dates occupied by guest bookings for your listed properties during this month.
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded bg-blue-600 shrink-0" />
                      <div>
                        <span className="block text-[10px] font-bold text-zinc-800 leading-none">Confirmed Booking</span>
                        <span className="block text-[9px] text-zinc-400 font-semibold leading-normal mt-0.5">Paid, confirmed, or successful stays.</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded bg-blue-100 shrink-0" />
                      <div>
                        <span className="block text-[10px] font-bold text-blue-700 leading-none">Pending Booking</span>
                        <span className="block text-[9px] text-zinc-400 font-semibold leading-normal mt-0.5">Awaiting payment or verification.</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded border border-zinc-200 bg-white shrink-0" />
                      <div>
                        <span className="block text-[10px] font-bold text-zinc-700 leading-none">Available Date</span>
                        <span className="block text-[9px] text-zinc-400 font-semibold leading-normal mt-0.5">No active bookings registered.</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <span className="text-xs font-bold text-zinc-400">{monthLabel}</span>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-zinc-400 mb-2">
            <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
            {emptyDays.map((d) => (
              <span key={`empty-${d}`} className="py-2.5 text-zinc-200">{d}</span>
            ))}

            {daysInMonth.map((d) => {
              const booking = getBookingForDay(d);
              if (booking) {
                const isConfirmed = booking.bookingStatus === "CONFIRMED" || booking.bookingStatus === "COMPLETED";
                return (
                  <span
                    key={d}
                    title={booking.hotel?.propertyTitle || "Booked"}
                    className={`py-2.5 font-bold rounded-xl ${
                      isConfirmed
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-500/10"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {d}
                  </span>
                );
              }
              return (
                <span key={d} className="py-2.5 font-bold text-zinc-700 hover:bg-zinc-50 rounded-xl">
                  {d}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Refined Bottom Design: Curated for You */}
      {(isLoadingHotels || myProperties.length > 0 || isLoadingServices || featuredService) && (
        <div className="space-y-4 border-t border-zinc-200 pt-6">
        <h3 className="text-lg font-black text-zinc-950 tracking-tight">Curated for You</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Property Card */}
          {isLoadingHotels ? (
            <div className="relative rounded-3xl overflow-hidden shadow-md h-64 md:h-72 bg-zinc-200 animate-pulse text-left flex flex-col justify-end p-6">
              <div className="w-24 h-3 bg-zinc-300 rounded-full mb-2"></div>
              <div className="w-3/4 h-6 bg-zinc-300 rounded-md mb-3"></div>
              <div className="w-full h-4 bg-zinc-300 rounded-md mb-1.5"></div>
              <div className="w-5/6 h-4 bg-zinc-300 rounded-md mb-4"></div>
              <div className="w-32 h-4 bg-zinc-300 rounded-md"></div>
            </div>
          ) : myProperties.length > 0 ? (
            (() => {
              const mainProp = myProperties[0];
              const coverImg = mainProp.uploadPhotosOrVideos?.[0] || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80";
              return (
                <div className="relative rounded-3xl overflow-hidden shadow-md group h-64 md:h-72 text-left">
                  <img
                    src={coverImg}
                    alt={mainProp.propertyTitle}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/20 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 text-white text-left">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-200">Your Property</span>
                    <h4 className="text-xl font-extrabold mt-1 tracking-tight truncate">{mainProp.propertyTitle}</h4>
                    <p className="text-xs text-zinc-250 mt-1.5 font-medium leading-relaxed max-w-sm line-clamp-2">
                      {mainProp.propertyDescription || mainProp.propertyAddress}
                    </p>
                    <button
                      onClick={() => onNavigateTabFn("properties")}
                      className="mt-3 flex items-center gap-1 text-xs font-bold text-white hover:text-blue-200 transition-colors cursor-pointer"
                    >
                      Manage Property
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })()
          ) : null}

          {/* Service Card */}
          {isLoadingServices ? (
            <div className="relative rounded-3xl overflow-hidden shadow-md h-64 md:h-72 bg-zinc-200 animate-pulse text-left flex flex-col justify-end p-6">
              <div className="w-24 h-3 bg-zinc-300 rounded-full mb-2"></div>
              <div className="w-3/4 h-6 bg-zinc-300 rounded-md mb-3"></div>
              <div className="w-full h-4 bg-zinc-300 rounded-md mb-1.5"></div>
              <div className="w-5/6 h-4 bg-zinc-300 rounded-md mb-4"></div>
              <div className="w-32 h-4 bg-zinc-300 rounded-md"></div>
            </div>
          ) : featuredService ? (
            <div className="relative rounded-3xl overflow-hidden shadow-md group h-64 md:h-72 text-left">
              <img
                src={featuredService.coverImage || "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80"}
                alt={featuredService.serviceName}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white text-left">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-200">Recommended Service</span>
                <h4 className="text-xl font-extrabold mt-1 tracking-tight truncate">{featuredService.serviceName}</h4>
                <p className="text-xs text-zinc-250 mt-1.5 font-medium leading-relaxed max-w-sm line-clamp-2">
                  {featuredService.description}
                </p>
                <button
                  onClick={() => onNavigateTabFn("bookings")}
                  className="mt-3 flex items-center gap-1 text-xs font-bold text-white hover:text-blue-200 transition-colors cursor-pointer"
                >
                  Hire Service
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      )}
    </div>
  );
}
