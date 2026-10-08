import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useGetSingleMyHotelBookingForUserQuery } from "@/redux/api/hotelBookingApi";
import { useCreateHotelReviewMutation } from "@/redux/api/reviewApi";
import { EyeIcon, EyeOffIcon } from "./Icons";

interface GuestBookingDetailsProps {
  bookingId?: string | null;
  triggerNotification: (msg: string, type?: "success" | "error") => void;
  onBackToList: () => void;
}

const mockTips = {
  coffee: [
    { name: "Cafe Verde", image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=400&q=80", desc: "A cozy place with delicious lattes and great views." },
    { name: "The Beanery", image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=400&q=80", desc: "Artisanal single-origin brews and hand-crafted pastries." }
  ],
  activities: [
    { name: "Spice Palace", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80", desc: "Authentic Bangladeshi cuisine with traditional flavors." },
    { name: "Lakeside Kayaking", image: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=400&q=80", desc: "Rent boats and explore the scenic lake canals." }
  ],
  deals: [
    { name: "Sky Lounge", image: "https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?auto=format&fit=crop&w=400&q=80", desc: "Rooftop dining with panoramic city views." },
    { name: "Happy Hour Spa", image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=400&q=80", desc: "Get 20% off massages between 10:00 AM and 2:00 PM." }
  ]
};

function formatDateString(str?: string) {
  if (!str) return "";
  try {
    const d = new Date(str);
    if (isNaN(d.getTime())) return str;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return str;
  }
}

function calcNights(from?: string, to?: string): number {
  if (!from || !to) return 1;
  try {
    const diff = new Date(to).getTime() - new Date(from).getTime();
    return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
  } catch {
    return 1;
  }
}

export default function GuestBookingDetails({
  bookingId,
  triggerNotification,
  onBackToList,
}: GuestBookingDetailsProps) {
  const router = useRouter();
  const [view, setView] = useState<"summary" | "security" | "tips">("summary");
  const [showSmartLock, setShowSmartLock] = useState(false);
  const [showKeyPin, setShowKeyPin] = useState(false);
  const [activeTipsTab, setActiveTipsTab] = useState<"coffee" | "activities" | "deals">("coffee");
  const [heroIdx, setHeroIdx] = useState(0);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [createHotelReview, { isLoading: isSubmittingReview }] = useCreateHotelReviewMutation();

  const { data: apiBookingResponse, isLoading } = useGetSingleMyHotelBookingForUserQuery(bookingId || "", {
    skip: !bookingId,
  });

  const booking = apiBookingResponse?.data;
  const hotel = booking?.hotel;

  // ── Derived display values ──────────────────────────────────────────────────
  const images: string[] = hotel?.uploadPhotosOrVideos?.length > 0
    ? hotel.uploadPhotosOrVideos
    : ["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80"];

  const title = hotel?.propertyTitle || "Property";
  const location = hotel?.propertyAddress || "";
  const description = hotel?.propertyDescription || "";
  const rating_ = hotel?.hotelRating ? parseFloat(hotel.hotelRating) : 0;
  const reviewCount = hotel?.hotelReviewCount || 0;
  const amenities: string[] = hotel?.aminities || hotel?.amenities || [];
  const houseRules: string = hotel?.houseRules || "";
  const wifiPassword: string = hotel?.wifiPassword || "N/A";
  const smartLock: string = hotel?.smartLockCode || "N/A";
  const keyPin: string = hotel?.keyBoxPin || "N/A";
  const guard = hotel?.guards;
  const guardPhone: string = guard?.phone || guard?.whatsapp || booking?.partner?.contactNumber || "";
  const guardName: string = guard?.name || "";
  const guardAvatar: string = guard?.photo || "";
  const guardStatus: string = guard?.status || "AVAILABLE";

  // Host info
  const hostName: string = hotel?.user?.fullName || booking?.partner?.fullName || "";
  const hostAvatar: string = hotel?.user?.profileImage || booking?.partner?.profileImage || "https://i.ibb.co/Ps9gZ8DD/Profile-image.png";
  const hostPhone: string = hotel?.user?.phoneNumber || hotel?.user?.phone || booking?.partner?.contactNumber || booking?.partner?.phone || "";
  const hostId: string = hotel?.user?.id || hotel?.user?._id || booking?.partner?.id || "";

  const checkIn = formatDateString(booking?.bookedFromDate);
  const checkOut = formatDateString(booking?.bookedToDate);
  const nights = calcNights(booking?.bookedFromDate, booking?.bookedToDate);
  const guests = booking?.personOfGuests || 1;
  const totalPrice = booking?.totalPrice ? `$${booking.totalPrice}` : "";
  const status = booking?.bookingStatus || "CONFIRMED";

  const capacity = {
    guests: hotel?.maxGuests || 4,
    bedrooms: hotel?.bedrooms || 2,
    bathrooms: hotel?.bathrooms || 1,
  };

  const isCompleted = useMemo(() => {
    if (!booking) return false;
    if (["COMPLETED", "COMPLETED_BY_PROVIDER"].includes(booking.bookingStatus)) return true;
    if (booking.bookedToDate) {
      try {
        const checkOutDate = new Date(booking.bookedToDate);
        const today = new Date();
        checkOutDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        return checkOutDate < today && !["CANCELLED", "REJECTED", "EXPIRED"].includes(booking.bookingStatus);
      } catch { return false; }
    }
    return false;
  }, [booking]);

  const displayTips = useMemo(() => {
    if (booking?.hotel?.addLocalTips?.length > 0) {
      const grouped: Record<string, any[]> = { coffee: [], activities: [], deals: [] };
      booking.hotel.addLocalTips.forEach((tip: any) => {
        const cat = tip.category?.toLowerCase() || "";
        const item = {
          name: tip.subcategory || "Recommended Place",
          image: tip.subcategoryImage || mockTips.coffee[0].image,
          desc: tip.floor_details || "Host recommended location",
          latitude: tip.latitude,
          longitude: tip.longitude,
        };
        if (cat.includes("coffee") || cat.includes("cafe")) grouped.coffee.push(item);
        else if (cat.includes("activity") || cat.includes("gym") || cat.includes("park")) grouped.activities.push(item);
        else grouped.deals.push(item);
      });
      if (!grouped.coffee.length) grouped.coffee = mockTips.coffee;
      if (!grouped.activities.length) grouped.activities = mockTips.activities;
      if (!grouped.deals.length) grouped.deals = mockTips.deals;
      return grouped;
    }
    return mockTips;
  }, [booking]);

  const handleSubmitReview = async () => {
    if (rating === 0) return;
    try {
      const response = await createHotelReview({
        hotelId: booking?.hotelId || hotel?.id || hotel?._id || "",
        rating,
        comment,
      }).unwrap();
      if (response.success) {
        setReviewSubmitted(true);
        triggerNotification("Review submitted successfully!", "success");
      } else {
        triggerNotification(response.message || "Failed to submit review.", "error");
      }
    } catch (error: any) {
      triggerNotification(error?.data?.message || "Something went wrong.", "error");
    }
  };

  const statusColor: Record<string, string> = {
    CONFIRMED: "bg-emerald-50 text-emerald-600 border-emerald-200",
    PENDING: "bg-amber-50 text-amber-600 border-amber-200",
    CANCELLED: "bg-red-50 text-red-500 border-red-200",
    EXPIRED: "bg-zinc-100 text-zinc-500 border-zinc-200",
    COMPLETED: "bg-blue-50 text-blue-600 border-blue-200",
  };
  const chipClass = statusColor[status] || statusColor.CONFIRMED;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 min-h-[400px]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-zinc-400">Loading booking details...</p>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // SECURITY VIEW
  // ══════════════════════════════════════════════════════════════════
  if (view === "security") {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-lg mx-auto animate-fadeIn">
        <div className="bg-white border border-zinc-150 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-150">
            <button onClick={() => setView("summary")} className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer">
              ← Back
            </button>
            <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full uppercase tracking-wider">Security Access</span>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-start gap-2.5 text-left text-[11px] font-bold text-blue-800 leading-normal">
            🔒 This information is encrypted and visible only to confirmed guests.
          </div>

          {/* Smart Lock */}
          <div className="p-4 border border-zinc-150 rounded-2xl bg-zinc-50/50 space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-zinc-500 uppercase tracking-wider">
              <span>Smart Lock Code</span>
              <button onClick={() => setShowSmartLock(!showSmartLock)} className="cursor-pointer">{showSmartLock ? <EyeOffIcon /> : <EyeIcon />}</button>
            </div>
            <div className="text-xl font-mono tracking-widest font-black text-zinc-900 py-1.5">
              {showSmartLock ? smartLock : "• • • •"}
            </div>
            <button onClick={() => { navigator.clipboard.writeText(smartLock); triggerNotification("Code copied!", "success"); }} className="w-full py-2.5 border border-zinc-200 text-zinc-600 rounded-xl text-xs font-bold hover:bg-white transition-colors cursor-pointer">
              Copy Code
            </button>
          </div>

          {/* Key Box PIN */}
          <div className="p-4 border border-zinc-150 rounded-2xl bg-zinc-50/50 space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-zinc-500 uppercase tracking-wider">
              <span>Key Box PIN</span>
              <button onClick={() => setShowKeyPin(!showKeyPin)} className="cursor-pointer">{showKeyPin ? <EyeOffIcon /> : <EyeIcon />}</button>
            </div>
            <div className="text-xl font-mono tracking-widest font-black text-zinc-900 py-1.5">
              {showKeyPin ? keyPin : "• • • •"}
            </div>
            <button onClick={() => { navigator.clipboard.writeText(keyPin); triggerNotification("PIN copied!", "success"); }} className="w-full py-2.5 border border-zinc-200 text-zinc-600 rounded-xl text-xs font-bold hover:bg-white transition-colors cursor-pointer">
              Copy PIN
            </button>
          </div>

          {/* Important info */}
          <div className="p-5 border border-zinc-200 rounded-2xl bg-white space-y-3 text-xs font-bold text-zinc-700">
            <h4 className="text-[10px] text-zinc-400 uppercase tracking-widest mb-1.5">Important Information</h4>
            <div className="flex justify-between items-center border-b border-zinc-100 pb-2">
              <span className="text-zinc-400">Wi-Fi Password</span>
              <span className="text-zinc-800 font-mono">{wifiPassword}</span>
            </div>
            {guardPhone && (
              <div className="flex justify-between items-center border-b border-zinc-100 pb-2">
                <span className="text-zinc-400">Emergency Contact</span>
                <a href={`tel:${guardPhone}`} className="text-blue-600">{guardPhone}</a>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Check-in Time</span>
              <span className="text-zinc-800">2:00 PM – 11:00 PM</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // LOCAL TIPS VIEW
  // ══════════════════════════════════════════════════════════════════
  if (view === "tips") {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto animate-fadeIn">
        <div className="bg-white border border-zinc-150 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-150">
            <button onClick={() => setView("summary")} className="flex items-center gap-1.5 text-sm font-bold text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer">← Back</button>
            <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full uppercase tracking-wider">Local Tips</span>
          </div>
          <div>
            <h2 className="text-xl font-black text-zinc-900 tracking-tight">Local Tips</h2>
            <p className="text-xs text-zinc-400 font-semibold mt-0.5">Explore places vetted by your host</p>
          </div>
          <div className="flex border-b border-zinc-150 font-bold text-xs">
            {(["coffee", "activities", "deals"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTipsTab(tab)}
                className={`pb-3 px-4 border-b-2 transition-all flex-1 capitalize ${activeTipsTab === tab ? "border-blue-600 text-blue-600 font-black" : "border-transparent text-zinc-400 hover:text-zinc-600"}`}>
                {tab}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayTips[activeTipsTab].map((place, idx) => (
              <div key={idx} className="bg-white border border-zinc-150 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                <div className="h-44 w-full overflow-hidden">
                  <img src={place.image} alt={place.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-5 space-y-3">
                  <h4 className="text-base font-bold text-zinc-900">{place.name}</h4>
                  <p className="text-xs text-zinc-500 font-semibold leading-relaxed">{place.desc}</p>
                  <a href={`https://maps.google.com/?q=${place.latitude && place.longitude ? `${place.latitude},${place.longitude}` : encodeURIComponent(place.name)}`} target="_blank" rel="noopener noreferrer"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer block text-center">
                    View on Map
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // MAIN SUMMARY VIEW (Responsive Desktop Layout)
  // ══════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-6xl mx-auto pb-16 animate-fadeIn lg:px-6">

      {/* ── Hero Image Carousel ─────────────────────────────────────── */}
      <div className="relative w-full h-64 sm:h-80 lg:h-[400px] lg:rounded-3xl overflow-hidden rounded-b-3xl shadow-sm mb-6 lg:mt-6">
        <img
          src={images[heroIdx]}
          alt={title}
          className="w-full h-full object-cover transition-all duration-500"
        />
        {/* overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />

        {/* Back button */}
        <button
          onClick={onBackToList}
          className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-zinc-800 rounded-full p-2.5 shadow-md hover:bg-white transition-all cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Status badge */}
        <span className={`absolute top-4 right-4 px-3.5 py-1.5 rounded-full border text-xs font-black uppercase shadow-sm ${chipClass}`}>
          {status.replace("_", " ")}
        </span>

        {/* Image dots */}
        {images.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, i) => (
              <button key={i} onClick={() => setHeroIdx(i)}
                className={`h-2 rounded-full transition-all cursor-pointer ${i === heroIdx ? "bg-white w-6" : "bg-white/50 w-2 hover:bg-white/80"}`} />
            ))}
          </div>
        )}

        {/* Prev / Next */}
        {images.length > 1 && (
          <>
            <button onClick={() => setHeroIdx((p) => (p - 1 + images.length) % images.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center cursor-pointer transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={() => setHeroIdx((p) => (p + 1) % images.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center cursor-pointer transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </>
        )}

        {/* Title overlay */}
        <div className="absolute bottom-10 left-6 right-16 text-left">
          <h1 className="text-white text-2xl md:text-3xl font-black leading-tight drop-shadow-lg">{title}</h1>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-0 lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">
        
        {/* =========================================================================
            LEFT COLUMN (Desktop)
            ========================================================================= */}
        <div className="lg:col-span-7 space-y-6">

          {/* ── Rating + Location ───────────────────────────────────── */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <svg className="w-5 h-5 text-yellow-400 fill-yellow-400" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
              <span className="text-base font-black text-zinc-900">{rating_.toFixed(1)}</span>
              <span className="text-sm text-zinc-400 font-semibold">({reviewCount} reviews)</span>
            </div>
            {location && (
              <div className="mt-1">
                <p className="text-sm font-semibold text-zinc-600 mb-2">{location}</p>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  View on map
                </a>
              </div>
            )}
          </div>

          {/* ── About / Description ─────────────────────────────────── */}
          {description && (
            <div className="bg-white border border-zinc-150 rounded-2xl p-5 shadow-sm">
              <h3 className="text-xs text-zinc-400 font-black uppercase tracking-widest mb-3">About This Property</h3>
              <p className="text-sm text-zinc-600 font-semibold leading-relaxed whitespace-pre-wrap">{description}</p>
            </div>
          )}

          {/* ── Stay Details Card ───────────────────────────────────── */}
          <div className="bg-white border border-zinc-150 rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs text-zinc-400 font-black uppercase tracking-widest mb-4">Stay Details</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center gap-2 bg-blue-50/60 rounded-xl p-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Check-in</span>
                <span className="text-sm font-black text-zinc-900 text-center leading-tight">{checkIn || "—"}</span>
              </div>
              <div className="flex flex-col items-center gap-2 bg-blue-50/60 rounded-xl p-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Check-out</span>
                <span className="text-sm font-black text-zinc-900 text-center leading-tight">{checkOut || "—"}</span>
              </div>
              <div className="flex flex-col items-center gap-2 bg-blue-50/60 rounded-xl p-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
                </svg>
                <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Guests</span>
                <span className="text-sm font-black text-zinc-900 text-center leading-tight">{guests} {guests > 1 ? "Travelers" : "Traveler"}</span>
              </div>
            </div>

            {/* Nights + capacity row */}
            <div className="mt-5 pt-4 border-t border-zinc-100 grid grid-cols-4 gap-2 text-center">
              <div className="flex flex-col items-center gap-1">
                <span className="text-lg font-black text-zinc-900">{nights}</span>
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Night{nights > 1 ? "s" : ""}</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-lg font-black text-zinc-900">{capacity.bedrooms}</span>
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Bed{capacity.bedrooms > 1 ? "s" : ""}</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-lg font-black text-zinc-900">{capacity.bathrooms}</span>
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Bath{capacity.bathrooms > 1 ? "s" : ""}</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-lg font-black text-zinc-900">{capacity.guests}</span>
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Max guests</span>
              </div>
            </div>
          </div>

          {/* ── Amenities ───────────────────────────────────────────── */}
          {amenities.length > 0 && (
            <div className="bg-white border border-zinc-150 rounded-2xl p-5 shadow-sm">
              <h3 className="text-xs text-zinc-400 font-black uppercase tracking-widest mb-4">Amenities</h3>
              <div className="flex flex-wrap gap-2.5">
                {amenities.map((a: string, i: number) => (
                  <span key={i} className="flex items-center gap-2 px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-full text-sm font-bold text-zinc-700 hover:bg-zinc-100 transition-colors cursor-default">
                    {a.toLowerCase().includes("wifi") || a.toLowerCase().includes("wi-fi") ? "📶" :
                     a.toLowerCase().includes("air") || a.toLowerCase().includes("ac") ? "❄️" :
                     a.toLowerCase().includes("tv") ? "📺" :
                     a.toLowerCase().includes("park") ? "🚗" :
                     a.toLowerCase().includes("pool") ? "🏊" :
                     a.toLowerCase().includes("gym") ? "💪" :
                     a.toLowerCase().includes("kitchen") ? "🍳" :
                     a.toLowerCase().includes("laundry") || a.toLowerCase().includes("wash") ? "🧺" : "✓"}
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* =========================================================================
            RIGHT COLUMN (Desktop)
            ========================================================================= */}
        <div className="lg:col-span-5 space-y-6 mt-6 lg:mt-0">

          {/* ── Action Buttons ──────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setView("security")}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 text-xs sm:text-sm flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Security Access
            </button>
            <button onClick={() => setView("tips")}
              className="w-full py-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-2xl font-bold text-xs sm:text-sm flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Local Tips
            </button>
          </div>

          {/* ── Payment ─────────────────────────────────────────────── */}
          <div className="bg-white border border-zinc-150 rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs text-zinc-400 font-black uppercase tracking-widest mb-4">Payment</h3>
            <div className="flex items-center justify-between text-sm font-bold text-zinc-500">
              <span>Total Charge</span>
              <span className="text-zinc-800">{totalPrice}</span>
            </div>
            <div className="flex items-center justify-between text-base font-black text-zinc-900 border-t border-zinc-100 pt-3 mt-3">
              <span>Total Paid</span>
              <span>{totalPrice}</span>
            </div>
            <div className="mt-3 flex justify-end">
              <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs font-bold flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                Payment Complete
              </span>
            </div>
          </div>

          {/* Wi-Fi shortcut */}
          {wifiPassword && wifiPassword !== "N/A" && (
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2.5 text-sm font-bold text-blue-800">
                <span className="text-lg">📶</span>
                <span>Wi-Fi Password</span>
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(wifiPassword); triggerNotification("Wi-Fi password copied!", "success"); }}
                className="text-sm font-mono font-black text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                {wifiPassword} · Copy
              </button>
            </div>
          )}

          {/* ── Host Card ────────────────────────────────────────────── */}
          {(hostName || hostId) && (
            <div className="bg-white border border-zinc-150 rounded-2xl p-5 shadow-sm">
              <h3 className="text-xs text-zinc-400 font-black uppercase tracking-widest mb-4">Your Host</h3>
              <div className="flex items-center gap-3.5 mb-5">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-zinc-200 shrink-0 border border-zinc-100">
                  <img src={hostAvatar} alt={hostName} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="text-base font-black text-zinc-900">{hostName}</h4>
                  <p className="text-xs text-zinc-400 font-semibold mt-0.5">Property Host</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {hostPhone ? (
                  <>
                    <a
                      href={`tel:${hostPhone}`}
                      className="flex items-center justify-center gap-2 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl font-bold text-xs transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Call
                    </a>
                    <a
                      href={`https://wa.me/${hostPhone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 py-3 bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-xl font-bold text-xs transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      WhatsApp
                    </a>
                  </>
                ) : (
                  <div className="col-span-2 p-2 bg-zinc-50 border border-zinc-100 rounded-xl text-center text-[10px] font-bold text-zinc-400">
                    Phone not provided
                  </div>
                )}
                
                {hostId && (
                  <button
                    onClick={() => router.push(`/dashboard/guest/chat?hostId=${hostId}`)}
                    className="col-span-2 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                    </svg>
                    Chat in App
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Guard/Security Card ──────────────────────────────────── */}
          {(guardName || guardPhone) && (
            <div className="bg-white border border-zinc-150 rounded-2xl p-5 shadow-sm">
              <h3 className="text-xs text-zinc-400 font-black uppercase tracking-widest mb-4">Assigned Security</h3>
              <div className="flex items-center gap-3.5 mb-4">
                {guardAvatar ? (
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-200 shrink-0 border border-zinc-100">
                    <img src={guardAvatar} alt={guardName} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                )}
                <div>
                  <h4 className="text-base font-black text-zinc-900">{guardName || "Guard"}</h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${guardStatus === "AVAILABLE" ? "bg-emerald-50 text-emerald-600" : "bg-zinc-100 text-zinc-500"}`}>
                    {guardStatus}
                  </span>
                </div>
              </div>
              {guardPhone && (
                <div className="grid grid-cols-2 gap-2">
                  <a href={`tel:${guardPhone}`}
                    className="flex items-center justify-center gap-2 py-3 bg-zinc-800 hover:bg-zinc-900 text-white rounded-xl font-bold text-xs transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Call
                  </a>
                  <a href={`https://wa.me/${guardPhone.replace(/\D/g, "")}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-3 bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-xl font-bold text-xs transition-colors">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp
                  </a>
                </div>
              )}
            </div>
          )}

          {/* ── House Rules ─────────────────────────────────────────── */}
          {houseRules && (
            <div className="bg-white border border-zinc-150 rounded-2xl p-5 shadow-sm">
              <h3 className="text-xs text-zinc-400 font-black uppercase tracking-widest mb-4">House Rules</h3>
              {(houseRules.startsWith("http") && houseRules.includes("/")) ? (
                <img src={houseRules} alt="House Rules" className="w-full rounded-xl object-contain border border-zinc-100 shadow-sm" />
              ) : (
                <p className="text-sm text-zinc-600 font-semibold leading-relaxed whitespace-pre-wrap">{houseRules}</p>
              )}
            </div>
          )}

          {/* ── Review (completed bookings only) ────────────────────── */}
          {isCompleted && (booking?.hotelId || hotel?.id || hotel?._id) && (
            <div className="bg-white border border-zinc-150 rounded-2xl p-5 shadow-sm">
              <h3 className="text-xs text-zinc-400 font-black uppercase tracking-widest mb-4">Rate Your Stay</h3>
              {reviewSubmitted ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center space-y-2">
                  <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto text-white shadow-sm">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <h5 className="text-base font-extrabold text-emerald-800">Thank you!</h5>
                  <p className="text-sm text-emerald-600 font-semibold">Your feedback has been submitted.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  <p className="text-sm text-zinc-600 font-bold text-center">How was your stay?</p>
                  <div className="flex gap-2.5 justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setRating(star)} className="hover:scale-110 transition-transform cursor-pointer">
                        <svg className={`w-9 h-9 ${star <= rating ? "text-yellow-400 fill-yellow-400" : "text-zinc-200 fill-zinc-100"}`} viewBox="0 0 24 24">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                  <textarea value={comment} onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience with future guests..."
                    rows={4}
                    className="w-full text-sm font-semibold text-zinc-800 bg-zinc-50 border border-zinc-200 rounded-xl p-4 focus:bg-white focus:outline-none focus:border-blue-500 resize-none transition-colors" />
                  <button type="button" disabled={rating === 0 || isSubmittingReview} onClick={handleSubmitReview}
                    className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${rating === 0 || isSubmittingReview ? "bg-zinc-200 text-zinc-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg"}`}>
                    {isSubmittingReview ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
