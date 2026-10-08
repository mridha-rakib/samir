import React, { useState } from "react";
import { StarIcon, MapPinIcon } from "./Icons";
import { useRouter } from "next/navigation";

interface Property {
  id: string | number;
  title: string;
  subtitle: string;
  location: string;
  rating: number;
  reviews: number;
  price: string;
  image: string;
  images: string[];
  description: string;
  capacity: {
    guests: number;
    bedrooms: number;
    bathrooms: number;
    wifi: number;
    laundry: number;
  };
  houseRules: string[];
  guard?: {
    name: string;
    phone: string;
    avatar: string;
    status: string;
  };
  amenities?: string[];
  addLocalTips?: any[];
  houseRulesImg?: string;
  customPrices?: any[];
  host?: {
    id: string;
    name: string;
    avatar: string;
  };
  bookedDates?: { bookedFromDate: string; bookedToDate: string }[];
}

interface PropertyDetailsViewProps {
  property: Property;
  onBack: () => void;
  onReserve: (checkIn: string, checkOut: string, guests: number) => void;
  triggerNotification: (msg: string, type?: "success" | "error") => void;
}

// Custom Premium SVG Icons
const UsersSVG = () => (
  <svg className="w-5 h-5 text-blue-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);

const BedSVG = () => (
  <svg className="w-5 h-5 text-blue-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5h-1.875a6 6 0 00-11.25 0H6.125m15 0A3 3 0 0118 10.5h-1.875M6.125 7.5a3 3 0 00-3 3v8.25m3-11.25H3.75a3 3 0 00-3 3v8.25M6.125 18.75h11.75M3.75 18.75V21m16.5-2.25V21M18 10.5H6.125V18.75H18V10.5z" />
  </svg>
);

const BathSVG = () => (
  <svg className="w-5 h-5 text-blue-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v13.5M6 16.5H18M7.5 16.5V21M16.5 16.5V21M4.5 16.5v-3.375a3.375 3.375 0 013.375-3.375h8.25a3.375 3.375 0 013.375 3.375v3.375" />
  </svg>
);

export default function PropertyDetailsView({
  property,
  onBack,
  onReserve,
  triggerNotification,
}: PropertyDetailsViewProps) {
  const router = useRouter();

  const formatCustomPriceDate = (startDateStr: string, endDateStr: string) => {
    try {
      const start = new Date(startDateStr);
      const end = new Date(endDateStr);

      const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' };
      const startStr = start.toLocaleDateString('en-US', options);
      const endStr = end.toLocaleDateString('en-US', options);

      if (start.getFullYear() === end.getFullYear() &&
        start.getMonth() === end.getMonth() &&
        start.getDate() === end.getDate()) {
        return startStr;
      } else {
        return `${startStr} - ${endStr}`;
      }
    } catch (e) {
      return "Special Date";
    }
  };

  const handleViewTipOnMap = (tip: any) => {
    let url = "";
    if (tip.latitude && tip.longitude && tip.latitude !== "null" && tip.longitude !== "null") {
      url = `https://www.google.com/maps/search/?api=1&query=${tip.latitude},${tip.longitude}`;
    } else {
      let query = `${tip.subcategory || ""} ${tip.floor_details || ""}`.trim();
      if (query) {
        url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
      }
    }

    if (url) {
      window.open(url, "_blank");
    } else {
      triggerNotification("Map location details not available", "error");
    }
  };

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [guestCount, setGuestCount] = useState(2);

  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const [showLocalTips, setShowLocalTips] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Custom Calendar States
  const [showCheckInCalendar, setShowCheckInCalendar] = useState(false);
  const [showCheckOutCalendar, setShowCheckOutCalendar] = useState(false);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date());

  // Safe fallback list of images
  const galleryImages = property.images && property.images.length > 0
    ? property.images
    : (property.image ? [property.image] : []);

  // Calendar logic helper
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const generateCalendarDays = () => {
    const year = currentCalendarMonth.getFullYear();
    const month = currentCalendarMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parsedCheckIn = checkInDate ? new Date(checkInDate) : null;
    if (parsedCheckIn) parsedCheckIn.setHours(0, 0, 0, 0);

    for (let i = 0; i < firstDay; i++) {
      days.push({ empty: true });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const isPast = date < today;
      const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;

      let isBookedForCheckIn = false;
      let isBookedForCheckOut = false;
      let isBlockedByOverlap = false;

      property.bookedDates?.forEach((b: any) => {
        const fromDate = new Date(b.bookedFromDate);
        const toDate = new Date(b.bookedToDate);
        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(0, 0, 0, 0);
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);

        // Cannot check in if the night is occupied
        if (checkDate >= fromDate && checkDate < toDate) {
          isBookedForCheckIn = true;
        }

        // Cannot check out if the night before was occupied
        if (checkDate > fromDate && checkDate <= toDate) {
          isBookedForCheckOut = true;
        }

        // Cannot check out if it spans across an existing booking
        if (parsedCheckIn && fromDate >= parsedCheckIn && fromDate < checkDate) {
          isBlockedByOverlap = true;
        }
      });

      days.push({ empty: false, day: i, date, dateString, isPast, isBookedForCheckIn, isBookedForCheckOut: isBookedForCheckOut || isBlockedByOverlap });
    }
    return days;
  };

  const calendarDays = generateCalendarDays();

  const renderCalendar = (
    selectedDate: string,
    onSelectDate: (d: string) => void,
    onClose: () => void,
    type: "checkIn" | "checkOut",
    minDate?: string
  ) => {
    return (
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute top-full right-0 lg:right-auto mt-2 w-72 bg-white border border-zinc-200 rounded-3xl shadow-xl z-50 p-4 transition-all duration-300 text-left"
      >
        <div className="flex justify-between items-center mb-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentCalendarMonth(new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth() - 1, 1));
            }}
            className="p-1 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-550 transition-all cursor-pointer text-[10px] font-black flex items-center justify-center h-7 w-7"
          >
            ◀
          </button>
          <span className="text-xs font-extrabold text-zinc-800">
            {currentCalendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentCalendarMonth(new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth() + 1, 1));
            }}
            className="p-1 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-550 transition-all cursor-pointer text-[10px] font-black flex items-center justify-center h-7 w-7"
          >
            ▶
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-zinc-400 mb-2">
          <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {calendarDays.map((day, idx) => {
            if (day.empty) {
              return <div key={`empty-${idx}`} className="h-7 w-7"></div>;
            }

            const isSelected = selectedDate === day.dateString;
            const isBeforeMinDate = minDate ? day.dateString! < minDate : false;
            const isBooked = type === "checkIn" ? (day as any).isBookedForCheckIn : (day as any).isBookedForCheckOut;
            const isDisabled = day.isPast || isBeforeMinDate || isBooked;

            return (
              <button
                key={idx}
                type="button"
                disabled={isDisabled}
                title={isBooked ? "Already booked" : undefined}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectDate(day.dateString!);
                  onClose();
                }}
                className={`h-7 w-7 text-[10px] rounded-full flex items-center justify-center font-extrabold mx-auto transition-all relative ${isSelected
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : isBooked
                      ? "bg-red-50 text-red-300 cursor-not-allowed line-through decoration-red-300"
                      : isDisabled
                        ? "text-zinc-300 cursor-not-allowed bg-zinc-50"
                        : "text-zinc-650 hover:bg-blue-50 hover:text-blue-650 cursor-pointer"
                  }`}
              >
                {day.day}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center gap-3 text-[9px] font-bold text-zinc-400 border-t border-zinc-100 pt-2.5 justify-center">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            Selected
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-150 border border-red-200"></span>
            Booked
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-zinc-100 border border-zinc-200"></span>
            Past
          </span>
        </div>
      </div>
    );
  };

  const nextSlide = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % galleryImages.length);
  };
  const prevSlide = () => {
    setCurrentSlideIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  const handleReserveClick = () => {
    if (!checkInDate || !checkOutDate) {
      triggerNotification("Please select check-in and check-out dates.", "error");
      return;
    }
    if (new Date(checkInDate) >= new Date(checkOutDate)) {
      triggerNotification("Check-out date must be at least one day after check-in date (1 night minimum).", "error");
      return;
    }
    onReserve(checkInDate, checkOutDate, guestCount);
  };

  // Dynamic booking price calculation based on custom rates
  const getPriceForDate = (dateStr: string) => {
    const checkDate = new Date(dateStr);
    checkDate.setHours(0, 0, 0, 0);

    if (property.customPrices && property.customPrices.length > 0) {
      for (const cp of property.customPrices) {
        const start = new Date(cp.startDate);
        const end = new Date(cp.endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        if (checkDate >= start && checkDate <= end) {
          return parseFloat(cp.price);
        }
      }
    }
    const basePrice = parseFloat(property.price.replace(/[^0-9.]/g, ""));
    return isNaN(basePrice) ? 0 : basePrice;
  };

  const calculateDetailedTotal = () => {
    if (!checkInDate || !checkOutDate) return { nights: 0, total: 0 };
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const days = [];
    let curr = new Date(start);
    while (curr < end) {
      const year = curr.getFullYear();
      const month = String(curr.getMonth() + 1).padStart(2, "0");
      const day = String(curr.getDate()).padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;
      days.push(getPriceForDate(dateString));
      curr.setDate(curr.getDate() + 1);
    }

    const total = days.reduce((sum, p) => sum + p, 0);
    return {
      nights: days.length,
      total,
    };
  };

  const priceDetails = calculateDetailedTotal();

  const getAmenityIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("wifi") || n.includes("wi-fi") || n.includes("internet")) {
      return (
        <svg className="w-5 h-5 text-blue-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856a9 9 0 0113.788 0m-16.65 3.03a13.5 13.5 0 0119.5 0M12 18.75h.007v.008H12v-.008z" />
        </svg>
      );
    }
    if (n.includes("air condition") || n.includes("ac") || n.includes("climate")) {
      return (
        <svg className="w-5 h-5 text-blue-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12H3m12-4v8m-6-8v8m9-11v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      );
    }
    if (n.includes("laundry") || n.includes("washer") || n.includes("washing")) {
      return (
        <svg className="w-5 h-5 text-blue-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.829c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.829c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.991l-1.004-.829a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    }
    if (n.includes("kitchen") || n.includes("cook") || n.includes("fridge")) {
      return (
        <svg className="w-5 h-5 text-blue-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1.091m-7.5-7.84M12 10.025v-.01M8.25 13.5h.008v.008H8.25v-.008z" />
        </svg>
      );
    }
    if (n.includes("parking") || n.includes("garage") || n.includes("car")) {
      return (
        <svg className="w-5 h-5 text-blue-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.129-1.125V11.25M3 11.25c0-1.88 1.885-3.375 3.75-3.375h10.5c1.865 0 3.75 1.495 3.75 3.375m-18 0V14.25m0 0h17.25M12 14.25v3.75m0 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3 11.25h18" />
        </svg>
      );
    }
    if (n.includes("tv") || n.includes("television") || n.includes("cable")) {
      return (
        <svg className="w-5 h-5 text-blue-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h14.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  const renderDesktopGallery = () => {
    const len = galleryImages.length;
    if (len === 0) return null;

    if (len === 1) {
      return (
        <div className="hidden md:block h-[450px] rounded-3xl overflow-hidden relative shadow-sm cursor-pointer" onClick={() => setIsLightboxOpen(true)}>
          <img src={galleryImages[0]} alt="Property feature" className="w-full h-full object-cover hover:scale-[1.01] transition-transform duration-700 ease-out" />
        </div>
      );
    }

    if (len === 2) {
      return (
        <div className="hidden md:grid grid-cols-2 gap-2.5 h-[450px] rounded-3xl overflow-hidden relative shadow-sm cursor-pointer" onClick={() => setIsLightboxOpen(true)}>
          <img src={galleryImages[0]} alt="Property 1" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
          <img src={galleryImages[1]} alt="Property 2" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
        </div>
      );
    }

    if (len === 3) {
      return (
        <div className="hidden md:grid grid-cols-3 gap-2.5 h-[450px] rounded-3xl overflow-hidden relative shadow-sm">
          <div className="col-span-2 overflow-hidden cursor-pointer" onClick={() => { setCurrentSlideIndex(0); setIsLightboxOpen(true); }}>
            <img src={galleryImages[0]} alt="Property 1" className="w-full h-full object-cover hover:scale-102 transition-transform duration-500" />
          </div>
          <div className="grid grid-rows-2 gap-2.5">
            <div className="overflow-hidden cursor-pointer" onClick={() => { setCurrentSlideIndex(1); setIsLightboxOpen(true); }}>
              <img src={galleryImages[1]} alt="Property 2" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="overflow-hidden cursor-pointer" onClick={() => { setCurrentSlideIndex(2); setIsLightboxOpen(true); }}>
              <img src={galleryImages[2]} alt="Property 3" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
            </div>
          </div>
        </div>
      );
    }

    if (len === 4) {
      return (
        <div className="hidden md:grid grid-cols-4 gap-2.5 h-[450px] rounded-3xl overflow-hidden relative shadow-sm">
          <div className="col-span-2 overflow-hidden cursor-pointer" onClick={() => { setCurrentSlideIndex(0); setIsLightboxOpen(true); }}>
            <img src={galleryImages[0]} alt="Property 1" className="w-full h-full object-cover hover:scale-102 transition-transform duration-500" />
          </div>
          <div className="col-span-1 overflow-hidden cursor-pointer" onClick={() => { setCurrentSlideIndex(1); setIsLightboxOpen(true); }}>
            <img src={galleryImages[1]} alt="Property 2" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
          </div>
          <div className="col-span-1 grid grid-rows-2 gap-2.5">
            <div className="overflow-hidden cursor-pointer" onClick={() => { setCurrentSlideIndex(2); setIsLightboxOpen(true); }}>
              <img src={galleryImages[2]} alt="Property 3" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="overflow-hidden cursor-pointer" onClick={() => { setCurrentSlideIndex(3); setIsLightboxOpen(true); }}>
              <img src={galleryImages[3]} alt="Property 4" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="hidden md:grid grid-cols-4 gap-2.5 h-[450px] rounded-3xl overflow-hidden relative shadow-sm">
        {/* Main Large Image */}
        <div className="col-span-2 row-span-2 overflow-hidden cursor-pointer relative group" onClick={() => { setCurrentSlideIndex(0); setIsLightboxOpen(true); }}>
          <img src={galleryImages[0]} alt="Property Feature" className="w-full h-full object-cover hover:scale-102 transition-transform duration-700 ease-out" />
          <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors duration-300" />
        </div>
        {/* Sub grid */}
        <div className="overflow-hidden cursor-pointer relative group" onClick={() => { setCurrentSlideIndex(1); setIsLightboxOpen(true); }}>
          <img src={galleryImages[1]} alt="Property 2" className="w-full h-full object-cover hover:scale-105 transition-transform duration-550 ease-out" />
          <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors duration-300" />
        </div>
        <div className="overflow-hidden cursor-pointer relative group" onClick={() => { setCurrentSlideIndex(2); setIsLightboxOpen(true); }}>
          <img src={galleryImages[2]} alt="Property 3" className="w-full h-full object-cover hover:scale-105 transition-transform duration-550 ease-out" />
          <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors duration-300" />
        </div>
        <div className="overflow-hidden cursor-pointer relative group" onClick={() => { setCurrentSlideIndex(3); setIsLightboxOpen(true); }}>
          <img src={galleryImages[3]} alt="Property 4" className="w-full h-full object-cover hover:scale-105 transition-transform duration-550 ease-out" />
          <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors duration-300" />
        </div>
        <div className="overflow-hidden cursor-pointer relative group" onClick={() => { setCurrentSlideIndex(4); setIsLightboxOpen(true); }}>
          <img src={galleryImages[4]} alt="Property 5" className="w-full h-full object-cover hover:scale-105 transition-transform duration-550 ease-out" />
          <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors duration-300" />
        </div>

        {/* Floating view all button */}
        <button
          onClick={() => setIsLightboxOpen(true)}
          className="absolute bottom-5 right-5 px-4 py-2 bg-white/95 hover:bg-white text-zinc-800 rounded-xl border border-zinc-200 shadow-md font-bold text-xs transition-all duration-300 hover:scale-[1.02] flex items-center gap-1.5 cursor-pointer z-10"
        >
          <svg className="w-4 h-4 text-zinc-700" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          View all photos
        </button>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 lg:p-10 max-w-7xl mx-auto space-y-6 text-left animate-fadeIn">

      {/* Premium Navigation Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
        <button
          onClick={onBack}
          className="group flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-zinc-200 shadow-sm hover:shadow hover:border-zinc-300 text-zinc-650 hover:text-zinc-900 transition-all duration-300 text-xs font-bold cursor-pointer"
        >
          <svg className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform duration-300" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to listings
        </button>
        <div className="flex items-center gap-2">
          {/* Decorative tag to match high-end dashboard styling */}
          <span className="px-3.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-150 font-black text-[9px] uppercase tracking-wider">
            Verified Listing
          </span>
        </div>
      </div>

      {/* Image Grid / Mosaic Gallery */}
      {renderDesktopGallery()}

      {/* Mobile Slider Gallery (hidden on md) */}
      <div className="md:hidden relative h-[280px] rounded-3xl overflow-hidden shadow-sm group">
        <img
          src={galleryImages[currentSlideIndex]}
          alt="Gallery"
          className="w-full h-full object-cover transition-all duration-700 ease-in-out"
          onClick={() => setIsLightboxOpen(true)}
        />

        {/* Navigation arrows */}
        {galleryImages.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 shadow-md text-zinc-800 font-bold text-sm cursor-pointer z-10 active:scale-90"
            >
              ‹
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 shadow-md text-zinc-800 font-bold text-sm cursor-pointer z-10 active:scale-90"
            >
              ›
            </button>

            {/* Slide Index Counter Badge */}
            <div className="absolute bottom-4 right-4 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white font-bold text-[10px] tracking-wide">
              {currentSlideIndex + 1} / {galleryImages.length}
            </div>
          </>
        )}
      </div>

      {/* Details Split Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">

        {/* Left main info column (8 cols) */}
        <div className="lg:col-span-8 space-y-8">

          {/* Main Title Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-black text-[9px] uppercase tracking-wider border border-amber-200 flex items-center gap-1">
                ★ Guest Favorite
              </span>
              <span className="text-zinc-300">•</span>
              <span className="text-xs text-zinc-400 font-bold">Ref: #{property.id}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight leading-snug">
              {property.title}
            </h2>
            <p className="text-sm font-semibold text-zinc-450 leading-relaxed">
              {property.subtitle}
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs font-bold text-zinc-500">
              <span className="flex items-center gap-1">
                <MapPinIcon />
                <span className="text-zinc-600">{property.location}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (property.location) {
                      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.location)}`, "_blank");
                    } else {
                      triggerNotification("Location details not available", "error");
                    }
                  }}
                  className="ml-1 text-blue-600 hover:underline font-bold text-[11px] cursor-pointer"
                >
                  (View on Map)
                </button>
              </span>
              <span className="text-zinc-300">|</span>
              <span className="flex items-center gap-1 text-zinc-700 font-bold">
                <StarIcon />
                <span>{property.rating}</span>
                <span className="text-zinc-400">({property.reviews} reviews)</span>
              </span>
            </div>
          </div>

          <hr className="border-zinc-200" />

          {/* Premium Host Card */}
          {property.host && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white border border-zinc-150 p-5 rounded-3xl shadow-sm hover:shadow transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img
                    src={property.host.avatar}
                    alt={property.host.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-zinc-100 shadow-inner"
                  />
                  <span className="absolute bottom-0 right-0 w-4.5 h-4.5 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-[9px] text-white font-black" title="Verified Host">
                    ✓
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="text-base font-extrabold text-zinc-850">Hosted by {property.host.name}</h4>
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-black text-[9px] uppercase tracking-wider border border-amber-200">
                      Superhost
                    </span>
                  </div>
                  <p className="text-xs text-zinc-455 font-bold mt-1.5 flex items-center gap-1">
                    <StarIcon />
                    <span>Host rating: {property.rating || 5.0} ★</span>
                    <span className="text-zinc-300">•</span>
                    <span>Verified Identity</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (property.host?.id) {
                      triggerNotification("Opening thread with host...", "success");
                      router.push(`/dashboard/guest/chat?hostId=${property.host.id}`);
                    } else {
                      triggerNotification("Host contact details not available.", "error");
                    }
                  }}
                  className="px-4 py-2 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 rounded-xl font-bold text-xs border border-zinc-200 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <svg className="w-4 h-4 text-zinc-650" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                  </svg>
                  Contact Host
                </button>
                <button
                  type="button"
                  onClick={onBack}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-all shadow-sm hover:shadow cursor-pointer active:scale-95"
                >
                  Other listings
                </button>
              </div>
            </div>
          )}

          {/* Pricing Info */}
          <div className="space-y-4 pt-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-zinc-955">Base price: {property.price}</span>
              <span className="text-xs text-zinc-450 font-bold"> / night</span>
            </div>

            {/* Seasonal / Custom Prices */}
            {property.customPrices && property.customPrices.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-zinc-450 uppercase tracking-widest">Seasonal / Custom Pricing</h4>
                  <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full">Special rates apply</span>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-thin">
                  {property.customPrices.map((cp: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 bg-white border border-zinc-150 hover:border-blue-400 hover:shadow-md rounded-2xl flex flex-col justify-between gap-3 min-w-[170px] shrink-0 transition-all duration-300 hover:scale-[1.01] group cursor-default"
                    >
                      <div className="flex items-center gap-2 text-zinc-450 group-hover:text-blue-500 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                        <span className="text-xs font-extrabold">
                          {formatCustomPriceDate(cp.startDate, cp.endDate)}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-zinc-400">Nightly Rate</div>
                        <div className="text-zinc-800 font-black text-lg tracking-tight mt-0.5">
                          ${cp.price} <span className="text-xs text-zinc-450 font-bold">/ night</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <hr className="border-zinc-200" />

          {/* Premium Capacity Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-black text-zinc-900 tracking-tight">Capacity</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "Guests Limit", val: `${property.capacity.guests} Guests`, desc: "Spacious capacity", icon: <UsersSVG /> },
                { label: "Bedrooms", val: `${property.capacity.bedrooms} Bedrooms`, desc: "Comfortable sleep", icon: <BedSVG /> },
                { label: "Bathrooms", val: `${property.capacity.bathrooms} Bathrooms`, desc: "Clean & modern", icon: <BathSVG /> },
              ].map((metric, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 bg-white border border-zinc-150 hover:border-blue-300 hover:shadow-md transition-all duration-300 rounded-2xl group">
                  <div className="w-10 h-10 rounded-xl bg-blue-50/80 group-hover:bg-blue-100/80 flex items-center justify-center transition-colors">
                    {metric.icon}
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-455 font-bold uppercase tracking-wider leading-none mb-1.5">{metric.label}</p>
                    <h4 className="text-sm font-black text-zinc-850 leading-none">{metric.val}</h4>
                    <p className="text-[10px] text-zinc-400 font-semibold mt-1 leading-none">{metric.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <hr className="border-zinc-200" />

          {/* Amenities Section */}
          {property.amenities && property.amenities.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-black text-zinc-900 tracking-tight">What this place offers</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {property.amenities.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-4 bg-white border border-zinc-150 rounded-2xl hover:border-blue-300 hover:shadow-sm transition-all duration-300 group cursor-default"
                  >
                    <span className="group-hover:scale-105 transition-transform">
                      {getAmenityIcon(item)}
                    </span>
                    <span className="text-xs font-bold text-zinc-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <hr className="border-zinc-200" />

          {/* About This Property */}
          <div className="space-y-3">
            <h3 className="text-lg font-black text-zinc-900 tracking-tight">About This Property</h3>
            <p className="text-sm font-semibold text-zinc-500 leading-relaxed whitespace-pre-line">
              {property.description}
            </p>
          </div>

          {/* Local Guidebook Section */}
          {property.addLocalTips && property.addLocalTips.length > 0 && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowLocalTips(true)}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/10 text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8m-9-3.75h.008v.008H6V11.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.008v.008H6V16.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375-10.5H6.75M12 9h.008v.008H12V9zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.008v.008H12V14.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375-10.5H12.75m3 5.25h.008v.008h-.008v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.008v.008h-.008V16.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375-10.5H15.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                See Host's Local Guidebook
              </button>

              {/* Local Tips Expansion Modal Drawer */}
              {showLocalTips && (
                <div className="fixed inset-0 bg-zinc-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 transition-all duration-300">
                  <div className="bg-white border border-zinc-250 rounded-3xl p-6 sm:p-8 max-w-3xl w-full max-h-[85vh] overflow-y-auto space-y-6 shadow-2xl text-left relative">
                    <div className="flex items-center justify-between pb-4 border-b border-zinc-150">
                      <div>
                        <h3 className="text-xl font-black text-zinc-900 tracking-tight">Host's Local Guidebook</h3>
                        <p className="text-xs text-zinc-450 font-bold mt-1">Vetted local spots and helpful tips recommended by your host</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowLocalTips(false)}
                        className="p-2.5 rounded-full border border-zinc-200 hover:bg-zinc-50 text-zinc-550 hover:text-zinc-800 transition-all cursor-pointer flex items-center justify-center"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {property.addLocalTips.map((tip: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-4 border border-zinc-150 hover:border-blue-400 hover:shadow-md rounded-2xl bg-zinc-50/50 hover:bg-white flex gap-4 transition-all duration-300 group"
                        >
                          {tip.subcategoryImage ? (
                            <img src={tip.subcategoryImage} alt={tip.subcategory || tip.category} className="w-20 h-20 rounded-xl object-cover shrink-0 border border-zinc-200 group-hover:scale-102 transition-transform" />
                          ) : (
                            <div className="w-20 h-20 rounded-xl bg-blue-50 text-blue-650 flex items-center justify-center font-bold text-2xl shrink-0 border border-blue-100">
                              📍
                            </div>
                          )}
                          <div className="flex flex-col justify-between flex-1 min-w-0">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-650 font-extrabold text-[9px] uppercase tracking-wider border border-blue-100">
                                  {tip.category}
                                </span>
                                {tip.subcategory && (
                                  <span className="text-[10px] text-zinc-400 font-extrabold truncate">
                                    • {tip.subcategory}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-zinc-700 font-bold leading-snug mt-2 line-clamp-3">
                                {tip.floor_details}
                              </p>
                            </div>
                            <div className="pt-3">
                              <button
                                type="button"
                                onClick={() => handleViewTipOnMap(tip)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-zinc-200 hover:border-blue-300 hover:bg-blue-50 text-zinc-700 hover:text-blue-600 transition-colors text-[10px] font-extrabold cursor-pointer active:scale-95 shadow-sm"
                              >
                                <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25z" />
                                </svg>
                                View on Map
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <hr className="border-zinc-200" />

          {/* House Rules */}
          <div className="space-y-4">
            <h3 className="text-lg font-black text-zinc-900 tracking-tight">House Rules</h3>
            {property.houseRulesImg ? (
              <div className="rounded-3xl border border-zinc-150 overflow-hidden bg-zinc-50/50 max-w-xl shadow-sm hover:shadow-md transition-shadow">
                <img
                  src={property.houseRulesImg}
                  alt="House Rules"
                  className="w-full object-contain max-h-[350px]"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {property.houseRules.map((rule, idx) => (
                  <div key={idx} className="flex items-start gap-3.5 p-4 bg-white border border-zinc-150 rounded-2xl hover:border-red-200 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-red-50 text-red-500 border border-red-100 flex items-center justify-center shrink-0 font-extrabold text-xs">
                      !
                    </div>
                    <span className="text-xs font-bold text-zinc-650 leading-relaxed">{rule}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <hr className="border-zinc-200" />

          {/* Assigned Guard */}
          {property.guard && (
            <div className="p-6 bg-white border border-zinc-150 rounded-3xl space-y-4 shadow-sm hover:shadow transition-shadow">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                <h3 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wider">Property Security Guard</h3>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-zinc-100">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-zinc-100 border-2 border-zinc-200 overflow-hidden relative shadow-sm shrink-0">
                    <img src={property.guard.avatar} alt="Guard" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-zinc-850 leading-tight">{property.guard.name}</h4>
                    <p className="text-xs text-zinc-450 font-bold mt-1.5 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.387a12.035 12.035 0 01-7.108-7.108c-.155-.44.01-1.272.387-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H3.75A2.25 2.25 0 001.5 4.5v2.25z" />
                      </svg>
                      {property.guard.phone || "No contact info"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (property.guard?.phone) {
                        window.open(`https://wa.me/${property.guard.phone.replace(/\D/g, "")}`, "_blank");
                      } else {
                        triggerNotification("No guard contact phone available for WhatsApp.", "error");
                      }
                    }}
                    title="Chat on WhatsApp"
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-150 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer active:scale-90 shadow-sm"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 001.333 4.982L2 22l5.233-1.371a9.936 9.936 0 004.779 1.229h.004c5.505 0 9.988-4.478 9.989-9.984C22 6.478 17.517 2 12.012 2zm4.7 13.916c-.258.725-1.5 1.341-2.07 1.4-1.026.104-2.185-.292-4.524-1.258-2.92-1.207-4.795-4.174-4.94-4.368-.146-.194-1.183-1.572-1.183-2.997 0-1.425.746-2.126 1.01-2.407.264-.281.577-.35.77-.35h.547c.176 0 .411.006.602.46.2.478.683 1.662.742 1.782.059.12.099.259.019.42-.08.16-.12.259-.24.398-.12.14-.25.312-.358.42-.12.12-.244.251-.106.485.138.234.613 1.01 1.316 1.64.9.807 1.66 1.055 1.895 1.173.235.118.373.1.512-.06.14-.16.603-.701.763-.94.16-.24.32-.2.539-.12.22.08 1.402.66 1.642.78.24.12.399.18.458.28.06.1.06.58-.2 1.305z" />
                    </svg>
                  </button>
                  <span className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 font-extrabold text-[11px] uppercase tracking-wider border border-emerald-150">
                    {property.guard.status || "Available"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right reservation checkout column (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-zinc-200 rounded-3xl p-6 shadow-md space-y-6 sticky top-6">
          <div className="flex justify-between items-baseline">
            <div>
              <span className="text-2xl font-black text-zinc-900">{property.price}</span>
              <span className="text-xs text-zinc-450 font-bold"> / night</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800 bg-zinc-50 px-2.5 py-1 rounded-full border border-zinc-200">
              <StarIcon />
              <span className="font-extrabold">{property.rating}</span>
            </div>
          </div>

          <div className="space-y-3 border-t border-zinc-150 pt-5 text-xs font-bold">
            {/* Check-in Input */}
            <div className="relative">
              <label className="block text-[10px] uppercase text-zinc-450 mb-1.5 tracking-wider">Check-In</label>
              <button
                type="button"
                onClick={() => {
                  setShowCheckInCalendar(!showCheckInCalendar);
                  setShowCheckOutCalendar(false);
                  setShowGuestDropdown(false);
                }}
                className="w-full px-4 py-3 border border-zinc-200 rounded-xl bg-zinc-50/50 outline-none text-left flex justify-between items-center text-zinc-800 font-bold"
              >
                <span>{checkInDate ? checkInDate : "mm/dd/yyyy"}</span>
                <span className="text-[10px]">▼</span>
              </button>
              {showCheckInCalendar && renderCalendar(
                checkInDate,
                (date) => {
                  setCheckInDate(date);
                  // Automatically prompt for check out
                  if (!checkOutDate || date >= checkOutDate) {
                    setCheckOutDate("");
                  }
                  setShowCheckInCalendar(false);
                  setShowCheckOutCalendar(true);
                },
                () => setShowCheckInCalendar(false),
                "checkIn"
              )}
            </div>

            {/* Check-out Input */}
            <div className="relative">
              <label className="block text-[10px] uppercase text-zinc-450 mb-1.5 tracking-wider">Check-Out</label>
              <button
                type="button"
                onClick={() => {
                  setShowCheckOutCalendar(!showCheckOutCalendar);
                  setShowCheckInCalendar(false);
                  setShowGuestDropdown(false);
                }}
                className="w-full px-4 py-3 border border-zinc-200 rounded-xl bg-zinc-50/50 outline-none text-left flex justify-between items-center text-zinc-800 font-bold"
              >
                <span>{checkOutDate ? checkOutDate : "mm/dd/yyyy"}</span>
                <span className="text-[10px]">▼</span>
              </button>
              {showCheckOutCalendar && renderCalendar(
                checkOutDate,
                (date) => {
                  setCheckOutDate(date);
                  setShowCheckOutCalendar(false);
                },
                () => setShowCheckOutCalendar(false),
                "checkOut",
                checkInDate ? (() => {
                  const [y, m, d] = checkInDate.split('-').map(Number);
                  const next = new Date(y, m - 1, d + 1);
                  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
                })() : undefined
              )}
            </div>

            {/* Guests selector */}
            <div className="relative">
              <label className="block text-[10px] uppercase text-zinc-450 mb-1.5 tracking-wider">Guests</label>
              <button
                type="button"
                onClick={() => setShowGuestDropdown(!showGuestDropdown)}
                className="w-full px-4 py-3 border border-zinc-200 rounded-xl bg-zinc-50/50 outline-none text-left flex justify-between items-center"
              >
                <span>{guestCount} Guests</span>
                <span>▼</span>
              </button>

              {showGuestDropdown && (
                <div className="absolute top-full inset-x-0 mt-1.5 border border-zinc-200 bg-white rounded-xl shadow-lg z-30 divide-y divide-zinc-100 overflow-hidden font-bold">
                  {Array.from({ length: property.capacity.guests || 1 }, (_, index) => index + 1).map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setGuestCount(num);
                        setShowGuestDropdown(false);
                      }}
                      className="w-full px-4 py-2.5 hover:bg-zinc-50 text-left text-xs transition-colors"
                    >
                      {num} Guests
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleReserveClick}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 active:scale-[0.99] transition-all text-sm cursor-pointer"
          >
            Reserve Now
          </button>

          {/* Dynamic Pricing Breakdown */}
          {priceDetails.nights > 0 && (
            <div className="space-y-3 pt-3 border-t border-zinc-150 text-xs text-zinc-550 font-bold">
              <div className="flex justify-between items-center">
                <span className="underline hover:text-zinc-800 transition-colors cursor-help" title="Detailed nightly rate breakdown">
                  ${(priceDetails.total / priceDetails.nights).toFixed(0)} x {priceDetails.nights} {priceDetails.nights === 1 ? "night" : "nights"}
                </span>
                <span className="text-zinc-850 font-extrabold">${priceDetails.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Cleaning & service fee</span>
                <span className="text-emerald-600">Free</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-zinc-150 text-sm">
                <span className="font-extrabold text-zinc-850">Total before taxes</span>
                <span className="font-black text-zinc-950">${priceDetails.total}</span>
              </div>
            </div>
          )}

          <p className="text-[10px] text-center text-zinc-450 font-semibold leading-relaxed">
            You won't be charged yet. Additional traveler document verification is required.
          </p>
        </div>
      </div>

      {/* Premium Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 bg-black/95 z-9999 flex flex-col justify-between p-4 sm:p-6 transition-all duration-300">
          {/* Header */}
          <div className="flex items-center justify-between text-white pb-2">
            <span className="text-xs font-bold text-zinc-400">
              {currentSlideIndex + 1} / {galleryImages.length}
            </span>
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="px-4 py-2 border border-zinc-700 rounded-full hover:bg-zinc-800/80 transition-all font-bold text-xs cursor-pointer text-zinc-300"
            >
              ✕ Close
            </button>
          </div>

          {/* Main Slide */}
          <div className="relative flex-1 flex items-center justify-center max-w-5xl mx-auto w-full">
            <img
              src={galleryImages[currentSlideIndex]}
              alt={`Slide ${currentSlideIndex + 1}`}
              className="max-h-[75vh] max-w-full object-contain rounded-2xl select-none"
            />

            {/* Navigation inside Lightbox */}
            {galleryImages.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                  className="absolute left-2 sm:left-4 p-4 rounded-full bg-zinc-900/60 border border-zinc-850 hover:bg-zinc-800 text-white font-bold text-2xl transition-all cursor-pointer flex items-center justify-center w-12 h-12"
                >
                  ‹
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                  className="absolute right-2 sm:right-4 p-4 rounded-full bg-zinc-900/60 border border-zinc-850 hover:bg-zinc-800 text-white font-bold text-2xl transition-all cursor-pointer flex items-center justify-center w-12 h-12"
                >
                  ›
                </button>
              </>
            )}
          </div>

          {/* Thumbnail Strip */}
          {galleryImages.length > 1 && (
            <div className="flex justify-center gap-2 overflow-x-auto pb-4 max-w-2xl mx-auto w-full scrollbar-none">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${currentSlideIndex === idx ? "border-blue-500 scale-105" : "border-zinc-850 opacity-60 hover:opacity-100"
                    }`}
                >
                  <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
