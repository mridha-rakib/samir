import {
  BookingStatus,
  EveryServiceStatus,
  PaymentStatus,
  ServiceStatus,
  UserStatus,
} from "@prisma/client";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import {
  ICreateServiceBooking,
  IServiceFilterRequest,
} from "./serviceBooking.interface";
import { IPaginationOptions } from "../../../interfaces/paginations";
import { paginationHelpers } from "../../../helpars/paginationHelper";
import stripe from "../../../helpars/stripe";
import { BookingNotificationService } from "../../../shared/notificationService";

// create service booking
const createServiceBooking = async (
  userId: string,
  serviceId: string,
  data: ICreateServiceBooking,
) => {
  // -------------------- FIND USER --------------------
  const findUser = await prisma.user.findUnique({
    where: { id: userId, status: UserStatus.ACTIVE },
  });

  if (!findUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  // -------------------- FIND HOTEL --------------------
  const findHotel = await prisma.hotel.findUnique({
    where: { id: data.hotelId },
  });

  if (!findHotel) {
    throw new ApiError(httpStatus.NOT_FOUND, "Hotel not found");
  }

  // -------------------- FIND SERVICE --------------------
  const findService = await prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      availability: {
        include: {
          slots: true,
        },
      },
    },
  });

  if (!findService) {
    throw new ApiError(httpStatus.NOT_FOUND, "Service not found");
  }

  if (findService.serviceStatus !== ServiceStatus.ACTIVE) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Service is not available for booking",
    );
  }

  // -------------------- DATE VALIDATION --------------------
  const safeDateStr = data.date.includes("T") ? data.date : `${data.date}T12:00:00.000Z`;
  const bookingDate = new Date(safeDateStr);

  if (isNaN(bookingDate.getTime())) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid booking date");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Compare timezone-independent date dates
  const checkBookingDate = new Date(bookingDate);
  checkBookingDate.setUTCHours(0,0,0,0);
  if (checkBookingDate < today) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Cannot book for past dates",
    );
  }

  // 🔥 DO NOT TRUST FRONTEND DAY
  const actualDay = bookingDate.toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "UTC",
  });

  // -------------------- FIND AVAILABILITY --------------------
  const availability = findService.availability.find(
    (avail: any) =>
      avail.day.trim().toLowerCase() === actualDay.toLowerCase(),
  );

  if (!availability) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Service is not available on ${actualDay}`,
    );
  }

  // -------------------- TIME PARSER --------------------
  const parseTime = (time: string): number => {
    const clean = time.replace(/\s+/g, " ").trim().toUpperCase();

    // Accept "HH:MM" 24-hour format as fallback
    const match24 = clean.match(/^(\d{1,2}):(\d{2})$/);
    if (match24) {
      return parseInt(match24[1]) * 60 + parseInt(match24[2]);
    }

    // Accept "H:MM AM/PM"
    const match12 = clean.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/);
    if (!match12) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Invalid time format: "${time}". Use HH:MM or H:MM AM/PM`,
      );
    }

    let hours = parseInt(match12[1]);
    const minutes = parseInt(match12[2]);
    const modifier = match12[3];

    if (modifier === "PM" && hours !== 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;

    return hours * 60 + minutes;
  };

  const requestStart = parseTime(data.timeSlot.from);
  const requestEnd = parseTime(data.timeSlot.to);

  if (requestEnd <= requestStart) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Invalid time range selected",
    );
  }
  

  // -------------------- CHECK SLOT RANGE --------------------
  const isWithinAvailableRange = availability.slots.some((slot: any) => {
    const slotStart = parseTime(slot.from);
    const slotEnd = parseTime(slot.to);

    return requestStart >= slotStart && requestEnd <= slotEnd;
  });

  if (!isWithinAvailableRange) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Requested time slot is outside available range",
    );
  }

  // -------------------- PREVENT OVERLAPPING BOOKINGS --------------------
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const existingBookings = await prisma.service_booking.findMany({
    where: {
      serviceId,
      date: data.date,
      OR: [
        {
          bookingStatus: {
            in: [
              BookingStatus.CONFIRMED,
              BookingStatus.NEED_ACCEPT,
            ],
          },
        },
        {
          bookingStatus: BookingStatus.PENDING_PAYMENT,
          createdAt: {
            gte: fiveMinutesAgo,
          },
        },
      ],
    },
  });

  const isOverlapping = existingBookings.some((booking: any) => {
    const existingStart = parseTime(booking.timeSlot.from);
    const existingEnd = parseTime(booking.timeSlot.to);

    return (
      requestStart < existingEnd &&
      requestEnd > existingStart
    );
  });

  if (isOverlapping) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "This time slot is already booked",
    );
  }

  // -------------------- CREATE BOOKING --------------------
  const result = await prisma.service_booking.create({
    data: {
      userId,
      serviceId,
      providerId: findService.providerId,
      hotelId: findHotel.id,
      property: data.property,
      serviceName: data.serviceName,
      offeredService: data.offeredService,
      newOfferedService: data.newOfferedService || [],
      date: data.date,
      day: actualDay,
      timeSlot: data.timeSlot,
      totalPrice: data.totalPrice,
      specialInstructions: data.specialInstructions,
      bookingStatus: BookingStatus.PENDING_PAYMENT,
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      service: {
        select: {
          id: true,
          serviceName: true,
          serviceType: true,
        },
      },
    },
  });

  // -------------------- SEND NOTIFICATION --------------------
  try {
    const notificationData = {
      bookingId: result.id,
      userId: result.userId || undefined,
      providerId: result.providerId || undefined,
      serviceTypes: "SERVICE" as any,
      serviceName: result.serviceName,
      totalPrice: result.totalPrice,
      serviceId: result.serviceId || undefined,
    };

    await BookingNotificationService.sendBookingNotifications(
      notificationData,
    );
  } catch (notificationError) {
    console.error("Create booking notification failed:", notificationError);
  }

  return result;
};

// provider accept booking
const acceptBooking = async (providerId: string, bookingId: string) => {
  // find the booking
  const booking = await prisma.service_booking.findUnique({
    where: {
      id: bookingId,
    },
  });

  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, "Booking not found");
  }

  if (booking.providerId !== providerId) {
    const assignedProvider = await prisma.user.findUnique({
      where: { id: booking.providerId! },
      select: { fullName: true, email: true },
    });
    throw new ApiError(
      httpStatus.FORBIDDEN,
      `Unauthorized: You are not the provider of this booking. Assigned Provider: ${assignedProvider?.fullName || "Unknown"} (${assignedProvider?.email || "Unknown"})`,
    );
  }

  if (booking.bookingStatus !== BookingStatus.NEED_ACCEPT) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Booking is not in NEED_ACCEPT state. Current status: ${booking.bookingStatus}`,
    );
  }

  // update both booking and service inside a transaction
  const [updatedBooking, updatedService] = await prisma.$transaction([
    prisma.service_booking.update({
      where: { id: bookingId },
      data: { bookingStatus: BookingStatus.CONFIRMED },
    }),
    prisma.service.update({
      where: { id: booking.serviceId! },
      data: { isBooked: EveryServiceStatus.BOOKED },
    }),
  ]);

  // ---------send notification to property owner---------
  try {
    const notificationData = {
      bookingId: booking.id,
      userId: booking.userId || undefined, // property owner who booked
      providerId: booking.providerId || undefined, // service provider who accepted
      serviceTypes: "SERVICE" as any,
      serviceName: booking.serviceName,
      totalPrice: booking.totalPrice,
      serviceId: booking.serviceId || undefined,
    };

    await BookingNotificationService.sendBookingAcceptNotification(
      notificationData,
    );
  } catch (notificationError) {
    console.error("Accept notification failed:", notificationError);
    // don't fail the booking if notification fails
  }

  return { updatedBooking, updatedService };
};

// provider in_progress booking
const inProgressBooking = async (providerId: string, bookingId: string) => {
  const booking = await prisma.service_booking.findUnique({
    where: {
      id: bookingId,
    },
    include: {
      startAndEndProofVideos: {
        select: {
          id: true,
          isStartedVideo: true,
        },
      },
      service: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, "Booking not found");
  }

  if (booking.providerId !== providerId) {
    const assignedProvider = await prisma.user.findUnique({
      where: { id: booking.providerId! },
      select: { fullName: true, email: true },
    });
    throw new ApiError(
      httpStatus.FORBIDDEN,
      `Unauthorized: You are not the provider of this booking. Assigned Provider: ${assignedProvider?.fullName || "Unknown"} (${assignedProvider?.email || "Unknown"})`,
    );
  }

  if (booking.bookingStatus !== BookingStatus.CONFIRMED) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Booking is not in CONFIRMED state. Current status: ${booking.bookingStatus}`,
    );
  }

  if (!booking.startAndEndProofVideos?.isStartedVideo) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Service started video is required before in-progress booking",
    );
  }

  // update booking status
  return prisma.service_booking.update({
    where: { id: bookingId },
    data: { bookingStatus: BookingStatus.IN_WORKING },
    select: {
      id: true,
      userId: true,
      providerId: true,
      bookingStatus: true,
      startAndEndProofVideos: {
        select: {
          id: true,
          isStartedVideo: true,
          recordProofVideoStarting: true,
        },
      },
      service: {
        select: {
          id: true,
        },
      },
    },
  });
};

// provider complete booking
const completeBooking = async (providerId: string, bookingId: string) => {
  const booking = await prisma.service_booking.findUnique({
    where: {
      id: bookingId,
    },
    include: {
      startAndEndProofVideos: {
        select: {
          id: true,
          isStartedVideo: true,
          isEndedVideo: true,
        },
      },
      service: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, "Booking not found");
  }

  if (booking.providerId !== providerId) {
    const assignedProvider = await prisma.user.findUnique({
      where: { id: booking.providerId! },
      select: { fullName: true, email: true },
    });
    throw new ApiError(
      httpStatus.FORBIDDEN,
      `Unauthorized: You are not the provider of this booking. Assigned Provider: ${assignedProvider?.fullName || "Unknown"} (${assignedProvider?.email || "Unknown"})`,
    );
  }

  if (booking.bookingStatus !== BookingStatus.IN_WORKING) {
    if (booking.bookingStatus === BookingStatus.COMPLETED_BY_PROVIDER) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Proof submitted successfully. The owner will review it shortly."
      );
    }
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Booking is not in working state. Current status: ${booking.bookingStatus}`,
    );
  }

  const hasEndedVideo = booking.startAndEndProofVideos?.isEndedVideo;
  if (!hasEndedVideo) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Service end video is required before completing booking",
    );
  }

  // update booking status
  const result = await prisma.service_booking.update({
    where: { id: bookingId },
    data: { bookingStatus: BookingStatus.COMPLETED_BY_PROVIDER },
    select: {
      id: true,
      userId: true,
      serviceId: true,
      providerId: true,
      bookingStatus: true,
      startAndEndProofVideos: {
        select: {
          id: true,
          recordProofVideoStarting: true,
          isStartedVideo: true,
          recordProofVideoEnding: true,
          isEndedVideo: true,
        },
      },
      service: {
        select: {
          id: true,
          serviceName: true,
        },
      },
      payments: {
        select: {
          id: true,
          amount: true,
        },
      },
    },
  });

  // --------- send notification to service provider ---------
  try {
    const notificationData = {
      bookingId: result.id,
      userId: result.userId || undefined, // property owner who confirmed
      providerId: result.providerId || undefined, // service provider
      serviceTypes: "SERVICE" as any,
      serviceName: result.service?.serviceName || "",
      totalPrice: result.payments[0]?.amount || 0,
      serviceId: result.serviceId || undefined,
    };

    await BookingNotificationService.sendBookingCompleteNotification(
      notificationData,
    );
  } catch (notificationError) {
    console.error("Complete booking notification failed:", notificationError);
    // don't fail booking if notification fails
  }

  return result;
};

// provider reject booking
// const rejectBooking = async (userId: string, bookingId: string) => {
//   // find booking
//   const booking = await prisma.service_booking.findFirst({
//     where: { id: bookingId, providerId: userId },
//   });

//   if (!booking) {
//     throw new ApiError(httpStatus.NOT_FOUND, "Booking not found");
//   }

//   if (booking.bookingStatus !== BookingStatus.NEED_ACCEPT) {
//     throw new ApiError(
//       httpStatus.BAD_REQUEST,
//       "Only confirmed bookings can be rejected",
//     );
//   }

//   // find payment
//   const payment = await prisma.payment.findFirst({
//     where: { service_bookingId: bookingId },
//   });

//   if (!payment) {
//     throw new ApiError(httpStatus.BAD_REQUEST, "Payment not found");
//   }

//   // refund payment to property owner
//   if (payment.paymentIntentId) {
//     try {
//       // For manual capture payments, cancel the payment intent instead of refunding
//       await stripe.paymentIntents.cancel(payment.paymentIntentId);
//     } catch (error) {
//       console.error("Payment intent cancellation failed:", error);
//       throw new ApiError(httpStatus.BAD_REQUEST, "Failed to cancel payment");
//     }
//   }

//   // update booking status
//   await prisma.service_booking.update({
//     where: { id: bookingId },
//     data: { bookingStatus: BookingStatus.REJECTED },
//   });

//   // update payment status
//   await prisma.payment.update({
//     where: { id: payment.id },
//     data: { status: PaymentStatus.REFUNDED },
//   });

//   return { message: "Booking rejected successfully" };
// };
// provider reject booking
const rejectBooking = async (providerId: string, bookingId: string) => {
  // find booking
  const booking = await prisma.service_booking.findFirst({
    where: { id: bookingId, providerId },
  });

  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, "Booking not found");
  }

  if (booking.bookingStatus !== BookingStatus.NEED_ACCEPT) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Only confirmed bookings can be rejected by provider",
    );
  }

  // update both booking and service inside a transaction
  const [updatedBooking, updatedService] = await prisma.$transaction([
    prisma.service_booking.update({
      where: { id: bookingId },
      data: { bookingStatus: BookingStatus.REJECTED },
    }),
    prisma.service.update({
      where: { id: booking.serviceId! },
      data: { isBooked: EveryServiceStatus.AVAILABLE },
    }),
  ]);

  // send notification to property owner
  try {
    const notificationData = {
      bookingId: booking.id,
      userId: booking.userId || undefined, // property owner who made booking
      providerId: booking.providerId || undefined, // service provider who rejected
      serviceTypes: "SERVICE" as any,
      serviceName: booking.serviceName,
      totalPrice: booking.totalPrice,
      serviceId: booking.serviceId || undefined,
    };

    await BookingNotificationService.sendRejectBookingNotification(
      notificationData,
    );
  } catch (notificationError) {
    console.error("Reject booking notification failed:", notificationError);
    // don't fail booking if notification fails
  }

  return { updatedBooking, updatedService };
};

// cancel booking from property owner
const cancelBookingByPropertyOwner = async (
  userId: string,
  bookingId: string,
) => {
  // find booking
  const booking = await prisma.service_booking.findFirst({
    where: { id: bookingId, userId },
  });

  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, "Booking not found");
  }

  if (booking.bookingStatus !== BookingStatus.CONFIRMED) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Only confirmed bookings can be cancelled by property owner",
    );
  }

  // update both booking and service inside a transaction
  const [updatedBooking, updatedService] = await prisma.$transaction([
    prisma.service_booking.update({
      where: { id: bookingId },
      data: { bookingStatus: BookingStatus.REJECTED },
    }),
    prisma.service.update({
      where: { id: booking.serviceId! },
      data: { isBooked: EveryServiceStatus.AVAILABLE },
    }),
  ]);

  // send notification to service provider
  try {
    const notificationData: any = {
      bookingId: booking.id,
      userId: booking.userId, // property owner who cancelled
      providerId: booking.providerId, // service provider who receives notification
      serviceTypes: "SERVICE" as any,
      serviceName: booking.serviceName,
      totalPrice: booking.totalPrice,
      serviceId: booking.serviceId,
    };

    await BookingNotificationService.sendCancelBookingByPropertyOwnerNotification(
      notificationData,
    );
  } catch (notificationError) {
    console.error("Cancel booking notification failed:", notificationError);
    // don't fail booking if notification fails
  }

  return { updatedBooking, updatedService };
};

const PLATFORM_PERCENT = 10;
// property owner confirm → CAPTURE payment
const confirmBookingAndReleasePaymentWithCaptureSplit = async (
  userId: string,
  bookingId: string,
  paymentId: string,
) => {
  // find payment using bookingId since frontend might not pass paymentId
  const payment = await prisma.payment.findFirst({
    where: { 
      service_bookingId: bookingId,
      userId
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!payment) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      `Payment for booking '${bookingId}' not found for this provider`,
    );
  }

  // Robust Fallback: If paymentIntentId is missing OR status is still UNPAID, sync with Stripe
  if ((!payment.paymentIntentId || payment.status === PaymentStatus.UNPAID) && payment.sessionId) {
    console.log(
      `[ConfirmBooking] Syncing payment state for ${payment.id}. Current Status: ${payment.status}, Session: ${payment.sessionId}`,
    );
    try {
      const session = await stripe.checkout.sessions.retrieve(payment.sessionId);

      if (session.payment_intent) {
        const intentId = session.payment_intent as string;
        console.log(`[ConfirmBooking] Found Intent ID: ${intentId} from Stripe. Fetching intent details...`);

        // Verify that the payment is actually authorized
        const intent = await stripe.paymentIntents.retrieve(intentId);
        console.log(`[ConfirmBooking] Stripe Intent Status: ${intent.status}`);

        if (intent.status === "requires_capture" || intent.status === "succeeded") {
          // Update DB so we don't have to fetch again next time
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              paymentIntentId: intentId,
              status: PaymentStatus.IN_HOLD,
            },
          });
          payment.paymentIntentId = intentId;
          payment.status = PaymentStatus.IN_HOLD;

          console.log(
            `[ConfirmBooking] Successfully synced with Stripe! ID: ${intentId}, New Status: IN_HOLD`,
          );
        } else {
          console.warn(
            `[ConfirmBooking] PaymentIntent status is ${intent.status}. Still UNPAID.`,
          );
        }
      } else {
        console.warn(`[ConfirmBooking] No PaymentIntent found in Stripe session ${payment.sessionId}`);
      }
    } catch (stripeError: any) {
      console.error(
        `[ConfirmBooking] Stripe API Error: ${stripeError.message}`,
      );
    }
  }

  if (!payment.paymentIntentId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Payment does not have a valid Stripe PaymentIntent ID. Please ensure the payment was successful.",
    );
  }

  if (!payment.providerId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Payment does not have an assigned Provider ID",
    );
  }

  // Retrieve payment intent to verify actual status on Stripe early
  if (payment.paymentIntentId) {
    try {
      const intent = await stripe.paymentIntents.retrieve(payment.paymentIntentId);
      console.log(`[ConfirmBooking] PaymentIntent ${payment.paymentIntentId} current status: ${intent.status}`);
      if (intent.status === "canceled") {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.REJECTED },
        });
        await prisma.service_booking.update({
          where: { id: bookingId },
          data: { bookingStatus: BookingStatus.CANCELLED },
        });
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "Payment authorization expired on Stripe (holds expire automatically after 7 days). Booking has been marked as cancelled.",
        );
      }
    } catch (err: any) {
      if (err instanceof ApiError) throw err;
      console.error(`[ConfirmBooking] Error retrieving PaymentIntent ${payment.paymentIntentId}:`, err);
    }
  }

  if (payment.status === PaymentStatus.REJECTED) {
    await prisma.service_booking.update({
      where: { id: bookingId },
      data: { bookingStatus: BookingStatus.CANCELLED },
    });
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Payment authorization expired on Stripe (holds expire automatically after 7 days). Booking has been marked as cancelled.",
    );
  }

  if (payment.status !== PaymentStatus.IN_HOLD) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Payment is not in hold state. Current status: ${payment.status}`,
    );
  }

  // find booking
  const booking = await prisma.service_booking.findFirst({
    where: {
      id: bookingId,
      userId,
      bookingStatus: BookingStatus.COMPLETED_BY_PROVIDER,
    },
  });

  if (!booking) {
    const findBooking = await prisma.service_booking.findUnique({
      where: { id: bookingId },
    });

    if (!findBooking) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        `Booking with ID '${bookingId}' not found`,
      );
    }

    if (findBooking.userId !== userId) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "This booking does not belong to you",
      );
    }

    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Booking is not in 'COMPLETED_BY_PROVIDER' state. Current status is: ${findBooking.bookingStatus}`,
    );
  }

  if (payment.service_bookingId !== booking.id) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Payment does not belong to this booking",
    );
  }

  // find provider
  const provider = await prisma.user.findUnique({
    where: { id: payment.providerId },
  });

  if (!provider || !provider.stripeAccountId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Provider Stripe account not found",
    );
  }

  const totalAmount = Math.round(payment.amount * 100);
  const adminAmount = Math.round((totalAmount * PLATFORM_PERCENT) / 100);
  const providerAmount = totalAmount - adminAmount;

  // Retrieve payment intent to verify actual status on Stripe
  let intent: any = null;
  try {
    intent = await stripe.paymentIntents.retrieve(payment.paymentIntentId);
    console.log(`[ConfirmBooking] PaymentIntent ${payment.paymentIntentId} current status: ${intent.status}`);
  } catch (err: any) {
    console.error(`[ConfirmBooking] Error retrieving PaymentIntent ${payment.paymentIntentId}:`, err);
  }

  if (intent?.status === "canceled") {
    // Update both payment and booking status in DB
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.REJECTED },
    });

    await prisma.service_booking.update({
      where: { id: booking.id },
      data: { bookingStatus: BookingStatus.CANCELLED },
    });

    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Payment authorization expired on Stripe (holds expire automatically after 7 days). Booking has been marked as cancelled.",
    );
  }

  let capturedIntent: any = null;

  if (intent?.status === "succeeded") {
    capturedIntent = intent;
  } else {
    try {
      capturedIntent = await stripe.paymentIntents.capture(
        payment.paymentIntentId,
        {
          idempotencyKey: `capture_${payment.id}`,
        },
      );
    } catch (stripeError: any) {
      console.error(`[ConfirmBooking] Stripe capture failed for payment ${payment.id}:`, stripeError);

      if (
        stripeError?.message?.toLowerCase().includes("canceled") ||
        stripeError?.code === "payment_intent_unexpected_state"
      ) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.REJECTED },
        });

        await prisma.service_booking.update({
          where: { id: booking.id },
          data: { bookingStatus: BookingStatus.CANCELLED },
        });

        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "Payment authorization expired on Stripe (holds expire automatically after 7 days). Booking has been marked as cancelled.",
        );
      }

      throw new ApiError(
        httpStatus.BAD_REQUEST,
        stripeError?.message || "Failed to capture payment on Stripe",
      );
    }
  }

  const chargeId = capturedIntent.latest_charge as string | null;

  if (!chargeId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Charge not found after capture",
    );
  }

  // transfer provider share
  await stripe.transfers.create(
    {
      amount: providerAmount,
      currency: payment.currency || "usd",
      destination: provider.stripeAccountId,
      source_transaction: chargeId,
    },
    {
      idempotencyKey: `transfer_${payment.id}_${capturedIntent.latest_charge}`,
    },
  );

  // update payment
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: PaymentStatus.PAID,
      provider_amount: providerAmount / 100,
      admin_amount: adminAmount / 100,
    },
  });

  // final booking status
  await prisma.service_booking.update({
    where: { id: booking.id },
    data: {
      bookingStatus: BookingStatus.COMPLETED,
    },
  });

  // send notification to service provider
  try {
    const notificationData = {
      bookingId: booking.id,
      userId: booking.userId || undefined, // property owner who confirmed
      providerId: booking.providerId || undefined, // service provider
      serviceTypes: "SERVICE" as any,
      serviceName: booking.serviceName,
      totalPrice: payment.amount,
      serviceId: booking.serviceId || undefined,
    };

    await BookingNotificationService.sendConfirmBookingAndReleasePaymentWithCaptureSplit(
      notificationData,
    );
  } catch (notificationError) {
    console.error("Confirm booking notification failed:", notificationError);
    // don't fail booking if notification fails
  }
};

// get all my active and past bookings for a property owner
const getAllServiceActiveAndPastBookings = async (
  userId: string,
  filters: IServiceFilterRequest,
  options: IPaginationOptions,
) => {
  const { limit, page, skip } = paginationHelpers.calculatedPagination(options);

  const { searchTerm, bookingStatus, bookingType, date } = filters;
  const andConditions = [];

  // filter by userId (user can only see their own bookings)
  andConditions.push({ userId });

  // filter by booking type (active=CONFIRMED, IN_WORKING, COMPLETED_BY_PROVIDER, past=COMPLETED)
  if (bookingType) {
    if (bookingType === "active") {
      andConditions.push({
        bookingStatus: {
          in: [
            BookingStatus.NEED_ACCEPT,
            BookingStatus.CONFIRMED,
            BookingStatus.IN_WORKING,
            BookingStatus.COMPLETED_BY_PROVIDER,
          ],
        },
      });
    } else if (bookingType === "to-confirm") {
      andConditions.push({
        bookingStatus: BookingStatus.COMPLETED_BY_PROVIDER,
      });
    } else if (bookingType === "past") {
      andConditions.push({
        bookingStatus: {
          in: [
            BookingStatus.COMPLETED,
            BookingStatus.CANCELLED,
            BookingStatus.REJECTED,
            BookingStatus.EXPIRED,
          ],
        },
      });
    }
  } else {
    // default: show active, completed, cancelled and expired bookings
    andConditions.push({
      bookingStatus: {
        in: [
          BookingStatus.CONFIRMED,
          BookingStatus.IN_WORKING,
          BookingStatus.COMPLETED_BY_PROVIDER,
          BookingStatus.COMPLETED,
          BookingStatus.CANCELLED,
          BookingStatus.REJECTED,
          BookingStatus.EXPIRED,
        ],
      },
    });
  }

  // filter by specific booking status
  if (bookingStatus) {
    andConditions.push({ bookingStatus });
  }

  // filter by date
  if (date) {
    andConditions.push({ date });
  }

  // search by property name or service name
  if (searchTerm) {
    andConditions.push({
      OR: [
        { property: { contains: searchTerm } },
        { serviceName: { contains: searchTerm } },
      ],
    });
  }

  const where = {
    AND: andConditions,
  };

  const result = await prisma.service_booking.findMany({
    where,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { createdAt: "desc" },
    include: {
      startAndEndProofVideos: {
        select: {
          id: true,
          recordProofVideoStarting: true,
          recordProofVideoEnding: true,
          isStartedVideo: true,
          isEndedVideo: true,
        },
      },
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      service: {
        select: {
          id: true,
          serviceRating: true,
          user: {
            select: {
              id: true,
              fullName: true,
              profileImage: true,
            },
          },
        },
      },
      payments: {
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  const total = await prisma.service_booking.count({ where });

  // fetch hotelInfo for active and past bookings
  const bookingsWithHotelInfo = await Promise.all(
    result.map(async (booking) => {
      let hotelInfo = null;
      if (booking.hotelId) {
        hotelInfo = await prisma.hotel.findUnique({
          where: { id: booking.hotelId },
          select: {
            id: true,
            propertyTitle: true,
            propertyAddress: true,
            latitude: true,
            longitude: true,
            propertyDescription: true,
            hotelRating: true,
            hotelReviewCount: true,
            uploadPhotosOrVideos: true,
          },
        });
      }
      return {
        ...booking,
        hotelInfo,
      };
    })
  );

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: bookingsWithHotelInfo,
  };
};

// get single service booking
const getSingleServiceBooking = async (bookingId: string, userId: string) => {
  const bookingInfo = await prisma.service_booking.findFirst({
    where: {
      id: bookingId,
      // userId,
    },
    include: {
      startAndEndProofVideos: {
        select: {
          id: true,
          recordProofVideoStarting: true,
          recordProofVideoEnding: true,
          isStartedVideo: true,
          isEndedVideo: true,
        },
      },
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          contactNumber: true,
          profileImage: true,
          role: true,
          address: true,
          country: true,
        },
      },
      service: {
        select: {
          id: true,
          serviceName: true,
          serviceType: true,
          address: true,
          experience: true,
          description: true,
          offered_services: true,
          serviceRating: true,
          serviceReviewCount: true,
          coverImage: true,
          providerId: true,

          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              contactNumber: true,
              profileImage: true,
              role: true,
              address: true,
              country: true,
            },
          },
          reviews: true,
        },
      },
      payments: {
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!bookingInfo) {
    throw new ApiError(httpStatus.NOT_FOUND, "Service booking not found");
  }

  const hotelId = bookingInfo?.hotelId;
  let hotelInfo = null;
  if (hotelId) {
    hotelInfo = await prisma.hotel.findUnique({
      where: { id: hotelId },
      select: {
        id: true,
        propertyTitle: true,
        propertyAddress: true,
        latitude: true,
        longitude: true,
        propertyDescription: true,
        hotelRating: true,
        hotelReviewCount: true,
        uploadPhotosOrVideos: true,
        guards: true,
        inventoryItems: true,
      },
    });
  }

  // merge hotelInfo into bookingInfo
  return {
    ...bookingInfo,
    hotelInfo,
  };
};

// get all service bookings for provider by providerId
const getAllServiceBookingsOfProvider = async (
  providerId: string,
  filter?: string,
  options: IPaginationOptions = {},
) => {
  const { limit, page, skip } = paginationHelpers.calculatedPagination(options);

  // find provider
  const provider = await prisma.user.findUnique({
    where: {
      id: providerId,
    },
  });
  if (!provider) {
    throw new ApiError(httpStatus.NOT_FOUND, "Provider not found");
  }

  let whereClause: any = { providerId };

  if (filter === "new-requests") {
    // New Requests: NEED_ACCEPT bookings
    whereClause.bookingStatus = BookingStatus.NEED_ACCEPT;
  } else if (filter === "accepted") {
    // Confirmed: CONFIRMED bookings
    whereClause.bookingStatus = BookingStatus.CONFIRMED;
  } else if (filter === "ongoing") {
    // Ongoing: IN_WORKING bookings
    whereClause.bookingStatus = {
      in: [BookingStatus.IN_WORKING, BookingStatus.COMPLETED_BY_PROVIDER],
    };
  } else if (filter === "completed") {
    // Completed: COMPLETED bookings
    whereClause.bookingStatus = BookingStatus.COMPLETED;
  }
  // if no filter return all

  const result = await prisma.service_booking.findMany({
    where: whereClause,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { createdAt: "desc" },
    include: {
      startAndEndProofVideos: {
        select: {
          id: true,
          recordProofVideoStarting: true,
          recordProofVideoEnding: true,
          isStartedVideo: true,
          isEndedVideo: true,
        },
      },
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      service: {
        select: {
          id: true,
          serviceName: true,
          serviceType: true,
          serviceRating: true,
          serviceReviewCount: true,
          offered_services: true,
          coverImage: true,
        },
      },
      payments: {
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  // get inventory items and hotel details for each booking using hotelId
  const bookingsWithExtraData = await Promise.all(
    result.map(async (booking) => {
      let inventoryItems: any[] = [];
      let hotelInfo: any = null;

      if (booking.hotelId) {
        inventoryItems = await prisma.inventoryItem.findMany({
          where: { hotelId: booking.hotelId },
          select: {
            id: true,
            name: true,
            quantity: true,
            missingQuantity: true,
            description: true,
          },
        });

        hotelInfo = await prisma.hotel.findUnique({
          where: { id: booking.hotelId },
          select: {
            id: true,
            propertyTitle: true,
            propertyAddress: true,
            latitude: true,
            longitude: true,
            propertyDescription: true,
            hotelRating: true,
            hotelReviewCount: true,
            uploadPhotosOrVideos: true,
          },
        });
      }

      return {
        ...booking,
        inventoryItems,
        hotelInfo,
        propertyAddress: hotelInfo?.propertyAddress || null,
      };
    }),
  );

  const total = await prisma.service_booking.count({ where: whereClause });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: bookingsWithExtraData,
  };
};

export const ServiceBookingService = {
  createServiceBooking,
  acceptBooking,
  inProgressBooking,
  completeBooking,
  rejectBooking,
  cancelBookingByPropertyOwner,
  confirmBookingAndReleasePaymentWithCaptureSplit,
  getAllServiceActiveAndPastBookings,
  getSingleServiceBooking,
  getAllServiceBookingsOfProvider,
};
