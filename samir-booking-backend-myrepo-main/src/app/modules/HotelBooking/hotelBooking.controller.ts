import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { HotelBookingService } from "./hotelBooking.service";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import { pick } from "../../../shared/pick";
import { paginationFields } from "../../../constants/pagination";

// create hotel booking
const createHotelRoomBooking = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const hotelId = req.params.hotelId;
    // const passportFiles = req.files as Express.Multer.File[];

    console.log("Hotel ID from params:", hotelId);
    console.log("Booking Data from body:", req.body);

    const result = await HotelBookingService.createHotelRoomBooking(
      userId,
      hotelId,
      req.body,
      // passportFiles
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Hotel Booking created successfully",
      data: result,
    });
  },
);

// get all hotel bookings
const getAllHotelBookings = catchAsync(async (req: Request, res: Response) => {
  const partnerId = req.user?.id;
  const filter = req.query.filter as string;
  const options = pick(req.query, paginationFields);

  const result = await HotelBookingService.getAllHotelBookings(
    partnerId,
    filter,
    options,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Hotel bookings fetched successfully",
    data: result,
  });
});

// get single hotel booking for owner
const getSingleHotelBookingForOwner = catchAsync(
  async (req: Request, res: Response) => {
    const partnerId = req.user?.id;
    const result =
      await HotelBookingService.getSingleHotelBookingForOwner(partnerId);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Hotel bookings fetched successfully",
      data: result,
    });
  },
);

// get all my hotel bookings
const getAllMyHotelBookings = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const options = pick(req.query, paginationFields);
    const result = await HotelBookingService.getAllMyHotelBookings(userId, options);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "My hotel bookings fetched successfully",
      meta: result.meta,
      data: result.data,
    });
  },
);

// get my guest bookings list (Simplified UI format)
const getGuestBookings = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const status = req.query.status as string; // UPCOMING, COMPLETED, CANCELLED
  const options = pick(req.query, paginationFields);
  const result = await HotelBookingService.getGuestBookings(userId, status, options);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Bookings fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

// get my guest booking details by ID (Simplified UI format)
const getGuestBookingDetails = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const bookingId = req.params.bookingId;
  const result = await HotelBookingService.getGuestBookingDetails(userId, bookingId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Booking details fetched successfully",
    data: result,
  });
});

// get single my hotel booking
const getSingleMyHotelBookingForUser = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const result =
      await HotelBookingService.getSingleMyHotelBookingForUser(userId);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "My hotel bookings fetched successfully",
      data: result,
    });
  },
);

// get single my hotel booking
const getSingleBookingDetailForUserHotelByBookingId = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const bookingId = req.params.bookingId;
    
    const result =
      await HotelBookingService.getSingleBookingDetailForUserHotelByBookingId(
        userId,
        bookingId,
      );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "My hotel bookings fetched successfully",
      data: result,
    });
  },
);

// get hotel booking by id
const getHotelBookingById = catchAsync(async (req: Request, res: Response) => {
  const partnerId = req.user?.id;
  const bookingId = req.params.bookingId;
  const result = await HotelBookingService.getHotelBookingById(
    partnerId,
    bookingId,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Hotel booking fetched successfully",
    data: result,
  });
});

// create travelers with passport images
const createTravelers = catchAsync(async (req: Request, res: Response) => {
  const bookingId = req.params.bookingId;
  const travelersData = req.body.travelers || [];
  const passportFiles = req.files as Express.Multer.File[];

  const result = await HotelBookingService.createTravelers(
    bookingId,
    travelersData,
    passportFiles,
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Travelers created successfully",
    data: result,
  });
});

// check if user has confirmed booking access for a hotel
const checkAccessForHotel = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const hotelId = req.params.hotelId;
  const result = await HotelBookingService.checkAccessForHotel(userId, hotelId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Access check complete",
    data: result,
  });
});

export const HotelBookingController = {
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
