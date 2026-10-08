import { Request } from "express";
import prisma from "../../../shared/prisma";
import { IUploadedFile } from "../../../interfaces/file";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import { Hotel, Prisma } from "@prisma/client";
import { paginationHelpers } from "../../../helpars/paginationHelper";
import { IPaginationOptions } from "../../../interfaces/paginations";
import { IHotelFilterRequest } from "./hotel.interface";
import { searchableFields } from "./hotel.constant";
import { uploadFile } from "../../../helpars/fileUploader";

const getRatingString = (rating: string | null | undefined): string => {
  const numRating = Number(rating);
  if (!numRating || isNaN(numRating)) return "No reviews yet";
  if (numRating >= 4.5) return "Excellent";
  if (numRating >= 4.0) return "Very Good";
  if (numRating >= 3.5) return "Good";
  if (numRating >= 3.0) return "Average";
  return "Poor";
};

// create hotel
const createHotel = async (req: Request) => {
  const partnerId = req.user?.id;

  const partnerExists = await prisma.user.findUnique({
    where: { id: partnerId },
  });

  if (!partnerExists) {
    throw new ApiError(httpStatus.NOT_FOUND, "Partner not found");
  }

  const files = req.files as {
    [fieldname: string]: Express.Multer.File[];
  };

  const hotelRule = files?.houseRules?.[0];
  // const hotelImagesOrV = files?.uploadPhotosOrVideos?.[0];
  const hotelImagesOrV = files?.uploadPhotosOrVideos || [];

  if (!hotelImagesOrV) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "uploadPhotosOrVideos field is required",
    );
  }

  if (!hotelRule) {
    throw new ApiError(httpStatus.BAD_REQUEST, "houseRules field is required");
  }

  // upload house rules
  let uploadedHouseRules: string | undefined;
  if (hotelRule) {
    const uploaded = await uploadFile.uploadToCloudinary(hotelRule);
    if (!uploaded?.secure_url) {
      throw new Error("Cloudinary upload failed");
    }
    uploadedHouseRules = uploaded.secure_url;
  }

  // upload photos & videos (multiple files)
  const uploadedMedia: string[] = [];

  const uploads = await Promise.all(
    hotelImagesOrV.map((file) => uploadFile.uploadToCloudinary(file)),
  );

  uploads.forEach((u) => {
    if (!u?.secure_url) {
      throw new Error("Cloudinary upload failed");
    }
    uploadedMedia.push(u.secure_url);
  });

  // upload subcategory images
  const subcategoryImages = files?.subcategoryImage || [];
  const uploadedSubcategoryImages: string[] = [];
  if (subcategoryImages.length > 0) {
    const subUploads = await Promise.all(
      subcategoryImages.map((file) => uploadFile.uploadToCloudinary(file)),
    );
    subUploads.forEach((u) => {
      if (!u?.secure_url) {
        throw new Error("Cloudinary subcategory upload failed");
      }
      uploadedSubcategoryImages.push(u.secure_url);
    });
  }

  const {
    // propertyName,
    propertyTitle,
    propertyAddress,
    propertyDescription,

    latitude,
    longitude,

    maxGuests,
    bedrooms,
    bathrooms,

    smartLockCode,
    keyBoxPin,
    wifiPassword,

    amenities,

    addSecurityKeys,
    addLocalTips,

    basePrice,
    weeklyOffers,
    monthlyOffers,

    customPrices, // [{startDate, endDate, price}]
    inventoryItems, // [{name, quantity}]

    availableForBooking,
    syncWithAirbnb,
    airbnbIcalUrl,
  } = req.body;

  const result = await prisma.hotel.create({
    data: {
      // propertyName,
      uploadPhotosOrVideos: uploadedMedia,
      propertyTitle,
      propertyAddress,
      propertyDescription,

      latitude: latitude ? parseFloat(latitude) : (null as any),
      longitude: longitude ? parseFloat(longitude) : (null as any),

      maxGuests: parseInt(maxGuests),
      bedrooms: parseInt(bedrooms),
      bathrooms: parseInt(bathrooms),

      smartLockCode,
      keyBoxPin,
      wifiPassword,

      amenities:
        typeof amenities === "string" ? JSON.parse(amenities) : amenities || [],

      houseRules: uploadedHouseRules as string,
      addSecurityKeys,
      addLocalTips: (() => {
        const tips = typeof addLocalTips === "string" ? JSON.parse(addLocalTips) : addLocalTips || [];
        let imageIndex = 0;
        return tips.map((tip: any) => {
          // parse isActive if it's a string
          if (typeof tip.isActive === "string") {
            tip.isActive = tip.isActive === "true";
          }

          if ((!tip.subcategoryImage || tip.subcategoryImage === "new_file") && uploadedSubcategoryImages[imageIndex]) {
            tip.subcategoryImage = uploadedSubcategoryImages[imageIndex++];
          }
          return tip;
        });
      })(),

      basePrice: parseFloat(basePrice),
      weeklyOffers: weeklyOffers ? parseFloat(weeklyOffers) : undefined,
      monthlyOffers: monthlyOffers ? parseFloat(monthlyOffers) : undefined,

      partnerId,

      // custom Price Range
      customPrices: customPrices
        ? {
          create: (typeof customPrices === "string"
            ? JSON.parse(customPrices)
            : customPrices
          ).map((p: any) => {
            // Handle single date case
            if (p.date) {
              return {
                startDate: new Date(p.date),
                endDate: new Date(p.date), // same date for single day
                price: p.price,
              };
            }
            // Handle date range case
            return {
              startDate: new Date(p.startDate),
              endDate: new Date(p.endDate),
              price: p.price,
            };
          }),
        }
        : undefined,

      // inventory
      inventoryItems: inventoryItems
        ? (() => {
          const items: any[] = typeof inventoryItems === "string"
            ? JSON.parse(inventoryItems)
            : inventoryItems;

          // Validate quantity for each item before sending to Prisma
          items.forEach((item: any, index: number) => {
            const qty = parseInt(String(item.quantity), 10);
            if (isNaN(qty)) {
              throw new ApiError(
                httpStatus.BAD_REQUEST,
                `Inventory item "${item.name || `#${index + 1}`}" has an invalid quantity "${item.quantity}". Quantity must be a whole number (e.g. 12).`
              );
            }
            // Normalise to integer so Prisma never receives a string
            item.quantity = qty;
          });

          return {
            create: items.map((item: any) => ({
              name: item.name,
              quantity: item.quantity,
            })),
          };
        })()
        : undefined,

      availableForBooking,
      syncWithAirbnb: String(syncWithAirbnb) === "true", // convert to boolean
      airbnbIcalUrl,
    },
    include: {
      customPrices: true,
      inventoryItems: true,
    },
  });

  return result;
};

// create guard
const createGuard = async (req: Request) => {
  const { name, phone, whatsapp, status } = req.body;
  const hotelId = req.params.hotelId;

  // check if hotel exists
  const hotelExists = await prisma.hotel.findUnique({
    where: { id: hotelId },
  });
  if (!hotelExists) {
    throw new ApiError(httpStatus.NOT_FOUND, "Hotel not found");
  }

  // handle photo upload
  let uploadedPhoto: string | undefined;
  const files = req.files as {
    [fieldname: string]: Express.Multer.File[];
  };

  const guardPhotoFile = files?.guardPhoto?.[0];
  if (guardPhotoFile) {
    const uploaded = await uploadFile.uploadToCloudinary(guardPhotoFile);
    if (!uploaded?.secure_url) {
      throw new Error("Cloudinary upload failed");
    }
    uploadedPhoto = uploaded.secure_url;
  }

  // check if guard already exists for this hotel
  const existingGuard = await prisma.guard.findUnique({
    where: { hotelId },
  });

  if (existingGuard) {
    // update existing guard instead of throwing error
    const result = await prisma.guard.update({
      where: { hotelId },
      data: {
        name,
        phone,
        whatsapp: whatsapp || null,
        ...(uploadedPhoto && { photo: uploadedPhoto }),
        status: status || "AVAILABLE",
      },
    });
    return result;
  }

  const result = await prisma.guard.create({
    data: {
      hotelId,
      name,
      phone,
      whatsapp: whatsapp || null,
      photo: uploadedPhoto || null,
      status: status || "AVAILABLE",
    },
  });

  return result;
};

// get all hotels with search filtering and pagination
const getAllHotels = async (
  params: IHotelFilterRequest,
  options: IPaginationOptions,
) => {
  const { limit, page, skip } = paginationHelpers.calculatedPagination(options);

  const { searchTerm, ...filterData } = params;

  const filters: Prisma.HotelWhereInput[] = [];

  // text search
  if (searchTerm) {
    filters.push({
      OR: searchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  // Exact search filter
  if (Object.keys(filterData).length > 0) {
    filters.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: {
          equals: (filterData as any)[key],
        },
      })),
    });
  }

  const where: Prisma.HotelWhereInput = {
    AND: filters,
  };

  const hotels = await prisma.hotel.findMany({
    where,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { createdAt: "desc" },
    include: {
      customPrices: true,
      inventoryItems: true,
      guards: true,
      hotel_bookings: {
        where: {
          bookingStatus: "CONFIRMED",
        },
        select: {
          bookedFromDate: true,
          bookedToDate: true,
        },
      },
      user: {
        select: {
          id: true,
          fullName: true,
          profileImage: true,
        },
      },
      review: {
        take: 1,
        orderBy: {
          createdAt: "desc",
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
      },
    },
  });

  const total = await prisma.hotel.count({ where });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: hotels.map((hotel) => ({
      ...hotel,
      starCount: Number(hotel.hotelRating) || 0,
      ratingString: getRatingString(hotel.hotelRating),
    })),
  };
};

// get all my hotels for partners
const getAllHotelsForPartner = async (
  partnerId: string,
  params: IHotelFilterRequest,
  options: IPaginationOptions,
) => {
  const { limit, page, skip } = paginationHelpers.calculatedPagination(options);
  const { searchTerm, ...filterData } = params;

  const filters: Prisma.HotelWhereInput[] = [];

  // Partner filter
  filters.push({ partnerId });

  // Text search
  if (searchTerm) {
    filters.push({
      OR: searchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  // Exact match filters
  if (Object.keys(filterData).length > 0) {
    filters.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: {
          equals: (filterData as any)[key],
        },
      })),
    });
  }

  const where: Prisma.HotelWhereInput = { AND: filters };

  const hotels = await prisma.hotel.findMany({
    where,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { createdAt: "desc" },
    include: {
      customPrices: true,
      inventoryItems: true,
      guards: true,
      hotel_bookings: {
        where: {
          bookingStatus: "CONFIRMED",
        },
        select: {
          bookedFromDate: true,
          bookedToDate: true,
        },
      },
      user: {
        select: {
          id: true,
          fullName: true,
          profileImage: true,
        },
      },
      review: {
        take: 1,
        orderBy: {
          createdAt: "desc",
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
      },
    },
  });

  const total = await prisma.hotel.count({ where });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: hotels ? hotels.map((hotel) => ({
      ...hotel,
      starCount: Number(hotel.hotelRating) || 0,
      ratingString: getRatingString(hotel.hotelRating),
    })) : [],
  };
};

// get select my property
const getSelectMyProperties = async (partnerId: string) => {
  // find partner
  const partnerExists = await prisma.user.findUnique({
    where: { id: partnerId },
  });
  if (!partnerExists) {
    throw new ApiError(httpStatus.NOT_FOUND, "Partner not found");
  }

  const result = await prisma.hotel.findMany({
    where: { partnerId },
    select: {
      id: true,
      propertyTitle: true,
    },
  });

  return result;
};

// get single hotel
const getSingleHotel = async (hotelId: string) => {
  if (!/^[0-9a-fA-F]{24}$/.test(hotelId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid Hotel ID format");
  }
  const result = await prisma.hotel.findUnique({
    where: { id: hotelId },
    include: {
      customPrices: true,
      inventoryItems: true,
      guards: true,
      user: {
        select: {
          id: true,
          fullName: true,
          profileImage: true,
        },
      },
      review: {
        take: 1,
        orderBy: {
          createdAt: "desc",
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
      },
    },
  });

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Hotel not found");
  }

  return {
    ...result,
    starCount: Number(result.hotelRating) || 0,
    ratingString: getRatingString(result.hotelRating),
  };
};

// add favorite hotel
const toggleFavorite = async (userId: string, hotelId: string) => {
  // Validate MongoDB ObjectIDs to avoid database driver crashes
  if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid User ID format");
  }
  if (!/^[0-9a-fA-F]{24}$/.test(hotelId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid Hotel ID format");
  }

  // check if user exists
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  // check if hotel exists
  const hotel = await prisma.hotel.findUnique({
    where: {
      id: hotelId,
    },
  });
  if (!hotel) {
    throw new ApiError(httpStatus.NOT_FOUND, "Hotel not found");
  }

  const existing = await prisma.favorite.findUnique({
    where: {
      userId_hotelId: {
        userId: user.id,
        hotelId: hotel.id,
      },
    },
  });

  if (existing) {
    await prisma.favorite.delete({
      where: {
        userId_hotelId: {
          userId,
          hotelId,
        },
      },
    });

    // update unfavorite
    await prisma.hotel.update({
      where: {
        id: hotel.id,
      },
      data: {
        isFavorite: false,
      },
    });

    return { isFavorite: false };
  } else {
    await prisma.favorite.create({
      data: {
        userId,
        hotelId,
      },
    });

    // update isFavorite
    await prisma.hotel.update({
      where: {
        id: hotel.id,
      },
      data: {
        isFavorite: true,
      },
    });
    return { isFavorite: true };
  }
};

// gets all favorite hotels
const getAllFavoriteHotels = async (
  userId: string,
  options: IPaginationOptions,
) => {
  const { limit, page, skip } = paginationHelpers.calculatedPagination(options);

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const where = {
    userId: user.id,
    hotelId: { not: null },
  };

  const favorites = await prisma.favorite.findMany({
    where,
    skip,
    take: limit,
    include: {
      hotel: {
        include: {
          customPrices: true,
          inventoryItems: true,
          guards: true,
          user: {
            select: {
              id: true,
              fullName: true,
              profileImage: true,
            },
          },
          review: {
            take: 1,
            orderBy: {
              createdAt: "desc",
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
          },
        },
      },
    },
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { createdAt: "desc" },
  });

  const total = await prisma.favorite.count({ where });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: favorites.map((fav) => ({
      ...fav,
      hotel: fav.hotel ? {
        ...fav.hotel,
        starCount: Number(fav.hotel.hotelRating) || 0,
        ratingString: getRatingString(fav.hotel.hotelRating),
      } : null,
    })),
  };
};

// update hotel
const updateHotel = async (req: Request) => {
  const hotelId = req.params.hotelId;
  const partnerId = req.user?.id;

  if (!/^[0-9a-fA-F]{24}$/.test(hotelId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid Hotel ID format");
  }
  if (partnerId && !/^[0-9a-fA-F]{24}$/.test(partnerId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid Partner ID format");
  }

  // check if partner exists
  const partnerExists = await prisma.user.findUnique({
    where: { id: partnerId },
  });
  if (!partnerExists) {
    throw new ApiError(httpStatus.NOT_FOUND, "Partner not found");
  }

  // check if hotel exists and belongs to this partner
  const hotelExists = await prisma.hotel.findFirst({
    where: { id: hotelId, partnerId },
  });
  if (!hotelExists) {
    throw new ApiError(httpStatus.NOT_FOUND, "Hotel not found or unauthorized");
  }

  const files = req.files as {
    [fieldname: string]: Express.Multer.File[];
  };

  const hotelRule = files?.houseRules?.[0];
  const hotelImagesOrV = files?.uploadPhotosOrVideos || [];

  // upload house rules
  let uploadedHouseRules: string | undefined;
  if (hotelRule) {
    const uploaded = await uploadFile.uploadToCloudinary(hotelRule);
    if (!uploaded?.secure_url) {
      throw new Error("Cloudinary upload failed");
    }
    uploadedHouseRules = uploaded.secure_url;
  }

  // upload photos & videos (multiple files)
  const uploadedMedia: string[] = [];

  const uploads = await Promise.all(
    hotelImagesOrV.map((file) => uploadFile.uploadToCloudinary(file)),
  );

  uploads.forEach((u) => {
    if (!u?.secure_url) {
      throw new Error("Cloudinary upload failed");
    }
    uploadedMedia.push(u.secure_url);
  });

  // upload subcategory images
  const subcategoryImages = files?.subcategoryImage || [];
  const uploadedSubcategoryImages: string[] = [];
  if (subcategoryImages.length > 0) {
    const subUploads = await Promise.all(
      subcategoryImages.map((file) => uploadFile.uploadToCloudinary(file)),
    );
    subUploads.forEach((u) => {
      if (!u?.secure_url) {
        throw new Error("Cloudinary subcategory upload failed");
      }
      uploadedSubcategoryImages.push(u.secure_url);
    });
  }

  const {
    // propertyName,
    propertyTitle,
    propertyAddress,
    propertyDescription,
    latitude,
    longitude,
    maxGuests,
    bedrooms,
    bathrooms,
    smartLockCode,
    keyBoxPin,
    wifiPassword,
    amenities,
    addSecurityKeys,
    addLocalTips,
    basePrice,
    weeklyOffers,
    monthlyOffers,
    customPrices, // [{startDate, endDate, price}]
    inventoryItems, // [{name, quantity}]
    syncWithAirbnb,
    airbnbIcalUrl,
  } = req.body;

  // Update hotel
  const updatedHotel = await prisma.hotel.update({
    where: { id: hotelId },
    data: {
      // propertyName,
      uploadPhotosOrVideos: uploadedMedia || hotelExists.uploadPhotosOrVideos,
      propertyTitle,
      propertyAddress,
      propertyDescription,
      latitude: latitude ? parseFloat(latitude) : (null as any),
      longitude: longitude ? parseFloat(longitude) : (null as any),
      maxGuests: maxGuests ? parseInt(maxGuests) : undefined,
      bedrooms: bedrooms ? parseInt(bedrooms) : undefined,
      bathrooms: bathrooms ? parseInt(bathrooms) : undefined,
      smartLockCode,
      keyBoxPin,
      wifiPassword,
      amenities: amenities ? JSON.parse(amenities) : undefined,
      houseRules: uploadedHouseRules || hotelExists.houseRules,
      addSecurityKeys,
      addLocalTips: (() => {
        const tips = typeof addLocalTips === "string" ? JSON.parse(addLocalTips) : addLocalTips;
        if (!tips) return undefined;
        let imageIndex = 0;
        return tips.map((tip: any) => {
          // parse isActive if it's a string
          if (typeof tip.isActive === "string") {
            tip.isActive = tip.isActive === "true";
          }

          if ((!tip.subcategoryImage || tip.subcategoryImage === "new_file") && uploadedSubcategoryImages[imageIndex]) {
            tip.subcategoryImage = uploadedSubcategoryImages[imageIndex++];
          }
          return tip;
        });
      })(),
      basePrice: basePrice ? parseFloat(basePrice) : undefined,
      weeklyOffers: weeklyOffers ? parseFloat(weeklyOffers) : undefined,
      monthlyOffers: monthlyOffers ? parseFloat(monthlyOffers) : undefined,

      // Handle custom prices - delete existing and create new ones
      customPrices: customPrices
        ? {
          deleteMany: {},
          create: (typeof customPrices === "string" ? JSON.parse(customPrices) : customPrices).map((p: any) => ({
            startDate: new Date(p.startDate),
            endDate: new Date(p.endDate),
            price: parseFloat(p.price),
          })),
        }
        : undefined,

      // Handle inventory items - delete existing and create new ones
      inventoryItems: inventoryItems
        ? {
          deleteMany: {},
          create: (typeof inventoryItems === "string" ? JSON.parse(inventoryItems) : inventoryItems).map((item: any) => ({
            name: item.name,
            quantity: item.quantity,
          })),
        }
        : undefined,

      syncWithAirbnb:
        syncWithAirbnb !== undefined
          ? String(syncWithAirbnb) === "true"
          : airbnbIcalUrl
            ? true
            : undefined,
      airbnbIcalUrl: airbnbIcalUrl !== undefined ? airbnbIcalUrl : undefined,
    },
    include: {
      customPrices: true,
      inventoryItems: true,
    },
  });

  return updatedHotel;
};

// update hotel category
const updateHotelCategory = async (req: Request) => {
  const hotelId = req.params.hotelId;
  const partnerId = req.user?.id;

  // check if hotel exists and belongs to this partner
  const hotelExists = await prisma.hotel.findFirst({
    where: { id: hotelId, partnerId },
  });
  if (!hotelExists) {
    throw new ApiError(httpStatus.NOT_FOUND, "Hotel not found or unauthorized");
  }

  const files = req.files as {
    [fieldname: string]: Express.Multer.File[];
  };

  // upload subcategory images
  const subcategoryImages = files?.subcategoryImage || [];
  const uploadedSubcategoryImages: string[] = [];
  if (subcategoryImages.length > 0) {
    const subUploads = await Promise.all(
      subcategoryImages.map((file) => uploadFile.uploadToCloudinary(file)),
    );
    subUploads.forEach((u) => {
      if (!u?.secure_url) {
        throw new Error("Cloudinary subcategory upload failed");
      }
      uploadedSubcategoryImages.push(u.secure_url);
    });
  }

  const { addLocalTips } = req.body;

  const result = await prisma.hotel.update({
    where: { id: hotelId },
    data: {
      addLocalTips: (() => {
        const tips = typeof addLocalTips === "string" ? JSON.parse(addLocalTips) : addLocalTips;
        if (!tips) return undefined;
        let imageIndex = 0;
        return tips.map((tip: any) => {
          // parse isActive if it's a string
          if (typeof tip.isActive === "string") {
            tip.isActive = tip.isActive === "true";
          }

          if ((!tip.subcategoryImage || tip.subcategoryImage === "new_file") && uploadedSubcategoryImages[imageIndex]) {
            tip.subcategoryImage = uploadedSubcategoryImages[imageIndex++];
          }
          return tip;
        });
      })(),
    },
  });

  return result;
};

// delete hotel
const deleteHotel = async (hotelId: string, partnerId: string) => {
  if (!/^[0-9a-fA-F]{24}$/.test(hotelId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid Hotel ID format");
  }
  if (!/^[0-9a-fA-F]{24}$/.test(partnerId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid Partner ID format");
  }
  // find hotel
  const hotelExists = await prisma.hotel.findUnique({
    where: { id: hotelId },
  });
  if (!hotelExists) {
    throw new ApiError(httpStatus.NOT_FOUND, "Hotel not found");
  }

  // find partner
  const partnerExists = await prisma.user.findUnique({
    where: { id: partnerId },
  });
  if (!partnerExists) {
    throw new ApiError(httpStatus.NOT_FOUND, "Partner not found");
  }

  // delete related custom prices to satisfy relation constraints
  await prisma.customPrice.deleteMany({ where: { hotelId } });

  // finally delete the hotel
  return await prisma.hotel.delete({
    where: { id: hotelId, partnerId },
  });
};

export const HotelService = {
  createHotel,
  getAllHotels,
  getAllHotelsForPartner,
  getSelectMyProperties,
  getSingleHotel,
  toggleFavorite,
  getAllFavoriteHotels,
  updateHotel,
  deleteHotel,
  updateHotelCategory,
  createGuard,
};
