import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useGetAllServicesQuery, useGetServiceByIdQuery } from "@/redux/api/serviceApi";
import { useGetSelectMyPropertiesQuery } from "@/redux/api/hotelApi";
import { useCreateServiceBookingMutation } from "@/redux/api/serviceBookingApi";
import { useCreateStripeCheckoutSessionServiceMutation } from "@/redux/api/paymentApi";
import { useToggleUserFavoriteMutation, useGetMySavedUsersQuery } from "@/redux/api/favoriteApi";
import { useNotification } from "./PropertyOwnerLayout";
import Pagination from "@/app/components/Pagination";
import { useDebounce } from "@/app/hooks/useDebounce";

interface OfferedService {
  price: number;
  serviceTypeName: string;
}

interface ServiceProvider {
  id: string;
  providerId?: string;
  serviceName: string;
  serviceType: string;
  address: string;
  description: string;
  experience: number;
  offered_services: OfferedService[];
  coverImage?: string;
  serviceRating?: number | string;
}

const minutesTo24Hour = (min: number): string => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const minutesTo12Hour = (min: number): string => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
};

const to12Hour = (time24: string): string => {
  if (!time24) return "";
  const [h, m] = time24.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
};

const getDayName = (dateStr: string) => {
  try {
    const safeDateStr = dateStr.includes("T") ? dateStr : `${dateStr}T12:00:00.000Z`;
    const d = new Date(safeDateStr);
    return d.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
  } catch {
    return "Monday";
  }
};

const parseTimeToMinutes = (timeStr: string): number => {
  if (!timeStr) return -1;
  const clean = timeStr.replace(/\s+/g, " ").trim().toUpperCase();

  // 24-hour HH:MM format
  const match24 = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    return parseInt(match24[1], 10) * 60 + parseInt(match24[2], 10);
  }

  // 12-hour H:MM AM/PM format
  const match12 = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const modifier = match12[3];

    if (modifier === "PM" && hours !== 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;

    return hours * 60 + minutes;
  }

  return -1;
};

interface OwnerServicesProps {
  triggerNotification?: (msg: string, type?: "success" | "error") => void;
}

export default function OwnerServices({ triggerNotification: propTriggerNotification }: OwnerServicesProps) {
  const router = useRouter();
  const { triggerNotification: layoutTriggerNotification } = useNotification();
  const triggerNotification = propTriggerNotification && propTriggerNotification.name !== "" ? propTriggerNotification : layoutTriggerNotification;
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  const [toggleFavorite] = useToggleUserFavoriteMutation();
  const { data: savedResponse } = useGetMySavedUsersQuery(undefined);
  const [favoriteLoadingId, setFavoriteLoadingId] = useState<string | null>(null);
  
  const savedUserIds = useMemo(() => {
    const list = Array.isArray(savedResponse?.data?.data)
      ? savedResponse.data.data
      : Array.isArray(savedResponse?.data)
      ? savedResponse.data
      : Array.isArray(savedResponse)
      ? savedResponse
      : [];
    return list.map((fav: any) => fav.savedUserId || fav.savedUser?._id || fav.savedUser?.id).filter(Boolean);
  }, [savedResponse]);

  const [page, setPage] = useState(1);
  const limit = 9;
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    setPage(1);
  }, [selectedCategory, debouncedSearchTerm]);

  // Search parameters for RTK query
  const queryParams = useMemo(() => {
    const params: Record<string, any> = { page, limit };
    if (selectedCategory !== "ALL" && selectedCategory !== "SAVED") {
      params.serviceType = selectedCategory;
    }
    if (debouncedSearchTerm.trim()) {
      params.searchTerm = debouncedSearchTerm.trim();
    }
    return params;
  }, [selectedCategory, debouncedSearchTerm, page, limit]);

  // Query service providers list
  const { data: servicesRes, isLoading: isLoadingServices } = useGetAllServicesQuery(queryParams);
  const providers: ServiceProvider[] = servicesRes?.data?.data || servicesRes?.data || [];

  const displayProviders = useMemo(() => {
    if (selectedCategory === "SAVED") {
      return providers.filter((p) => savedUserIds.includes(p.providerId || ""));
    }
    return providers;
  }, [selectedCategory, providers, savedUserIds]);

  // Query owner properties for booking dropdown
  const { data: propertiesRes } = useGetSelectMyPropertiesQuery(undefined);
  const properties = propertiesRes?.data || [];

  // Booking mutations
  const [createBooking, { isLoading: isBooking }] = useCreateServiceBookingMutation();
  const [createCheckout, { isLoading: isRedireting }] = useCreateStripeCheckoutSessionServiceMutation();

  // View Details Modal State
  const [viewingProvider, setViewingProvider] = useState<ServiceProvider | null>(null);

  // Booking Modal State
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const { data: fullServiceProviderRes } = useGetServiceByIdQuery(
    selectedProvider?.id || "",
    { skip: !selectedProvider?.id }
  );
  const providerDetails = fullServiceProviderRes?.data || selectedProvider;

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [bookingDate, setBookingDate] = useState<string>("");
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(() => new Date());
  const [timeFrom, setTimeFrom] = useState<string>("");
  const [timeTo, setTimeTo] = useState<string>("");
  const [selectedServices, setSelectedServices] = useState<OfferedService[]>([]);
  const [newServices, setNewServices] = useState<{ serviceTypeName: string; price: number }[]>([]);
  const [customServiceName, setCustomServiceName] = useState("");
  const [customServicePrice, setCustomServicePrice] = useState("");
  const [instructions, setInstructions] = useState<string>("");

  useEffect(() => {
    setTimeFrom("");
    setTimeTo("");
  }, [bookingDate]);

  useEffect(() => {
    setTimeTo("");
  }, [timeFrom]);

  const handleOpenBookingModal = (provider: ServiceProvider) => {
    setViewingProvider(null);
    setSelectedProvider(provider);
    setSelectedServices([]);
    setNewServices([]);
    setCustomServiceName("");
    setCustomServicePrice("");
    setBookingDate("");
    setTimeFrom("");
    setTimeTo("");
    setInstructions("");
    if (properties.length > 0) {
      setSelectedPropertyId(properties[0].id);
    }
  };

  const searchParams = useSearchParams();
  const providerIdParam = searchParams.get("providerId");

  useEffect(() => {
    if (providerIdParam && providers.length > 0) {
      const found = providers.find((p) => p.providerId === providerIdParam);
      if (found) {
        handleOpenBookingModal(found);
      }
    }
  }, [providerIdParam, providers]);

  const handleToggleService = (srv: OfferedService) => {
    if (selectedServices.some((s) => s.serviceTypeName === srv.serviceTypeName)) {
      setSelectedServices(selectedServices.filter((s) => s.serviceTypeName !== srv.serviceTypeName));
    } else {
      setSelectedServices([...selectedServices, srv]);
    }
  };

  const calculateTotalPrice = useMemo(() => {
    const defaultTotal = selectedServices.reduce((acc, curr) => acc + curr.price, 0);
    const customTotal = newServices.reduce((acc, curr) => acc + curr.price, 0);
    return defaultTotal + customTotal;
  }, [selectedServices, newServices]);

  const getAvailableIntervals = (slots: any[], bookings: any[]) => {
    let intervals = slots.map((s) => ({
      start: parseTimeToMinutes(s.from),
      end: parseTimeToMinutes(s.to),
    }));

    const bookedRanges = bookings
      .filter((b) => b.date === bookingDate)
      .map((b) => ({
        start: parseTimeToMinutes(b.timeSlot?.from),
        end: parseTimeToMinutes(b.timeSlot?.to),
      }))
      .filter((b) => b.start >= 0 && b.end > b.start);

    bookedRanges.forEach((booked) => {
      let nextIntervals: { start: number; end: number }[] = [];
      intervals.forEach((interval) => {
        if (booked.end <= interval.start || booked.start >= interval.end) {
          nextIntervals.push(interval);
        } else {
          if (booked.start > interval.start) {
            nextIntervals.push({ start: interval.start, end: booked.start });
          }
          if (booked.end < interval.end) {
            nextIntervals.push({ start: booked.end, end: interval.end });
          }
        }
      });
      intervals = nextIntervals;
    });

    return intervals;
  };

  const getStartTimeOptions = useMemo(() => {
    if (!bookingDate || !providerDetails) return [];
    const dayName = getDayName(bookingDate);
    const avail = (providerDetails as any)?.availability?.find(
      (a: any) => a.day.trim().toLowerCase() === dayName.toLowerCase()
    );
    if (!avail || !avail.slots) return [];

    const bookings = (providerDetails as any)?.serviceBookings || [];
    const availableIntervals = getAvailableIntervals(avail.slots, bookings);

    const options: { value: string; label: string; minutes: number }[] = [];
    
    availableIntervals.forEach((interval) => {
      const firstAligned = Math.ceil(interval.start / 15) * 15;
      for (let m = firstAligned; m < interval.end; m += 15) {
        options.push({
          value: minutesTo24Hour(m),
          label: minutesTo12Hour(m),
          minutes: m,
        });
      }
    });

    return options.sort((a, b) => a.minutes - b.minutes);
  }, [bookingDate, providerDetails]);

  const getEndTimeOptions = useMemo(() => {
    if (!bookingDate || !providerDetails || !timeFrom) return [];
    const startMin = parseTimeToMinutes(timeFrom);
    if (startMin < 0) return [];

    const dayName = getDayName(bookingDate);
    const avail = (providerDetails as any)?.availability?.find(
      (a: any) => a.day.trim().toLowerCase() === dayName.toLowerCase()
    );
    if (!avail || !avail.slots) return [];

    const bookings = (providerDetails as any)?.serviceBookings || [];
    const availableIntervals = getAvailableIntervals(avail.slots, bookings);

    const activeInterval = availableIntervals.find((interval) => {
      return startMin >= interval.start && startMin < interval.end;
    });

    if (!activeInterval) return [];

    const options: { value: string; label: string; minutes: number }[] = [];
    let hasEndAligned = false;

    for (let m = startMin + 15; m <= activeInterval.end; m += 15) {
      options.push({
        value: minutesTo24Hour(m),
        label: minutesTo12Hour(m),
        minutes: m,
      });
      if (m === activeInterval.end) hasEndAligned = true;
    }

    if (!hasEndAligned && activeInterval.end > startMin) {
      options.push({
        value: minutesTo24Hour(activeInterval.end),
        label: minutesTo12Hour(activeInterval.end),
        minutes: activeInterval.end,
      });
    }

    return options.sort((a, b) => a.minutes - b.minutes);
  }, [bookingDate, providerDetails, timeFrom]);

  const calendarDays = useMemo(() => {
    const year = currentCalendarMonth.getFullYear();
    const month = currentCalendarMonth.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const prevMonthYear = month === 0 ? year - 1 : year;
    const prevMonth = month === 0 ? 11 : month - 1;
    const totalDaysInPrev = new Date(prevMonthYear, prevMonth + 1, 0).getDate();

    const days: { date: Date; isCurrentMonth: boolean; isBookable: boolean; dateString: string; hasBookings: boolean }[] = [];

    // Empty spaces from prev month
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = new Date(prevMonthYear, prevMonth, totalDaysInPrev - i);
      const yearStr = d.getFullYear();
      const monthStr = String(d.getMonth() + 1).padStart(2, "0");
      const dateStr = String(d.getDate()).padStart(2, "0");
      days.push({
        date: d,
        isCurrentMonth: false,
        isBookable: false,
        dateString: `${yearStr}-${monthStr}-${dateStr}`,
        hasBookings: false,
      });
    }

    // Days of current month
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const providerWeekdays = (providerDetails as any)?.availability?.map(
      (a: any) => a.day.trim().toLowerCase()
    ) || [];

    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      const weekday = d.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
      
      const isPast = d < today;
      const isScheduled = providerWeekdays.includes(weekday);

      const yearStr = d.getFullYear();
      const monthStr = String(d.getMonth() + 1).padStart(2, "0");
      const dateStr = String(d.getDate()).padStart(2, "0");

      const dateString = `${yearStr}-${monthStr}-${dateStr}`;
      const providerBookings = (providerDetails as any)?.serviceBookings || [];
      const hasBookings = providerBookings.some((b: any) => b.date === dateString);

      days.push({
        date: d,
        isCurrentMonth: true,
        isBookable: !isPast && isScheduled,
        dateString: dateString,
        hasBookings,
      });
    }

    // Fill remaining grid spaces (up to 42)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const yearStr = d.getFullYear();
      const monthStr = String(d.getMonth() + 1).padStart(2, "0");
      const dateStr = String(d.getDate()).padStart(2, "0");
      days.push({
        date: d,
        isCurrentMonth: false,
        isBookable: false,
        dateString: `${yearStr}-${monthStr}-${dateStr}`,
        hasBookings: false,
      });
    }

    return days;
  }, [currentCalendarMonth, providerDetails]);


  const validation = useMemo(() => {
    if (!bookingDate) {
      return { isValid: false, message: "Please select a booking date first.", type: "info" };
    }

    const dayName = getDayName(bookingDate);
    const avail = (providerDetails as any)?.availability?.find(
      (a: any) => a.day.trim().toLowerCase() === dayName.toLowerCase()
    );

    if (!avail) {
      return {
        isValid: false,
        message: `Provider is not available on ${dayName}s.`,
        type: "error",
      };
    }

    if (!timeFrom || !timeTo) {
      const hoursStr = avail.slots?.map((s: any) => `${s.from} - ${s.to}`).join(", ");
      return {
        isValid: false,
        message: `Provider is available on ${dayName}s: ${hoursStr}. Please define your start and end times.`,
        type: "info",
      };
    }

    const startMin = parseTimeToMinutes(timeFrom);
    const endMin = parseTimeToMinutes(timeTo);

    if (startMin < 0 || endMin < 0) {
      return { isValid: false, message: "Invalid time selected.", type: "error" };
    }

    if (endMin <= startMin) {
      return { isValid: false, message: "End time must be after start time.", type: "error" };
    }

    const isWithinSlot = avail.slots?.some((slot: any) => {
      const slotStart = parseTimeToMinutes(slot.from);
      const slotEnd = parseTimeToMinutes(slot.to);
      return startMin >= slotStart && endMin <= slotEnd;
    });

    if (!isWithinSlot) {
      const hoursStr = avail.slots?.map((s: any) => `${s.from} - ${s.to}`).join(", ");
      return {
        isValid: false,
        message: `Selected times must be within the available slots: ${hoursStr}.`,
        type: "error",
      };
    }

    // Overlap validation check with existing bookings
    const bookings = (providerDetails as any)?.serviceBookings || [];
    const isOverlapping = bookings.some((booking: any) => {
      if (booking.date !== bookingDate) return false;
      const existingStart = parseTimeToMinutes(booking.timeSlot?.from);
      const existingEnd = parseTimeToMinutes(booking.timeSlot?.to);
      if (existingStart < 0 || existingEnd < 0) return false;
      return startMin < existingEnd && endMin > existingStart;
    });

    if (isOverlapping) {
      return {
        isValid: false,
        message: "This time slot is already booked.",
        type: "error",
      };
    }

    return { isValid: true, message: "Selected time slot is available!", type: "success" };
  }, [bookingDate, timeFrom, timeTo, providerDetails]);


  const handleAddCustomService = () => {
    if (!customServiceName.trim() || !customServicePrice) return;
    const price = parseFloat(customServicePrice);
    if (isNaN(price) || price <= 0) {
      triggerNotification("Please enter a valid price", "error");
      return;
    }
    setNewServices([...newServices, { serviceTypeName: customServiceName.trim(), price }]);
    setCustomServiceName("");
    setCustomServicePrice("");
  };

  const handleRemoveCustomService = (index: number) => {
    setNewServices(newServices.filter((_, i) => i !== index));
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider) return;
    if (!selectedPropertyId) {
      triggerNotification("Please select a property", "error");
      return;
    }
    if (!bookingDate) {
      triggerNotification("Please select a booking date", "error");
      return;
    }
    if (!timeFrom || !timeTo) {
      triggerNotification("Please define a time slot", "error");
      return;
    }
    if (selectedServices.length === 0) {
      triggerNotification("Please select at least one service/task to perform", "error");
      return;
    }

    const selectedProp = properties.find((p: any) => p.id === selectedPropertyId);
    const day = getDayName(bookingDate);

    const body = {
      property: selectedProp?.propertyTitle || "My Property",
      serviceName: selectedProvider.serviceName,
      offeredService: selectedServices,
      newOfferedService: newServices,
      date: bookingDate,
      day: day,
      timeSlot: { from: to12Hour(timeFrom), to: to12Hour(timeTo) },
      totalPrice: calculateTotalPrice,
      specialInstructions: instructions.trim(),
      hotelId: selectedPropertyId,
    };

    try {
      // 1. Create booking
      const res = await createBooking({ serviceId: selectedProvider.id, body }).unwrap();
      
      if (res.success && res.data?.id) {
        // 2. Create Stripe Checkout Session for Service
        const checkoutRes = await createCheckout(res.data.id).unwrap();
        const redirectUrl = checkoutRes.data?.url || checkoutRes.data?.checkoutUrl;
        if (checkoutRes.success && redirectUrl) {
          triggerNotification("Booking created! Payment opening in new tab...", "success");
          window.open(redirectUrl, "_blank");
        } else {
          triggerNotification(checkoutRes.message || "Failed to create payment checkout", "error");
        }
      } else {
        triggerNotification(res.message || "Failed to book service provider", "error");
      }
    } catch (err: any) {
      console.error(err);
      triggerNotification(err?.data?.message || "Something went wrong while booking.", "error");
    }
  };

  const serviceCategories = ["ALL", "Cleaning", "Plumbing", "Electrical", "Handyman", "Guard", "SAVED"];

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-10 pb-24 md:pb-8 w-full max-w-7xl mx-auto space-y-6 text-left animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-150 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-955 tracking-tight">Find & Hire Services</h2>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400 font-semibold">Book qualified service providers for your properties</p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search providers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-3 rounded-2xl border border-zinc-200 focus:border-blue-500 outline-none text-xs font-bold bg-white"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {serviceCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-200 capitalize border ${
              selectedCategory === cat
                ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/10"
                : "bg-white border-zinc-150 text-zinc-500 hover:border-zinc-300 hover:text-zinc-800"
            }`}
          >
            {cat === "SAVED" ? "Saved Providers" : cat.toLowerCase()}
          </button>
        ))}
      </div>

      {/* Service Providers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoadingServices ? (
          // Skeleton loading state
          Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white border border-zinc-150 rounded-3xl p-5 shadow-sm animate-pulse flex flex-col justify-between h-48"
            >
              <div className="space-y-3">
                <div className="h-4 w-20 bg-zinc-200 rounded-full"></div>
                <div className="h-5 w-3/4 bg-zinc-200 rounded"></div>
                <div className="h-4 w-1/2 bg-zinc-200 rounded"></div>
              </div>
              <div className="h-10 w-full bg-zinc-100 rounded-xl mt-4"></div>
            </div>
          ))
        ) : displayProviders.length === 0 ? (
          // Zero result state
          <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-20 bg-white rounded-3xl border border-zinc-150 p-8 shadow-sm">
            <svg className="w-16 h-16 text-zinc-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-sm font-bold text-zinc-400">
              {selectedCategory === "SAVED" 
                ? "You haven't saved any service providers yet." 
                : "No service providers found for this selection."}
            </p>
          </div>
        ) : (
          // List state
          displayProviders.map((p) => {
            const isSaved = savedUserIds.includes(p.providerId);
            const basePrice = p.offered_services?.[0]?.price || 15;
            return (
              <div
                key={p.id}
                className="bg-white border border-zinc-150 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                {/* Upper section */}
                <div className="flex gap-4 items-start">
                  {/* Avatar */}
                  <div className="w-14 h-14 rounded-full overflow-hidden relative shadow-inner shrink-0 border-2 border-zinc-100 flex items-center justify-center bg-zinc-200 bg-cover bg-center">
                    {p.coverImage ? (
                      <img
                        src={p.coverImage}
                        alt={p.serviceName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white text-lg font-black uppercase">
                        {p.serviceName ? p.serviceName[0] : "?"}
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-black text-zinc-955 truncate leading-tight">{p.serviceName}</h4>
                      {/* Bookmark Icon */}
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (favoriteLoadingId) return;
                          setFavoriteLoadingId(p.providerId || null);
                          try {
                            await toggleFavorite({ savedUserId: p.providerId }).unwrap();
                            triggerNotification(
                              isSaved
                                ? "Removed from saved providers"
                                : "Saved provider successfully!",
                              "success"
                            );
                          } catch (err) {
                            triggerNotification("Failed to toggle saved status", "error");
                          } finally {
                            setFavoriteLoadingId(null);
                          }
                        }}
                        disabled={favoriteLoadingId === p.providerId}
                        className={`p-1.5 rounded-full bg-blue-50 text-blue-650 hover:bg-blue-100 transition-colors shrink-0 cursor-pointer text-zinc-450 hover:text-red-500 ${
                          favoriteLoadingId === p.providerId ? "opacity-75 cursor-not-allowed" : ""
                        }`}
                        title={isSaved ? "Remove Bookmark" : "Save Provider"}
                      >
                        {favoriteLoadingId === p.providerId ? (
                          <svg className="w-3.5 h-3.5 animate-spin text-zinc-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg
                            className={`w-3.5 h-3.5 ${isSaved ? "fill-red-500 text-red-500" : "text-zinc-400"}`}
                            fill={isSaved ? "currentColor" : "none"}
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2.5"
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                          </svg>
                        )}
                      </button>
                    </div>

                    {/* Service type badge */}
                    <div className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-50 text-[10px] font-black text-blue-600 uppercase tracking-wide">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>{p.serviceType}</span>
                    </div>

                    {/* Location & Rating row */}
                    <div className="mt-2.5 flex items-center justify-between text-xs font-semibold gap-2">
                      <div className="flex items-center gap-1 min-w-0">
                        <svg className="w-3.5 h-3.5 text-zinc-450 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate text-zinc-500 font-sans" title={p.address}>{p.address}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg px-2 py-0.5">
                        <span>⭐</span>
                        <span className="font-extrabold text-[11px]">{p.serviceRating ? parseFloat(p.serviceRating.toString()).toFixed(1) : "0.0"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description snippet */}
                {p.description && (
                  <p className="text-xs text-zinc-500 font-medium leading-relaxed truncate text-left px-1">
                    {p.description}
                  </p>
                )}

                {/* Experience & Price footer row */}
                <div className="flex items-center justify-between border-t border-zinc-100 pt-3 text-[10px] text-zinc-400 font-bold px-1 uppercase tracking-wide">
                  <span>Experience: <strong className="text-zinc-800 font-sans">{p.experience} Years</strong></span>
                  <span>Base Price: <strong className="text-blue-600 font-sans">${basePrice}</strong></span>
                </div>

                {/* Action buttons row */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => setViewingProvider(p)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 border border-zinc-200 text-zinc-700 rounded-xl hover:bg-zinc-50 transition-colors text-xs font-black cursor-pointer font-sans"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Details
                  </button>
                  <button
                    onClick={() => handleOpenBookingModal(p)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-xs font-black cursor-pointer font-sans shadow-sm"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Book Service
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
      {servicesRes?.data?.meta && (
        <Pagination
          currentPage={page}
          totalItems={servicesRes.data.meta.total}
          limit={limit}
          onPageChange={setPage}
        />
      )}

      {/* View Details Modal */}
      {viewingProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col relative">
            <div className="relative h-48 bg-zinc-200 shrink-0">
              {viewingProvider.coverImage ? (
                <img src={viewingProvider.coverImage} alt={viewingProvider.serviceName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white text-3xl font-black uppercase">
                  {viewingProvider.serviceName[0]}
                </div>
              )}
              <button
                onClick={() => setViewingProvider(null)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-black/50 text-white rounded-full hover:bg-black/70 cursor-pointer backdrop-blur-md"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto text-left">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="text-xl font-black text-zinc-950">{viewingProvider.serviceName}</h3>
                  <div className="mt-1 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-50 text-[10px] font-black text-blue-600 uppercase tracking-wide">
                    {viewingProvider.serviceType}
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg px-2 py-0.5 shrink-0">
                  <span>⭐</span>
                  <span className="font-extrabold text-xs">{viewingProvider?.serviceRating ? parseFloat(viewingProvider.serviceRating.toString()).toFixed(1) : "0.0"}</span>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-zinc-500">
                <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {viewingProvider.address}
              </div>

              <div className="mt-4">
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Description</h4>
                <p className="text-sm text-zinc-600 leading-relaxed font-medium">
                  {viewingProvider.description || "No description provided."}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between border-y border-zinc-100 py-3">
                <div className="text-center">
                  <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Experience</span>
                  <span className="text-sm font-black text-zinc-800">{viewingProvider.experience} Years</span>
                </div>
                <div className="w-px h-8 bg-zinc-150"></div>
                <div className="text-center">
                  <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Base Price</span>
                  <span className="text-sm font-black text-blue-600">${viewingProvider.offered_services?.[0]?.price || 15}</span>
                </div>
              </div>

              {viewingProvider.offered_services?.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Available Packages</h4>
                  <div className="space-y-2">
                    {viewingProvider.offered_services.map((srv, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-zinc-50 border border-zinc-150">
                        <span className="text-xs font-bold text-zinc-800">{srv.serviceTypeName}</span>
                        <span className="text-xs font-black text-blue-600">${srv.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-zinc-150 bg-white flex gap-3">
              <button
                onClick={() => router.push(`/dashboard/propertyowner/chat?role=property%20owner&providerId=${viewingProvider.providerId}`)}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 border border-zinc-200 text-zinc-700 rounded-xl hover:bg-zinc-50 transition-colors text-xs font-black cursor-pointer shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Message
              </button>
              <button
                onClick={() => handleOpenBookingModal(viewingProvider)}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-xs font-black cursor-pointer shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Book Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Dialog Modal */}
      {selectedProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-zinc-200 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto relative">
            
            <div className="flex justify-between items-center pb-2 border-b border-zinc-150 text-left">
              <div>
                <h3 className="font-black text-base text-zinc-950">Book {selectedProvider.serviceName}</h3>
                <p className="text-[10px] text-zinc-400 font-semibold">{selectedProvider.serviceType} Specialist</p>
              </div>
              <button
                onClick={() => setSelectedProvider(null)}
                className="text-zinc-400 hover:text-zinc-650 font-extrabold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmBooking} className="space-y-4 text-left">
              {/* Property Selector */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">Select Property</label>
                {properties.length === 0 ? (
                  <p className="text-xs text-red-500 font-bold">Please add properties before hiring services.</p>
                ) : (
                  <select
                    value={selectedPropertyId}
                    onChange={(e) => setSelectedPropertyId(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-zinc-200 outline-none text-xs font-bold bg-zinc-50 cursor-pointer"
                  >
                    {properties.map((prop: any) => (
                      <option key={prop.id} value={prop.id}>
                        {prop.propertyTitle}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Provider Availability */}
              {(selectedProvider as any).availability?.length > 0 && (
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">Provider Schedule / Availability</label>
                  <div className="space-y-1 p-3 rounded-2xl bg-zinc-50 border border-zinc-150 text-[11px] font-bold text-zinc-700">
                    {(selectedProvider as any).availability.map((avail: any) => (
                      <div key={avail.day} className="flex justify-between items-center">
                        <span className="text-zinc-500 uppercase tracking-wider text-[9px]">{avail.day}</span>
                        <span className="text-zinc-800">
                          {avail.slots?.map((s: any) => `${s.from} - ${s.to}`).join(", ")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Date Selection (Monthly Calendar) */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 mb-2 uppercase tracking-wider font-sans">Select Booking Date</label>
                <div className="border border-zinc-150 rounded-3xl p-4 bg-zinc-50/50">
                  {/* Calendar Header */}
                  <div className="flex justify-between items-center mb-3">
                    <button
                      type="button"
                      onClick={() => setCurrentCalendarMonth(new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth() - 1, 1))}
                      className="p-1.5 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer text-[10px] font-black font-sans leading-none flex items-center justify-center h-7 w-7"
                    >
                      ◀
                    </button>
                    <span className="text-xs font-black text-zinc-800 font-sans">
                      {currentCalendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentCalendarMonth(new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth() + 1, 1))}
                      className="p-1.5 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer text-[10px] font-black font-sans leading-none flex items-center justify-center h-7 w-7"
                    >
                      ▶
                    </button>
                  </div>

                  {/* Weekdays Labels */}
                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-zinc-400 mb-2 font-sans">
                    <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                  </div>

                  {/* Days Grid */}
                  <div className="grid grid-cols-7 gap-1 text-center font-sans">
                    {calendarDays.map((day, idx) => {
                      const isSelected = bookingDate === day.dateString;
                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={!day.isBookable}
                          onClick={() => setBookingDate(day.dateString)}
                          className={`h-7 w-7 text-[10px] rounded-full flex items-center justify-center font-extrabold mx-auto transition-all ${
                            isSelected
                              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                              : day.isBookable
                              ? day.isCurrentMonth
                                ? day.hasBookings 
                                  ? "bg-amber-100 text-amber-700 hover:bg-amber-200 cursor-pointer shadow-inner shadow-amber-500/10"
                                  : "text-zinc-800 hover:bg-zinc-200 hover:text-zinc-950 cursor-pointer"
                                : "text-zinc-400 hover:bg-zinc-150 hover:text-zinc-650 cursor-pointer"
                              : "text-zinc-250 cursor-not-allowed"
                          }`}
                        >
                          {day.date.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Already Booked Times List */}
              {bookingDate && (
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">Already Booked Times</label>
                  {(() => {
                    const bookings = (providerDetails as any)?.serviceBookings?.filter(
                      (b: any) => b.date === bookingDate
                    ) || [];
                    if (bookings.length === 0) {
                      return (
                        <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-2xl text-[10px] font-bold text-emerald-700">
                          ✓ No bookings on this date. All slots available!
                        </div>
                      );
                    }
                    return (
                      <div className="space-y-1.5 p-3 rounded-2xl bg-rose-50/40 border border-rose-100 text-[10px] font-bold text-rose-700">
                        <div className="text-[9px] uppercase tracking-wider text-rose-500 mb-1 font-black">Reserved Time Slots:</div>
                        {bookings.map((b: any) => (
                          <div key={b.id} className="flex justify-between items-center bg-white/60 px-2.5 py-1.5 rounded-xl border border-rose-100/50">
                            <span className="text-rose-600 font-sans">Booked:</span>
                            <span className="font-extrabold text-zinc-800 font-sans">{b.timeSlot?.from || "N/A"} - {b.timeSlot?.to || "N/A"}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Time Slots */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">Start Time</label>
                  <select
                    required
                    value={timeFrom}
                    onChange={(e) => setTimeFrom(e.target.value)}
                    disabled={!bookingDate || getStartTimeOptions.length === 0}
                    className="w-full px-4 py-3 rounded-2xl border border-zinc-200 outline-none text-xs font-bold bg-zinc-50 cursor-pointer disabled:bg-zinc-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select start time</option>
                    {getStartTimeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">End Time</label>
                  <select
                    required
                    value={timeTo}
                    onChange={(e) => setTimeTo(e.target.value)}
                    disabled={!timeFrom || getEndTimeOptions.length === 0}
                    className="w-full px-4 py-3 rounded-2xl border border-zinc-200 outline-none text-xs font-bold bg-zinc-50 cursor-pointer disabled:bg-zinc-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select end time</option>
                    {getEndTimeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Booking Time Slot Availability Validator */}
              {validation.message && (
                <div
                  className={`p-3 rounded-2xl border text-xs font-semibold leading-relaxed transition-all duration-200 ${
                    validation.type === "success"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : validation.type === "error"
                      ? "bg-rose-50 border-rose-200 text-rose-700"
                      : "bg-blue-50 border-blue-200 text-blue-700"
                  }`}
                >
                  <div className="flex gap-2 items-start">
                    <span className="text-sm shrink-0">
                      {validation.type === "success" ? "✓" : validation.type === "error" ? "⚠" : "ℹ"}
                    </span>
                    <span>{validation.message}</span>
                  </div>
                </div>
              )}

              {/* Offered Services Checkboxes */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">Select Tasks to Perform</label>
                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                  {selectedProvider.offered_services?.map((srv) => {
                    const isChecked = selectedServices.some((s) => s.serviceTypeName === srv.serviceTypeName);
                    return (
                      <div
                        key={srv.serviceTypeName}
                        onClick={() => handleToggleService(srv)}
                        className={`flex justify-between items-center p-3 border rounded-xl cursor-pointer transition-all ${
                          isChecked
                            ? "border-blue-500 bg-blue-50/40"
                            : "border-zinc-200 bg-zinc-50/50 hover:bg-zinc-50"
                        }`}
                      >
                        <span className="text-xs font-bold text-zinc-800">{srv.serviceTypeName}</span>
                        <span className="text-xs font-black text-blue-600">${srv.price}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Offer New Service */}
              <div className="pt-2">
                <label className="block text-[10px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">Offer New Custom Service</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="E.g., Deep clean carpets"
                    value={customServiceName}
                    onChange={(e) => setCustomServiceName(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-zinc-200 outline-none text-xs bg-zinc-50"
                  />
                  <div className="relative w-24">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">$</span>
                    <input
                      type="number"
                      placeholder="Price"
                      min="1"
                      value={customServicePrice}
                      onChange={(e) => setCustomServicePrice(e.target.value)}
                      className="w-full pl-6 pr-3 py-2 rounded-xl border border-zinc-200 outline-none text-xs bg-zinc-50"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCustomService}
                    className="px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                {newServices.length > 0 && (
                  <div className="space-y-2 mt-2 max-h-[100px] overflow-y-auto">
                    {newServices.map((srv, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2.5 border border-amber-200 bg-amber-50/50 rounded-xl">
                        <span className="text-xs font-bold text-zinc-800">{srv.serviceTypeName}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black text-amber-600">${srv.price}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomService(idx)}
                            className="text-red-400 hover:text-red-600 font-black text-[10px] cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">Special Instructions</label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="E.g., clean kitchen floors, wipe living room windows..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-2xl border border-zinc-200 outline-none text-xs font-bold bg-zinc-50"
                />
              </div>

              {/* Action buttons and checkout summary */}
              <div className="pt-3 border-t border-zinc-150 flex items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Total Price</span>
                  <span className="text-xl font-extrabold text-blue-600">${calculateTotalPrice}</span>
                </div>
                <button
                  type="submit"
                  disabled={isBooking || isRedireting || calculateTotalPrice === 0 || !validation.isValid}
                  className={`px-6 py-3.5 rounded-2xl font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer ${
                    calculateTotalPrice === 0 || !validation.isValid
                      ? "bg-zinc-100 border border-zinc-200 text-zinc-400 cursor-not-allowed shadow-none"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {isBooking || isRedireting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing Checkout...
                    </>
                  ) : (
                    "Book & Pay"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
