import httpStatus from "http-status";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";
import { addDays, differenceInDays, format, isWithinInterval, parse, startOfDay } from "date-fns";
import { BookingStatus } from "@prisma/client";
import { IHotelBookingData } from "./hotelBooking.interface";
import { uploadFile } from "../../../helpars/fileUploader";
import { IPaginationOptions } from "../../../interfaces/paginations";
import { paginationHelpers } from "../../../helpars/paginationHelper";

// create Hotel Booking service
const createHotelRoomBooking = async (
  userId: string,
  hotelId: string,
  data: IHotelBookingData,
) => {
  const { bookedFromDate, bookedToDate } = data;

  // find user
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  // find hotel
  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
    select: {
      id: true,
      basePrice: true,
      partnerId: true,
      weeklyOffers: true,
      monthlyOffers: true,
      customPrices: true,
    },
  });
  if (!hotel) {
    throw new ApiError(httpStatus.NOT_FOUND, "Hotel not found");
  }

  if (!bookedFromDate || !bookedToDate) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Missing required fields");
  }

  // calculate number of nights
  const fromDate = parse(bookedFromDate, "yyyy-MM-dd", new Date());
  const toDate = parse(bookedToDate, "yyyy-MM-dd", new Date());
  const today = startOfDay(new Date());

  if (fromDate < today) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Cannot book for past dates");
  }

  const numberOfNights = differenceInDays(toDate, fromDate);
  // console.log(numberOfNights);

  if (numberOfNights <= 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid booking date range");
  }

  // calculate total price day by day (using custom price if available, else base price)
  let totalPrice = 0;
  let currentDate = fromDate;

  while (currentDate < toDate) {
    const customPrice = hotel.customPrices?.find((cp) => {
      const start = startOfDay(new Date(cp.startDate));
      const end = startOfDay(new Date(cp.endDate));
      const current = startOfDay(currentDate);
      return isWithinInterval(current, { start, end });
    });

    if (customPrice) {
      totalPrice += customPrice.price;
    } else {
      totalPrice += hotel.basePrice;
    }

    currentDate = addDays(currentDate, 1);
  }

  // price not 0 or null
  if (!totalPrice || totalPrice === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid hotel total price");
  }

  // apply weekly discount (7 days or more)
  if (numberOfNights >= 7 && numberOfNights < 30 && hotel.weeklyOffers) {
    const weeklyDiscount = (totalPrice * hotel.weeklyOffers) / 100;
    totalPrice -= weeklyDiscount;
  }
  // apply monthly discount (30 days or more)
  else if (numberOfNights >= 30 && hotel.monthlyOffers) {
    const monthlyDiscount = (totalPrice * hotel.monthlyOffers) / 100;
    totalPrice -= monthlyDiscount;
  }

  // check for overlapping bookings
  const overlappingBooking = await prisma.hotel_Booking.findFirst({
    where: {
      hotelId,
      bookingStatus: BookingStatus.CONFIRMED, // ignore cancelled bookings
      OR: [
        {
          bookedFromDate: { lt: bookedToDate },
          bookedToDate: { gt: bookedFromDate },
        },
      ],
    },
    select: {
      id: true,
    },
  });

  if (overlappingBooking) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "This hotel is already booked for the selected dates",
    );
  }

  const result = await prisma.hotel_Booking.create({
    data: {
      totalPrice: Number(totalPrice.toFixed(2)),
      bookedFromDate,
      bookedToDate,
      personOfGuests: data.personOfGuests,
      userId,
      hotelId: hotel?.id,
      partnerId: hotel.partnerId!,
      bookingStatus: BookingStatus.PENDING,
    },
  });

  return result;
};

// get all hotel  bookings
const getAllHotelBookings = async (
  partnerId: string,
  filter?: string,
  options?: IPaginationOptions,
) => {
  const { page, skip, limit } = paginationHelpers.calculatedPagination(
    options || {},
  );

  // find partner
  const partner = await prisma.user.findUnique({ where: { id: partnerId } });
  if (!partner) {
    throw new ApiError(httpStatus.NOT_FOUND, "Partner not found");
  }

  let whereClause: any = { partnerId };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayString = today.toISOString().split("T")[0];

  if (filter === "new-requests") {
    // New Requests: Bookings created today with CONFIRMED status
    whereClause.bookingStatus = BookingStatus.CONFIRMED;
    whereClause.createdAt = {
      gte: today,
    };
  } else if (filter === "ongoing") {
    // Ongoing: All CONFIRMED bookings (regardless of date)
    whereClause.bookingStatus = BookingStatus.CONFIRMED;
  } else if (filter === "completed") {
    // Completed: All COMPLETED bookings
    whereClause.bookingStatus = BookingStatus.COMPLETED;
  }
  // if no filter return all

  const result = await prisma.hotel_Booking.findMany({
    where: whereClause,
    skip,
    take: limit,
    include: {
      hotel: {
        select: {
          id: true,
          propertyTitle: true,
          propertyAddress: true,
          uploadPhotosOrVideos: true,
          propertyDescription: true,
          latitude: true,
          longitude: true,
          maxGuests: true,
          bedrooms: true,
          smartLockCode: true,
          keyBoxPin: true,
          wifiPassword: true,
          amenities: true,
          inventoryItems: true,
          houseRules: true,
          addSecurityKeys: true,
          addLocalTips: true,
          basePrice: true,
          customPrices: true,
          weeklyOffers: true,
          monthlyOffers: true,
          availableForBooking: true,
          hotelRating: true,
          hotelReviewCount: true,
          isFavorite: true,
          syncWithAirbnb: true,
          airbnbIcalUrl: true,
          createdAt: true,
          updatedAt: true,
          partnerId: true,
          review: true,
        },
      },
      payment: true,
      user: {
        select: {
          id: true,
          fullName: true,
          profileImage: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const total = await prisma.hotel_Booking.count({ where: whereClause });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

// get single hotel booking for owner
const getSingleHotelBookingForOwner = async (partnerId: string) => {
  // find partner
  const partner = await prisma.user.findUnique({ where: { id: partnerId } });
  if (!partner) {
    throw new ApiError(httpStatus.NOT_FOUND, "Partner not found");
  }

  const result = await prisma.hotel_Booking.findFirst({
    where: { partnerId: partner.id, bookingStatus: BookingStatus.CONFIRMED },
    include: {
      hotel: true,
      payment: true,
    },
  });

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "No bookings found");
  }

  return result;
};

// get single my hotel booking
const getSingleMyHotelBookingForUser = async (userId: string) => {
  // find user
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const result = await prisma.hotel_Booking.findFirst({
    where: { userId, bookingStatus: BookingStatus.CONFIRMED },
    include: {
      hotel: true,
      payment: true,
    },
  });

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "No bookings found");
  }

  const partner = await prisma.user.findUnique({
    where: { id: result.partnerId },
    select: {
      id: true,
      fullName: true,
      profileImage: true,
    },
  });

  const review = await prisma.review.findFirst({
    where: { 
      userId,
      OR: [
        { bookingId: result.id },
        { hotelId: result.hotelId as string }
      ]
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          profileImage: true,
        },
      },
    },
  });

  return {
    ...result,
    partner: partner
      ? {
          id: partner.id,
          fullName: partner.fullName,
          image: partner.profileImage,
        }
      : null,
    review: review ? [review] : [],
  };
};

// get single booking details for user hotel by the bookingId
const getSingleBookingDetailForUserHotelByBookingId = async (
  userId: string,
  bookingId: string,
) => {
  // find user
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  console.log(`[HotelBookingService] Fetching booking details for ID: ${bookingId}, UserID: ${userId}`);

  const result = await prisma.hotel_Booking.findFirst({
    where: { id: bookingId, userId },
    include: {
      hotel: true,
      payment: true,
    },
  });

  console.log(`[HotelBookingService] Database query result:`, result ? "Found" : "Not Found");
  if (result) {
    console.log(`[HotelBookingService] Booking status is: ${result.bookingStatus}`);
  }

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "No bookings found");
  }

  const partner = await prisma.user.findUnique({
    where: { id: result.partnerId },
    select: {
      id: true,
      fullName: true,
      profileImage: true,
    },
  });

  const review = await prisma.review.findFirst({
    where: { 
      userId,
      OR: [
        { bookingId: result.id },
        { hotelId: result.hotelId as string }
      ]
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          profileImage: true,
        },
      },
    },
  });

  return {
    ...result,
    partner: partner
      ? {
          id: partner.id,
          fullName: partner.fullName,
          image: partner.profileImage,
        }
      : null,
    review: review ? [review] : [],
  };
};

// get all my hotel bookings
const getAllMyHotelBookings = async (
  userId: string,
  options: IPaginationOptions,
) => {
  const { limit, page, skip } = paginationHelpers.calculatedPagination(options);

  const where = { userId, bookingStatus: BookingStatus.CONFIRMED };
  const result = await prisma.hotel_Booking.findMany({
    where,
    skip,
    take: limit,
    include: {
      hotel: true,
      payment: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const total = await prisma.hotel_Booking.count({ where });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: result,
  };
};

// get hotel booking by id
const getHotelBookingById = async (partnerId: string, bookingId: string) => {
  const booking = await prisma.hotel_Booking.findUnique({
    where: { id: bookingId, partnerId },
    include: {
      hotel: {
        select: {
          id: true,
          propertyTitle: true,
          propertyAddress: true,
          uploadPhotosOrVideos: true,
        },
      },
      user: {
        select: {
          id: true,
          fullName: true,
          contactNumber: true,
        },
      },
    },
  });
  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, "Booking not found");
  }

  if (booking?.partnerId !== partnerId) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You are not authorized to update this booking",
    );
  }
  return booking;
};

// create travelers with passport images for booking
const createTravelers = async (
  bookingId: string,
  travelersData: { fullName: string }[],
  passportFiles?: Express.Multer.File[],
) => {
  const booking = await prisma.hotel_Booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, "Booking not found");
  }

  const travelers: any = [];

  for (let i = 0; i < travelersData.length; i++) {
    const traveler = travelersData[i];
    let passportImageUrl: string | undefined;

    // upload passport image if available
    if (passportFiles && passportFiles[i]) {
      const uploaded = await uploadFile.uploadToCloudinary(passportFiles[i]);
      if (uploaded?.secure_url) {
        passportImageUrl = uploaded.secure_url;
      }
    }

    const createdTraveler = await prisma.traveler.create({
      data: {
        fullName: traveler.fullName,
        passportImageUrl: passportImageUrl || "",
        bookingId: bookingId,
      },
    });

    travelers.push(createdTraveler);
  }

  return travelers;
};

// get my guest bookings list (Simplified UI format)
const getGuestBookings = async (
  userId: string,
  status?: string, // UPCOMING, COMPLETED, CANCELLED
  options?: IPaginationOptions,
) => {
  const { limit, page, skip } = paginationHelpers.calculatedPagination(options || {});

  // Build the filter condition for the query
  let whereClause: any = { userId };

  if (status) {
    const todayStr = format(new Date(), "yyyy-MM-dd");

    if (status === "UPCOMING") {
      whereClause.bookingStatus = {
        in: [BookingStatus.PENDING, BookingStatus.NEED_ACCEPT, BookingStatus.CONFIRMED],
      };
      whereClause.bookedToDate = {
        gte: todayStr,
      };
    } else if (status === "COMPLETED") {
      whereClause.OR = [
        {
          bookingStatus: {
            in: [BookingStatus.COMPLETED, BookingStatus.COMPLETED_BY_PROVIDER, BookingStatus.IN_WORKING],
          },
        },
        {
          bookingStatus: {
            in: [BookingStatus.PENDING, BookingStatus.NEED_ACCEPT, BookingStatus.CONFIRMED],
          },
          bookedToDate: {
            lt: todayStr,
          },
        },
      ];
    } else if (status === "CANCELLED") {
      whereClause.bookingStatus = {
        in: [BookingStatus.CANCELLED, BookingStatus.REJECTED, BookingStatus.EXPIRED],
      };
    }
  }

  const bookings = await prisma.hotel_Booking.findMany({
    where: whereClause,
    skip,
    take: limit,
    include: {
      hotel: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const total = await prisma.hotel_Booking.count({ where: whereClause });

  // Map database bookings to expected frontend JSON response
  const mappedData = bookings.map((booking) => {
    // Map granular status to simplified UI status
    let simplifiedStatus = "UPCOMING";
    const bs = booking.bookingStatus;
    if (bs === BookingStatus.COMPLETED || bs === BookingStatus.COMPLETED_BY_PROVIDER || bs === BookingStatus.IN_WORKING) {
      simplifiedStatus = "COMPLETED";
    } else if (bs === BookingStatus.CANCELLED || bs === BookingStatus.REJECTED || bs === BookingStatus.EXPIRED) {
      simplifiedStatus = "CANCELLED";
    }

    // Format dates (bookedFromDate is "2026-04-14")
    let checkInFormatted = booking.bookedFromDate;
    let checkOutFormatted = booking.bookedToDate;
    try {
      const fromDateObj = parse(booking.bookedFromDate, "yyyy-MM-dd", new Date());
      const toDateObj = parse(booking.bookedToDate, "yyyy-MM-dd", new Date());
      checkInFormatted = format(fromDateObj, "d MMM, yyyy");
      checkOutFormatted = format(toDateObj, "d MMM, yyyy");

      // If check-out date is in the past and the booking is not cancelled/rejected/expired, it is COMPLETED
      const today = startOfDay(new Date());
      if (toDateObj < today && 
          bs !== BookingStatus.CANCELLED && 
          bs !== BookingStatus.REJECTED && 
          bs !== BookingStatus.EXPIRED) {
        simplifiedStatus = "COMPLETED";
      }
    } catch (err) {
      // ignore
    }

    // Price formatting (using BDT as default)
    const formattedPrice = `$${booking.totalPrice.toFixed(2)}`;

    return {
      id: booking.id,
      property_name: booking.hotel?.propertyTitle || "",
      property_image: booking.hotel?.uploadPhotosOrVideos?.[0] || "https://example.com/default.jpg",
      check_in_date: checkInFormatted,
      check_out_date: checkOutFormatted,
      status: simplifiedStatus,
      total_price: formattedPrice,
    };
  });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: mappedData,
  };
};

// get my guest booking details by ID (Simplified UI format)
const getGuestBookingDetails = async (userId: string, bookingId: string) => {
  const booking = await prisma.hotel_Booking.findFirst({
    where: { id: bookingId, userId },
    include: {
      hotel: {
        include: {
          guards: true,
        },
      },
      payment: true,
      travelers: true,
    },
  });

  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, "Booking not found");
  }

  // Fetch host info
  let hostInfo = null;
  if (booking.hotel?.partnerId) {
    const host = await prisma.user.findUnique({
      where: { id: booking.hotel.partnerId },
      select: {
        fullName: true,
        profileImage: true,
        contactNumber: true,
      },
    });
    if (host) {
      hostInfo = {
        name: host.fullName || "",
        image: host.profileImage || "https://example.com/host-default.jpg",
        phone: host.contactNumber || "",
      };
    }
  }

  // Translate status
  let simplifiedStatus = "UPCOMING";
  const bs = booking.bookingStatus;
  if (bs === BookingStatus.COMPLETED || bs === BookingStatus.COMPLETED_BY_PROVIDER || bs === BookingStatus.IN_WORKING) {
    simplifiedStatus = "COMPLETED";
  } else if (bs === BookingStatus.CANCELLED || bs === BookingStatus.REJECTED || bs === BookingStatus.EXPIRED) {
    simplifiedStatus = "CANCELLED";
  }

  // Formatted confirmed_on date (booking.createdAt is DateTime)
  let confirmedOnFormatted = "";
  try {
    confirmedOnFormatted = format(new Date(booking.createdAt), "d MMM, yyyy 'at' h:mm a");
  } catch (err) {
    // fallback
  }

  // Parse dates and duration
  let checkInFormatted = booking.bookedFromDate;
  let checkOutFormatted = booking.bookedToDate;
  let durationNights = 0;
  try {
    const fromDateObj = parse(booking.bookedFromDate, "yyyy-MM-dd", new Date());
    const toDateObj = parse(booking.bookedToDate, "yyyy-MM-dd", new Date());
    checkInFormatted = format(fromDateObj, "d MMM, yyyy");
    checkOutFormatted = format(toDateObj, "d MMM, yyyy");
    durationNights = differenceInDays(toDateObj, fromDateObj);

    // If check-out date is in the past and the booking is not cancelled/rejected/expired, it is COMPLETED
    const today = startOfDay(new Date());
    if (toDateObj < today && 
        bs !== BookingStatus.CANCELLED && 
        bs !== BookingStatus.REJECTED && 
        bs !== BookingStatus.EXPIRED) {
      simplifiedStatus = "COMPLETED";
    }
  } catch (err) {
    // ignore
  }

  // Format payment details (using BDT as default)
  const totalPaidNum = booking.totalPrice;

  const paymentSummary = {
    total_paid: `$${totalPaidNum.toFixed(2)}`,
  };

  // House rules mapping (we check if it exists, return fallback rules array and image path)
  const houseRulesText = [
    "🚭 No smoking inside the property",
    "🐾 Pets are not allowed",
    "🔇 Please keep noise down after 10:00 PM",
  ];

  // Emergency contact mapping (from guard, fallback to host phone)
  const emergencyContact = booking.hotel?.guards?.phone || hostInfo?.phone || "";

  return {
    id: booking.id,
    status: simplifiedStatus,
    confirmed_on: confirmedOnFormatted,
    property_info: {
      name: booking.hotel?.propertyTitle || "",
      image: booking.hotel?.uploadPhotosOrVideos?.[0] || "https://example.com/default.jpg",
      address: booking.hotel?.propertyAddress || "",
      rating: booking.hotel?.hotelRating ? parseFloat(booking.hotel.hotelRating) : 0,
      review_count: booking.hotel?.hotelReviewCount || 0,
    },
    stay_details: {
      check_in_date: checkInFormatted,
      check_in_time: "02:00 PM",
      check_out_date: checkOutFormatted,
      check_out_time: "11:00 AM",
      duration: `${durationNights} ${durationNights === 1 ? 'Night' : 'Nights'}`,
      guests: `${booking.personOfGuests} ${booking.personOfGuests === 1 ? 'Guest' : 'Guests'}`,
    },
    host_info: hostInfo,
    amenities: booking.hotel?.amenities || [],
    wifi_password: booking.hotel?.wifiPassword || "",
    house_rules: houseRulesText,
    house_rules_image: booking.hotel?.houseRules || "",
    payment_summary: paymentSummary,
    emergency_contact: emergencyContact,
  };
};

// check if user has an active confirmed booking for a specific hotel
const checkAccessForHotel = async (userId: string, hotelId: string) => {
  const booking = await prisma.hotel_Booking.findFirst({
    where: {
      userId,
      hotelId,
      bookingStatus: BookingStatus.CONFIRMED,
    },
    select: { id: true, bookedFromDate: true, bookedToDate: true },
  });

  return {
    hasAccess: !!booking,
    bookingId: booking?.id || null,
    checkIn: booking?.bookedFromDate || null,
    checkOut: booking?.bookedToDate || null,
  };
};

export const HotelBookingService = {
  createHotelRoomBooking,
  getAllHotelBookings,
  getSingleHotelBookingForOwner,
  getAllMyHotelBookings,
  getGuestBookings,
  getGuestBookingDetails,
  getSingleMyHotelBookingForUser,
  getSingleBookingDetailForUserHotelByBookingId,
  getHotelBookingById,
  createTravelers,
  checkAccessForHotel,
};
