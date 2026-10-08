import React, { useState, useEffect, useMemo } from "react";
import { useGetAllHotelsQuery, useToggleFavoriteMutation, useGetMyFavoritesQuery } from "@/redux/api/hotelApi";
import { useGetMyProfileQuery } from "@/redux/api/userApi";
import { StarIcon, MapPinIcon, HeartIcon } from "./Icons";
import { Sparkles } from "lucide-react";
import Pagination from "@/app/components/Pagination";
import { useDebounce } from "@/app/hooks/useDebounce";

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

const mockProperties: Property[] = [
  {
    id: 1,
    title: "Cozy Garden House",
    subtitle: "Perfect for families with spacious rooms",
    location: "Westside District",
    rating: 0,
    reviews: 120,
    price: "$120",
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80"
    ],
    description: "This lovely property features a spacious layout perfect for family vacations. Located in the beautiful Westside District with quick access to local parks and walking trails.",
    capacity: { guests: 6, bedrooms: 3, bathrooms: 2, wifi: 1, laundry: 1 },
    houseRules: [
      "Dogs are not permitted",
      "No smoking inside the premises",
      "No weapons allowed in the house",
      "Keep noise down after 10 PM"
    ],
    guard: {
      name: "Michael Rodriguez",
      phone: "+1 (555) 123-4567",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
      status: "Available"
    }
  },
  {
    id: 2,
    title: "Modern Studio",
    subtitle: "Stylish and compact for business travelers",
    location: "Business District",
    rating: 0,
    reviews: 89,
    price: "$95",
    image: "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Compact, functional, and fully automated studio designed with business travelers in mind. Centrally located in the high-rise corporate business zone with fiber-optic internet.",
    capacity: { guests: 2, bedrooms: 1, bathrooms: 1, wifi: 1, laundry: 0 },
    houseRules: [
      "No parties or loud gatherings",
      "No smoking",
      "Keep workspaces clean",
      "Quiet hours from 9 PM"
    ],
    guard: {
      name: "Ahmed Hassan",
      phone: "+880 1712-445566",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
      status: "Available"
    }
  },
  {
    id: 3,
    title: "Lakeside Retreat",
    subtitle: "Peaceful getaway with stunning lake views",
    location: "Lake District",
    rating: 0,
    reviews: 156,
    price: "$200",
    image: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80"
    ],
    description: "Recharge in this scenic nature lodge featuring floor-to-ceiling windows overlooking a clean mountain lake. Enjoy private canoeing, outdoor deck fires, and pure fresh air.",
    capacity: { guests: 4, bedrooms: 2, bathrooms: 2, wifi: 1, laundry: 1 },
    houseRules: [
      "Respect local wildlife",
      "Fires only in designated firepit",
      "Ensure boat is docked after use",
      "No loud music after sunset"
    ],
    guard: {
      name: "John Kowalski",
      phone: "+1 (555) 987-6543",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      status: "On Call"
    }
  },
  {
    id: 4,
    title: "Modern Apartment with City View",
    subtitle: "Cozy apartment close to downtown centers",
    location: "123 Main Street, Dhaka",
    rating: 0,
    reviews: 210,
    price: "$5,200",
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80"
    ],
    description: "This cozy modern apartment offers a calm and inviting experience with open spaces, balcony views, and smart home amenities. Located in a neighborhood close to cafes and business centers.",
    capacity: { guests: 6, bedrooms: 2, bathrooms: 2, wifi: 1, laundry: 1 },
    houseRules: [
      "Dogs are not permitted",
      "No smoking in rooms",
      "No weapons in the house",
      "Keep noise down after 10 PM"
    ],
    guard: {
      name: "Michael Rodriguez",
      phone: "+1 (555) 123-4567",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
      status: "Available"
    }
  }
];

interface ExplorePropertiesProps {
  onSelectProperty: (property: Property) => void;
  triggerNotification: (msg: string, type?: "success" | "error") => void;
  favoritesOnly?: boolean;
  openNotifications?: () => void;
  unreadCount?: number;
}

export default function ExploreProperties({
  onSelectProperty,
  triggerNotification,
  favoritesOnly = false,
  openNotifications,
  unreadCount = 0,
}: ExplorePropertiesProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const [page, setPage] = useState(1);
  const limit = 9;

  // Reset page when search query changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery]);

  const { data: hotelsResponse, isLoading: isLoadingAll, isFetching: isFetchingAll } = useGetAllHotelsQuery(
    { page, limit, searchTerm: debouncedSearchQuery || undefined },
    { skip: favoritesOnly }
  );
  const { data: favoritesResponse, isLoading: isLoadingFavs, isFetching: isFetchingFavs } = useGetMyFavoritesQuery(undefined);
  const [toggleFavoriteMutation] = useToggleFavoriteMutation();
  const [favoriteLoadingId, setFavoriteLoadingId] = useState<string | null>(null);

  const isLoading = favoritesOnly ? (isLoadingFavs || isFetchingFavs) : (isLoadingAll || isFetchingAll);
  const { data: profileResponse } = useGetMyProfileQuery(undefined);
  const profName = profileResponse?.data?.fullName || "Guest";

  const favoritedIds = React.useMemo(() => {
    const list = favoritesResponse?.data?.data || [];
    if (!Array.isArray(list)) return [];
    return list.map((fav: any) => fav.hotelId);
  }, [favoritesResponse]);

  const handleFavoriteClick = async (propertyId: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    // Prevent favoriting mock listings on the client side
    if (!/^[0-9a-fA-F]{24}$/.test(propertyId.toString())) {
      triggerNotification("Mock properties cannot be favorited.", "error");
      return;
    }
    if (favoriteLoadingId) return;
    setFavoriteLoadingId(propertyId.toString());
    try {
      await toggleFavoriteMutation(propertyId.toString()).unwrap();
      const isAlreadyFav = favoritedIds.includes(propertyId.toString()) || favoritedIds.includes(propertyId);
      triggerNotification(isAlreadyFav ? "Removed from favorites" : "Added to favorites!", "success");
    } catch (err) {
      console.error(err);
      triggerNotification("Failed to toggle favorite status", "error");
    } finally {
      setFavoriteLoadingId(null);
    }
  };

  // Map backend response if exists
  let properties: Property[] = [];

  if (favoritesOnly) {
    const list = favoritesResponse?.data?.data || [];
    if (Array.isArray(list)) {
      const validList = list.filter((fav: any) => fav.hotel !== null && fav.hotel !== undefined);
      properties = validList.map((fav: any) => {
        const hotel = fav.hotel;
        return {
          id: hotel.id,
          title: hotel.propertyTitle,
          subtitle: hotel.propertyDescription?.slice(0, 80) + "..." || "",
          location: hotel.propertyAddress,
          rating: parseFloat(hotel.hotelRating || "0"),
          reviews: hotel.hotelReviewCount || 0,
          price: `$${hotel.basePrice}`,
          image: hotel.uploadPhotosOrVideos?.[0] || "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
          images: hotel.uploadPhotosOrVideos?.length > 0 ? hotel.uploadPhotosOrVideos : [
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80"
          ],
          description: hotel.propertyDescription || "",
          capacity: {
            guests: hotel.maxGuests || 4,
            bedrooms: hotel.bedrooms || 2,
            bathrooms: hotel.bathrooms || 1,
            wifi: hotel.wifiPassword ? 1 : 0,
            laundry: 1
          },
          houseRules: hotel.houseRules ? [hotel.houseRules] : ["No smoking inside", "No loud noise after 10 PM"],
          guard: hotel.guards ? {
            name: hotel.guards.name,
            phone: hotel.guards.phone,
            avatar: hotel.guards.photo || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
            status: hotel.guards.status || "AVAILABLE"
          } : undefined,
          amenities: hotel.amenities || [],
          addLocalTips: hotel.addLocalTips || [],
          houseRulesImg: hotel.houseRules || "",
          customPrices: hotel.customPrices || [],
          host: hotel.user ? {
            id: hotel.user.id || hotel.partnerId,
            name: hotel.user.fullName || "Host",
            avatar: hotel.user.profileImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
          } : undefined,
          bookedDates: hotel.hotel_bookings || [],
        };
      });
    }
  } else {
    const hotelsList = hotelsResponse?.data?.data || [];
    if (hotelsResponse?.success && Array.isArray(hotelsList) && hotelsList.length > 0) {
      properties = hotelsList.map((hotel: any) => ({
        id: hotel.id,
        title: hotel.propertyTitle,
        subtitle: hotel.propertyDescription?.slice(0, 80) + "..." || "",
        location: hotel.propertyAddress,
        rating: parseFloat(hotel.hotelRating || "0"),
        reviews: hotel.hotelReviewCount || 0,
        price: `$${hotel.basePrice}`,
        image: hotel.uploadPhotosOrVideos?.[0] || "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
        images: hotel.uploadPhotosOrVideos?.length > 0 ? hotel.uploadPhotosOrVideos : [
          "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80"
        ],
        description: hotel.propertyDescription || "",
        capacity: {
          guests: hotel.maxGuests || 4,
          bedrooms: hotel.bedrooms || 2,
          bathrooms: hotel.bathrooms || 1,
          wifi: hotel.wifiPassword ? 1 : 0,
          laundry: 1
        },
        houseRules: hotel.houseRules ? [hotel.houseRules] : ["No smoking inside", "No loud noise after 10 PM"],
        guard: hotel.guards ? {
          name: hotel.guards.name,
          phone: hotel.guards.phone,
          avatar: hotel.guards.photo || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
          status: hotel.guards.status || "AVAILABLE"
        } : undefined,
        amenities: hotel.amenities || [],
        addLocalTips: hotel.addLocalTips || [],
        houseRulesImg: hotel.houseRules || "",
        customPrices: hotel.customPrices || [],
        host: hotel.user ? {
          id: hotel.user.id || hotel.partnerId,
          name: hotel.user.fullName || "Host",
          avatar: hotel.user.profileImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
        } : undefined,
        bookedDates: hotel.hotel_bookings || [],
      }));
    } else {
      properties = [];
    }
  }

  // Filter properties based on search query
  const searchLower = debouncedSearchQuery.toLowerCase();
  const filteredProperties = properties.filter((prop) =>
    prop.title.toLowerCase().includes(searchLower) ||
    prop.location.toLowerCase().includes(searchLower)
  );

  const paginatedProperties = useMemo(() => {
    if (!favoritesOnly) return filteredProperties;
    const startIndex = (page - 1) * limit;
    return filteredProperties.slice(startIndex, startIndex + limit);
  }, [filteredProperties, favoritesOnly, page, limit]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-zinc-400">Loading properties...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 lg:p-10 max-w-7xl mx-auto space-y-10 text-left">
      {/* Welcome banner */}
      <div className="relative overflow-hidden flex items-center justify-between p-6 sm:p-8 rounded-[2rem] bg-gradient-to-br from-blue-900 via-indigo-900 to-indigo-950 text-white shadow-xl shadow-blue-900/20 text-left border border-white/10">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-blue-400/20 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-10 -mb-20 w-48 h-48 rounded-full bg-purple-500/20 blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-sm flex items-center gap-2">
            Good Evening, {profName} <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-blue-300 fill-blue-300/30 animate-pulse" />
          </h2>
          <p className="mt-2 text-sm sm:text-base text-blue-100/80 font-medium">
            Here's your today's overview. Find your next perfect stay.
          </p>
        </div>
        {openNotifications && (
          <button
            onClick={openNotifications}
            className="relative z-10 h-14 w-14 rounded-full border border-white/20 bg-white/10 backdrop-blur-md p-3 text-white flex items-center justify-center shrink-0 hover:bg-white/20 transition-all cursor-pointer shadow-lg shadow-black/10 hover:scale-105 active:scale-95"
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
        )}
      </div>

      {/* Listings Category grid */}
      <div className="space-y-8 animate-fadeIn">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
            {favoritesOnly ? "Favorites" : "Explore Properties"}
          </h2>
          <div className="relative w-full sm:w-80 group">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-zinc-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search prime destinations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-4 py-3.5 rounded-full border border-zinc-200 bg-white/70 backdrop-blur-md shadow-sm shadow-zinc-100 font-semibold text-sm w-full focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-zinc-400"
            />
          </div>
        </div>

        {paginatedProperties.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-zinc-150 p-8 shadow-sm">
            <p className="text-sm font-bold text-zinc-400">
              {favoritesOnly
                ? "No favorite properties saved yet."
                : debouncedSearchQuery
                  ? "No properties found matching your search."
                  : "No properties found!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedProperties.map((prop) => {
              const isFav = favoritedIds.includes(prop.id.toString()) || favoritedIds.includes(prop.id);
              return (
                <div
                  key={prop.id}
                  onClick={() => onSelectProperty(prop)}
                  className="group relative bg-white/60 backdrop-blur-lg border border-white rounded-[2rem] overflow-hidden shadow-lg shadow-zinc-200/40 hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-500 cursor-pointer flex flex-col h-full hover:-translate-y-1"
                >
                  <div className="relative h-64 w-full overflow-hidden p-3 pb-0">
                    <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-inner">
                      <img
                        src={prop.image}
                        alt={prop.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>

                      {/* Price Tag Overlay */}
                      <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-baseline gap-1 shadow-lg">
                        <span className="text-base font-black drop-shadow-sm">{prop.price}</span>
                        <span className="text-[10px] font-bold opacity-90 drop-shadow-sm">/night</span>
                      </div>

                      <button
                        onClick={(e) => handleFavoriteClick(prop.id, e)}
                        disabled={favoriteLoadingId === prop.id.toString()}
                        className={`absolute top-4 right-4 p-2.5 rounded-full bg-black/20 backdrop-blur-md border border-white/20 text-white hover:bg-black/40 hover:scale-110 transition-all shadow-lg ${favoriteLoadingId === prop.id.toString() ? "cursor-not-allowed opacity-80" : ""
                          }`}
                      >
                        {favoriteLoadingId === prop.id.toString() ? (
                          <svg className="w-5 h-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <HeartIcon filled={isFav} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="p-5 px-6 flex-1 flex flex-col justify-between relative z-10">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg font-black text-zinc-900 leading-snug group-hover:text-blue-600 transition-colors line-clamp-1">
                          {prop.title}
                        </h3>
                        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-lg border border-emerald-100/50 shadow-sm shrink-0">
                          <StarIcon />
                          <span className="text-xs font-black">{prop.rating}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-semibold">
                        <MapPinIcon />
                        <span className="line-clamp-1">{prop.location}</span>
                      </div>

                      <p className="text-xs text-zinc-400 font-medium leading-relaxed line-clamp-2 mt-2">
                        {prop.subtitle}
                      </p>
                    </div>

                    <button
                      onClick={() => onSelectProperty(prop)}
                      className="w-full mt-6 py-3.5 bg-zinc-900 hover:bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-zinc-900/20 hover:shadow-blue-500/30 transition-all duration-300 text-sm flex items-center justify-center gap-2 group-hover:scale-[1.02]"
                    >
                      View Details
                      <svg className="w-4 h-4 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {!favoritesOnly && hotelsResponse?.data?.meta ? (
          <Pagination
            currentPage={page}
            totalItems={hotelsResponse.data.meta.total}
            limit={limit}
            onPageChange={setPage}
          />
        ) : favoritesOnly && filteredProperties.length > 0 ? (
          <Pagination
            currentPage={page}
            totalItems={filteredProperties.length}
            limit={limit}
            onPageChange={setPage}
          />
        ) : null}
      </div>
    </div>
  );
}
