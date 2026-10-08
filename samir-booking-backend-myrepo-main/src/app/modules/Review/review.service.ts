import { Review } from "@prisma/client";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import { NotificationService } from "../Notification/notification.service";
import { isValidObjectId } from "../../../utils/validateObjectId";
import axios from "axios";

const extractAirbnbListingId = (icalUrl: string): string | null => {
  try {
    const match = icalUrl.match(/\/ical\/(\d+)\.ics/);
    return match ? match[1] : null;
  } catch (err) {
    return null;
  }
};

// create hotel review
const createHotelReview = async (
  userId: string,
  hotelId: string,
  rating: number,
  comment?: string,
  bookingId?: string,
) => {
  // rating validation (1 - 5 only)
  if (rating < 1 || rating > 5) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Rating must be between 1 and 5",
    );
  }

  if (!isValidObjectId(hotelId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid Hotel ID provided");
  }

  // check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  // check if hotel exists
  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
    select: {
      id: true,
      partnerId: true,
      propertyTitle: true,
      hotelRating: true,
      hotelReviewCount: true,
      airbnbIcalUrl: true,
    },
  });
  if (!hotel) {
    throw new ApiError(httpStatus.NOT_FOUND, "Hotel not found");
  }

  // Prevent self-reviewing for hotel
  if (hotel.partnerId === userId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You cannot review your own hotel",
    );
  }

  // Check if review already exists for this booking (or general review if no bookingId)
  const existingHotelReview = await prisma.review.findFirst({
    where: {
      userId,
      hotelId,
      bookingId: bookingId || null,
    },
  });

  const syncedToAirbnb = rating > 3;
  if (syncedToAirbnb && !existingHotelReview) {
    console.log(`[Airbnb Sync] Syncing review with rating ${rating} (> 3 stars) to Airbnb for hotel ${hotelId}`);

    // Extract listing ID from airbnbIcalUrl if available
    const airbnbListingId = hotel.airbnbIcalUrl ? extractAirbnbListingId(hotel.airbnbIcalUrl) : null;

    if (airbnbListingId) {
      // Load custom partner token from database, or fall back to system token
      let ownerToken = process.env.AIRBNB_ACCESS_TOKEN || "mock-airbnb-token-value";
      if (hotel.partnerId) {
        const partner = await prisma.user.findUnique({
          where: { id: hotel.partnerId },
          select: { airbnbAccessToken: true },
        });
        if (partner?.airbnbAccessToken) {
          ownerToken = partner.airbnbAccessToken;
          console.log(`[Airbnb Sync] Using custom OAuth access token for partner ${hotel.partnerId}`);
        } else {
          console.log(`[Airbnb Sync] No custom OAuth token found for partner ${hotel.partnerId}. Falling back to default system token.`);
        }
      }

      try {
        await axios.post(
          "https://api.airbnb.com/v2/reviews",
          {
            listing_id: airbnbListingId,
            rating,
            comments: comment,
            reviewer_id: userId,
          },
          {
            headers: {
              Authorization: `Bearer ${ownerToken}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log(`[Airbnb Sync] Review successfully synced to Airbnb for listing ${airbnbListingId}`);
      } catch (err: any) {
        console.error(`[Airbnb Sync] Failed to sync review to Airbnb for listing ${airbnbListingId}:`, err.message);
      }
    } else {
      console.warn(`[Airbnb Sync] No valid Airbnb Listing ID could be extracted from iCal URL: ${hotel.airbnbIcalUrl}`);
    }
  }

  let review;
  const selectFields = {
    id: true,
    userId: true,
    hotelId: true,
    rating: true,
    comment: true,
    syncedToAirbnb: true,
    createdAt: true,
    updatedAt: true,
  };

  if (existingHotelReview) {
    review = await prisma.review.update({
      where: { id: existingHotelReview.id },
      data: { rating, comment, syncedToAirbnb },
      select: selectFields,
    });
  } else {
    review = await prisma.review.create({
      data: {
        userId: user.id,
        hotelId: hotel?.id,
        rating,
        comment,
        bookingId: bookingId || null,
        syncedToAirbnb,
      },
      select: selectFields,
    });
  }

  const ratings = await prisma.review.findMany({
    where: {
      hotelId: hotel?.id,
    },
    select: {
      rating: true,
    },
  });

  // average rating calculation
  const averageRating =
    ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

  await prisma.hotel.update({
    where: { id: hotel?.id },
    data: {
      hotelRating: averageRating.toFixed(1),
      hotelReviewCount: ratings.length,
    },
  });

  // Check for mutual review (Did the SP already review this PO?)
  const mutualReview = await prisma.review.findFirst({
    where: {
      userId: hotel.partnerId!, // SP
      reviewedUserId: userId,    // PO
      bookingId: bookingId,
    },
  });

  // Send Notification
  if (hotel.partnerId) {
    const notificationType = mutualReview ? "REVIEW_COMPLETED" : "REVIEW_ACTION";

    console.log(`[Hotel Review] From: ${userId}, To: ${hotel.partnerId}, Booking: ${bookingId}, Type: ${notificationType}`);

    await NotificationService.createNotification({
      receiverId: hotel.partnerId,
      partnerId: userId,
      bookingId: bookingId,
      title: "New Review Received",
      body: `You received a ${rating}-star review for your hotel "${hotel.propertyTitle}".`,
      type: notificationType,
    });
  }

  return review;
};

// create service review
const createServiceReview = async (
  userId: string,
  serviceId: string,
  rating: number,
  comment?: string,
  bookingId?: string,
) => {
  // rating validation (1 - 5 only)
  if (rating < 1 || rating > 5) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Rating must be between 1 and 5",
    );
  }

  if (!isValidObjectId(serviceId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid Service ID provided");
  }

  // check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  // check if service exists
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: {
      id: true,
      providerId: true,
      serviceName: true,
      serviceRating: true,
      serviceReviewCount: true,
    },
  });
  if (!service) {
    throw new ApiError(httpStatus.NOT_FOUND, "Service not found");
  }

  // Prevent self-reviewing for service
  if (service.providerId === userId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You cannot review your own service",
    );
  }

  // Check if review already exists for this booking (or general review if no bookingId)
  const existingServiceReview = await prisma.review.findFirst({
    where: {
      userId,
      serviceId,
      bookingId: bookingId || null,
    },
  });

  let review;
  const selectFields = {
    id: true,
    userId: true,
    serviceId: true,
    rating: true,
    comment: true,
    createdAt: true,
    updatedAt: true,
  };

  if (existingServiceReview) {
    review = await prisma.review.update({
      where: { id: existingServiceReview.id },
      data: { rating, comment },
      select: selectFields,
    });
  } else {
    review = await prisma.review.create({
      data: {
        userId: user.id,
        serviceId: service?.id,
        rating,
        comment,
        bookingId: bookingId || null,
      },
      select: selectFields,
    });
  }

  const ratings = await prisma.review.findMany({
    where: {
      serviceId: service?.id,
    },
    select: {
      rating: true,
    },
  });

  // average rating calculation
  const averageRating =
    ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

  await prisma.service.update({
    where: { id: service?.id },
    data: {
      serviceRating: averageRating.toFixed(1),
      serviceReviewCount: ratings.length,
    },
  });

  // Check for mutual review (Did the SP already review this PO?)
  const mutualReview = await prisma.review.findFirst({
    where: {
      userId: service.providerId!, // SP
      reviewedUserId: userId,      // PO
      bookingId: bookingId,
    },
  });

  // Send Notification
  if (service.providerId) {
    const notificationType = mutualReview ? "REVIEW_COMPLETED" : "REVIEW_ACTION";

    console.log(`[Service Review] From: ${userId}, To: ${service.providerId}, Booking: ${bookingId}, Type: ${notificationType}`);

    await NotificationService.createNotification({
      receiverId: service.providerId,
      partnerId: userId,
      bookingId: bookingId,
      serviceId: service.id,
      title: "New Review Received",
      body: `You received a ${rating}-star review for your service "${service.serviceName}".`,
      type: notificationType,
    });
  }

  return review;
};

// create property owner review (by service provider)
const createPropertyOwnerReview = async (
  userId: string, // reviewer (e.g. service provider)
  reviewedUserId: string, // target (e.g. property owner)
  rating: number,
  comment?: string,
  bookingId?: string,
) => {
  // rating validation (1 - 5 only)
  if (rating < 1 || rating > 5) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Rating must be between 1 and 5",
    );
  }

  // check if reviewer exists
  const reviewer = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!reviewer) {
    throw new ApiError(httpStatus.NOT_FOUND, "Reviewer not found");
  }

  // check if target user exists
  const targetUser = await prisma.user.findUnique({
    where: { id: reviewedUserId },
    select: {
      id: true,
      userRating: true,
      userReviewCount: true,
    },
  });
  if (!targetUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "Target user not found");
  }

  // Prevent self-reviewing
  if (userId === reviewedUserId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "You cannot review yourself");
  }

  // Check if review already exists for this booking (or general review if no bookingId)
  const existingUserReview = await prisma.review.findFirst({
    where: {
      userId,
      reviewedUserId,
      bookingId: bookingId || null,
    },
  });

  let review;
  const selectFields = {
    id: true,
    userId: true,
    reviewedUserId: true,
    rating: true,
    comment: true,
    createdAt: true,
    updatedAt: true,
  };

  if (existingUserReview) {
    review = await prisma.review.update({
      where: { id: existingUserReview.id },
      data: { rating, comment },
      select: selectFields,
    });
  } else {
    review = await prisma.review.create({
      data: {
        userId: reviewer.id,
        reviewedUserId: targetUser.id,
        rating,
        comment,
        bookingId: bookingId || null,
      },
      select: selectFields,
    });
  }

  const ratings = await prisma.review.findMany({
    where: {
      reviewedUserId: targetUser.id,
    },
    select: {
      rating: true,
    },
  });

  // average rating calculation
  const averageRating =
    ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

  await prisma.user.update({
    where: { id: targetUser.id },
    data: {
      userRating: averageRating.toFixed(1),
      userReviewCount: ratings.length,
    },
  });

  const mutualReview = await prisma.review.findFirst({
    where: {
      userId: reviewedUserId, // PO
      bookingId: bookingId,
      OR: [
        {
          service: {
            providerId: userId, // SP
          },
        },
        {
          hotel: {
            partnerId: userId, // SP
          },
        },
      ],
    },
  });

  const notificationType = mutualReview ? "REVIEW_COMPLETED" : "REVIEW_ACTION";

  console.log(`[Owner Review] From: ${userId}, To: ${targetUser.id}, Booking: ${bookingId}, Type: ${notificationType}`);

  // Send Notification
  await NotificationService.createNotification({
    receiverId: targetUser.id,
    partnerId: userId,
    bookingId: bookingId,
    title: "New Review Received",
    body: `You received a ${rating}-star review from a service provider.`,
    type: notificationType,
  });

  return review;
};

export const ReviewService = {
  createHotelReview,
  createServiceReview,
  createPropertyOwnerReview,
};
