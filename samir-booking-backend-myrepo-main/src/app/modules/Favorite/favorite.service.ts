import { Favorite, BookingStatus, UserRole } from "@prisma/client";
import prisma from "../../../shared/prisma";
import { IPaginationOptions } from "../../../interfaces/paginations";
import { paginationHelpers } from "../../../helpars/paginationHelper";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";

const toggleFavorite = async (
  userId: string,
  savedUserId: string
): Promise<{ isSaved: boolean; savedAt?: Date }> => {
  if (userId === savedUserId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "You cannot save yourself");
  }

  const existingFavorite = await prisma.favorite.findUnique({
    where: {
      userId_savedUserId: {
        userId,
        savedUserId,
      },
    },
  });

  if (existingFavorite) {
    await prisma.favorite.delete({
      where: {
        id: existingFavorite.id,
      },
    });
    return { isSaved: false };
  } else {
    const result = await prisma.favorite.create({
      data: {
        userId,
        savedUserId,
      },
    });
    return { isSaved: true, savedAt: result.createdAt };
  }
};

const getMySavedUsers = async (
  userId: string,
  options: IPaginationOptions
) => {
  const { limit, page, skip } = paginationHelpers.calculatedPagination(options);

  const result = await prisma.favorite.findMany({
    where: {
      userId,
      savedUserId: { not: null },
    },
    include: {
      savedUser: {
        select: {
          id: true,
          fullName: true,
          profileImage: true,
          role: true,
          address: true,
          email: true,
          contactNumber: true,
          services: {
            select: {
              serviceName: true,
            },
          },
          review: {
            select: {
              rating: true,
            },
          },
          hotel: {
            select: {
              id: true,
            },
          },
          serviceBookings: {
            where: {
              providerId: userId,
            },
            select: {
              id: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      },
    },
    skip,
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
  });

  const total = await prisma.favorite.count({
    where: {
      userId,
      savedUserId: { not: null },
    },
  });

  // Transform data to match response format
  const formattedData = result.map((fav) => {
    const savedUser = fav.savedUser;
    if (!savedUser) return null;

    let averageServiceRating = 0;
    let totalReviews = 0;
    if (savedUser.role === UserRole.SERVICE_PROVIDER) {
      totalReviews = savedUser.review.length;
      if (totalReviews > 0) {
        averageServiceRating =
          savedUser.review.reduce((acc, curr) => acc + curr.rating, 0) /
          totalReviews;
      }
    }

    return {
      _id: fav.id,
      savedUser: {
        _id: savedUser.id,
        fullName: savedUser.fullName,
        profileImage: savedUser.profileImage,
        role: savedUser.role,
        address: savedUser.address,
        email: savedUser.email,
        contactNumber: savedUser.contactNumber,
        averageServiceRating: Number(averageServiceRating.toFixed(1)),
        totalReviews,
        services: savedUser.services.map((s) => s.serviceName),
        totalProperties: savedUser.hotel.length,
        totalJobsWithProvider: savedUser.serviceBookings.length,
        lastJobDate: savedUser.serviceBookings[0]?.createdAt || null,
      },
      createdAt: fav.createdAt,
    };
  }).filter(item => item !== null);

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: formattedData,
  };
};

const getMyClients = async (
  providerId: string,
  options: IPaginationOptions
) => {
  const { limit, page, skip } = paginationHelpers.calculatedPagination(options);

  // Get distinct property owners who have booked this provider
  // Status: COMPLETED, CONFIRMED (ACCEPTED), IN_WORKING (ONGOING)
  const bookings = await prisma.service_booking.findMany({
    where: {
      providerId,
      bookingStatus: {
        in: [
          BookingStatus.COMPLETED,
          BookingStatus.CONFIRMED,
          BookingStatus.IN_WORKING,
        ],
      },
    },
    select: {
      userId: true,
    },
  });

  const distinctUserIds = Array.from(
    new Set(bookings.map((b) => b.userId).filter((id): id is string => id !== null))
  );

  const total = distinctUserIds.length;
  const paginatedUserIds = distinctUserIds.slice(skip, skip + limit);

  const clients = await Promise.all(
    paginatedUserIds.map(async (userId) => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          hotel: { select: { id: true } },
          serviceBookings: {
            where: {
                providerId,
                bookingStatus: {
                    in: [
                      BookingStatus.COMPLETED,
                      BookingStatus.CONFIRMED,
                      BookingStatus.IN_WORKING,
                    ],
                  },
            },
            orderBy: { createdAt: "desc" },
            select: { id: true, createdAt: true },
          },
          favoritesMe: {
            where: { userId: providerId },
          },
        },
      });

      if (!user) return null;

      return {
        _id: user.id,
        fullName: user.fullName,
        profileImage: user.profileImage,
        email: user.email,
        address: user.address,
        contactNumber: user.contactNumber,
        averageRating: Number(user.userRating) || 0,
        totalReview: user.userReviewCount,
        totalProperties: user.hotel.length,
        totalJobsWithProvider: user.serviceBookings.length,
        lastJobDate: user.serviceBookings[0]?.createdAt || null,
        lastBookingId: user.serviceBookings[0]?.id || null,
        isSaved: user.favoritesMe.length > 0,
      };
    })
  );

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: clients.filter((c) => c !== null),
  };
};

export const FavoriteService = {
  toggleFavorite,
  getMySavedUsers,
  getMyClients,
};
