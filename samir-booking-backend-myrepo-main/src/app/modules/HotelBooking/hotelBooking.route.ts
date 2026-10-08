import express from "express";
import { HotelBookingController } from "./hotelBooking.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { uploadFile } from "../../../helpars/fileUploader";
import { parseBodyData } from "../../middlewares/parseNestedJson";

const router = express.Router();

// get all hotel bookings
router.get(
  "/",
  auth(UserRole.PROPERTY_OWNER),
  HotelBookingController.getAllHotelBookings,
);

// get single hotel booking for owner
router.get(
  "/owner/single",
  auth(UserRole.PROPERTY_OWNER),
  HotelBookingController.getSingleHotelBookingForOwner,
);

// get all my hotel bookings
router.get(
  "/my-bookings",
  auth(UserRole.USER),
  HotelBookingController.getAllMyHotelBookings,
);

// get all my guest bookings (Simplified UI format)
router.get(
  "/guest/bookings",
  auth(UserRole.USER),
  HotelBookingController.getGuestBookings,
);

// get my guest booking details by booking ID (Simplified UI format)
router.get(
  "/guest/bookings/:bookingId",
  auth(UserRole.USER),
  HotelBookingController.getGuestBookingDetails,
);

// get single my hotel booking
router.get(
  "/my-bookings/user/single",
  auth(UserRole.USER),
  HotelBookingController.getSingleMyHotelBookingForUser,
);

// get single booking details for user hotel by the bookingId
router.get(
  "/my-bookings/user/single/:bookingId",
  auth(UserRole.USER),
  HotelBookingController.getSingleBookingDetailForUserHotelByBookingId,
);

// check if authenticated user has a confirmed booking for this hotel
router.get(
  "/check-access/:hotelId",
  auth(UserRole.USER, UserRole.PROPERTY_OWNER, UserRole.SERVICE_PROVIDER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  HotelBookingController.checkAccessForHotel,
);

// get hotel booking by id
router.get(
  "/:bookingId",
  auth(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.PROPERTY_OWNER,
    UserRole.USER,
  ),
  HotelBookingController.getHotelBookingById,
);

// create hotel booking
router.post(
  "/:hotelId",
  auth(UserRole.USER, UserRole.PROPERTY_OWNER, UserRole.SERVICE_PROVIDER),
  HotelBookingController.createHotelRoomBooking,
);

// create travelers with passport images
router.post(
  "/travelers/:bookingId",
  auth(
    UserRole.USER,
    UserRole.PROPERTY_OWNER,
    UserRole.SERVICE_PROVIDER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  ),
  uploadFile.passportImages,
  parseBodyData,
  HotelBookingController.createTravelers,
);

export const hotelBookingRoute = router;
