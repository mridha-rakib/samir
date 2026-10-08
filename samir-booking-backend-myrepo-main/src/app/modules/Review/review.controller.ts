import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { ReviewService } from "./review.service";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import { jwtHelpers } from "../../../helpars/jwtHelpers";
import config from "../../../config";
import ApiError from "../../../errors/ApiErrors";

// create hotel review
const createHotelReview = catchAsync(async (req: Request, res: Response) => {
  console.log("DEBUG: Request Body (Hotel Review):", req.body);
  const userId = req.user?.id;
  const { hotelId, rating, comment, bookingId } = req.body;

  const result = await ReviewService.createHotelReview(
    userId,
    hotelId,
    rating,
    comment,
    bookingId
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Review created successfully",
    data: result,
  });
});

// create service review
const createServiceReview = catchAsync(async (req: Request, res: Response) => {
  console.log("DEBUG: Request Body (Service Review):", req.body);
  const userId = req.user?.id;
  const { serviceId, rating, comment, bookingId } = req.body;

  const result = await ReviewService.createServiceReview(
    userId,
    serviceId,
    rating,
    comment,
    bookingId
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Review created successfully",
    data: result,
  });
});

// create property owner review (by service provider)
const createPropertyOwnerReview = catchAsync(async (req: Request, res: Response) => {
  console.log("DEBUG: Request Body (Owner Review):", req.body);
  const userId = req.user?.id;
  const { reviewedUserId, propertyOwnerId, rating, comment, bookingId } = req.body;
  const targetId = reviewedUserId || propertyOwnerId;

  console.log("DEBUG: Logged-in User ID (Reviewer):", userId);
  console.log("DEBUG: Target User ID (Reviewed):", targetId);

  const result = await ReviewService.createPropertyOwnerReview(
    userId,
    targetId,
    rating,
    comment,
    bookingId
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Review created successfully",
    data: result,
  });
});

// submit review via token (no login required)
const submitReviewViaToken = catchAsync(async (req: Request, res: Response) => {
  const { token, rating, comment } = req.body;

  if (!token) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Review token is missing");
  }

  let decodedToken;
  try {
    decodedToken = jwtHelpers.verifyToken(token, config.jwt.jwt_secret as string);
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid or expired review token");
  }

  const { userId, bookingId, hotelId } = decodedToken as any;

  if (!userId || !hotelId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid token payload");
  }

  const result = await ReviewService.createHotelReview(
    userId,
    hotelId,
    rating,
    comment,
    bookingId
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Review submitted successfully",
    data: result,
  });
});

export const ReviewController = {
  createHotelReview,
  createServiceReview,
  createPropertyOwnerReview,
  submitReviewViaToken,
};
