import express from "express";
import { ReviewController } from "./review.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();

// create hotel review
router.post(
  "/hotel",
  auth(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.USER,
    UserRole.PROPERTY_OWNER
  ),
  ReviewController.createHotelReview
);

// create service review
router.post(
  "/service",
  auth(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.USER,
    UserRole.PROPERTY_OWNER
  ),
  ReviewController.createServiceReview
);

// create property owner review (by service provider)
router.post(
  "/property-owner-by-service-provider",
  auth(UserRole.SERVICE_PROVIDER),
  ReviewController.createPropertyOwnerReview
);

// submit review via token (no auth required)
router.post(
  "/submit-via-token",
  ReviewController.submitReviewViaToken
);

export const reviewRoute = router;
