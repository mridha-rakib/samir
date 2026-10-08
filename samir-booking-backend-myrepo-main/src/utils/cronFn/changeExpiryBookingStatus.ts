import {
  BookingStatus,
  EveryServiceStatus,
  PaymentStatus,
} from "@prisma/client";
import cron from "node-cron";
import dayjs from "dayjs";
import prisma from "../../shared/prisma";
import { subMinutes, parse, startOfDay } from "date-fns";
import stripe from "../../helpars/stripe";
import { syncAirbnbBookedCalendar } from "../../app/modules/HotelBooking/syncAirbnbBookedCalendar";
import emailSender from "../../helpars/emailSender";
import { jwtHelpers } from "../../helpars/jwtHelpers";
import config from "../../config";

// helper function for date check
const isPastDate = (date: string) => {
  return dayjs(date).isBefore(dayjs(), "day"); // check if the date is before the current date
};

export const changeExpiryBookingStatus = () => {
  // subscription expiry check daily at midnight
  cron.schedule("0 0 * * *", async () => {
    console.log("Running daily subscription expiry check...");

    const now = new Date();

    // Find expired subscriptions
    const expired = await prisma.purchase_subscription.findMany({
      where: {
        endDate: { lt: now },
        status: "ACTIVE",
      },
    });

    for (const sub of expired) {
      // Set subscription INACTIVE
      await prisma.purchase_subscription.update({
        where: { id: sub.id },
        data: { status: "INACTIVE" },
      });

      // Set user unsubscribed
      await prisma.user.update({
        where: { id: sub.userId },
        data: { isSubscribed: false },
      });

      console.log("Expired subscription updated:", sub.id);
    }
  });

  // hotel booking status update every hour
  cron.schedule("0 * * * *", async () => {
    console.log("⏰ Booking status update job running...");

    // hotel bookings
    const expiredHotels = await prisma.hotel_Booking.findMany({
      where: { bookingStatus: BookingStatus.CONFIRMED },
    });

    for (const booking of expiredHotels) {
      if (isPastDate(booking.bookedToDate)) {
        await prisma.hotel_Booking.update({
          where: { id: booking.id },
          data: { bookingStatus: BookingStatus.COMPLETED },
        });

        if (booking?.hotelId) {
          await prisma.hotel.update({
            where: { id: booking.hotelId },
            data: { availableForBooking: EveryServiceStatus.AVAILABLE },
          });
        }
      }
    }

    console.log("All expired bookings marked as COMPLETED");
  });

  // service booking status update every hour
  cron.schedule("0 * * * *", async () => {
    console.log("⏰ Booking status update job running...");

    // service bookings
    const expiredServices = await prisma.service_booking.findMany({
      where: { bookingStatus: BookingStatus.CONFIRMED },
    });

    for (const booking of expiredServices) {
      if (isPastDate(booking.date)) {
        await prisma.service_booking.update({
          where: { id: booking.id },
          data: { bookingStatus: BookingStatus.COMPLETED },
        });
      }
    }

    // Auto-cancel old uncaptured service bookings older than 7 days (Stripe hold expiry)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const expiredHoldBookings = await prisma.service_booking.findMany({
      where: {
        bookingStatus: {
          in: [BookingStatus.NEED_ACCEPT, BookingStatus.CONFIRMED, BookingStatus.IN_WORKING, BookingStatus.COMPLETED_BY_PROVIDER],
        },
        createdAt: { lt: sevenDaysAgo },
      },
      select: { id: true },
    });

    if (expiredHoldBookings.length > 0) {
      const ids = expiredHoldBookings.map((b) => b.id);
      await prisma.service_booking.updateMany({
        where: { id: { in: ids } },
        data: { bookingStatus: BookingStatus.CANCELLED },
      });
      await prisma.payment.updateMany({
        where: { service_bookingId: { in: ids }, status: { in: [PaymentStatus.IN_HOLD, PaymentStatus.UNPAID] } },
        data: { status: PaymentStatus.REJECTED },
      });
      console.log(`Auto-cancelled ${ids.length} expired uncaptured service bookings older than 7 days`);
    }

    console.log("All expired bookings marked as COMPLETED or CANCELLED");
  });

  // sync airbnb booked calendar every 30 minutes
  cron.schedule("*/30 * * * *", async () => {
    await syncAirbnbBookedCalendar();
    // console.log("⏰ Syncing Airbnb booked calendar...");
  });

  // checkout reminder email sent 6 hours before checkout (checked every 15 minutes)
  cron.schedule("*/15 * * * *", async () => {
    console.log("⏰ Checkout reminder cron job running...");
    const now = new Date();

    const activeBookings = await prisma.hotel_Booking.findMany({
      where: {
        bookingStatus: { in: [BookingStatus.CONFIRMED, BookingStatus.IN_WORKING] },
        checkoutEmailSent: false,
      },
      include: {
        user: true,
        hotel: true,
      },
    });

    for (const booking of activeBookings) {
      try {
        if (booking.bookedToDate && booking.user?.email) {
          const toDateObj = parse(booking.bookedToDate, "yyyy-MM-dd", new Date());
          const checkoutTime = new Date(toDateObj.getTime() + 11 * 60 * 60 * 1000); // 11:00 AM
          const targetTime = new Date(checkoutTime.getTime() - 6 * 60 * 60 * 1000); // 5:00 AM (6 hours before)

          if (now >= targetTime) {
            console.log(`Sending checkout reminder email to ${booking.user.email} for booking ${booking.id}...`);

            const emailSubject = "Checkout Day Reminder & Review";
            
            // Create a secure review token (valid for 7 days)
            const reviewToken = jwtHelpers.generateToken(
              {
                userId: booking.user.id,
                bookingId: booking.id,
                hotelId: booking.hotelId,
              },
              config.jwt.jwt_secret as string,
              "7d"
            );

            const reviewUrl = `${config.frontend_url}/review?token=${reviewToken}`;

            const emailHtml = `
              <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1a202c; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); border: 1px solid #edf2f7;">
                <div style="text-align: center; margin-bottom: 20px;">
                  <h2 style="color: #2b6cb0; font-size: 24px; margin: 0;">How was your stay?</h2>
                </div>
                <p style="font-size: 16px;">Hello <strong>${booking.user.fullName || "Guest"}</strong>,</p>
                <p style="font-size: 16px;">We hope you had a wonderful time at <strong>${booking.hotel?.propertyTitle || "our property"}</strong>.</p>
                <p style="font-size: 16px;">As checkout time approaches, we would love to hear about your experience. Your feedback helps us and future guests immensely!</p>
                
                <div style="text-align: center; margin: 35px 0;">
                  <a href="${reviewUrl}" style="background-color: #3182ce; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 2px 4px rgba(49, 130, 206, 0.4);">Leave a Review</a>
                </div>

                <p style="font-size: 14px; color: #718096; margin-top: 30px; border-top: 1px solid #edf2f7; padding-top: 20px;">
                  Warm regards,<br>
                  <strong style="color: #2d3748;">The Samir Booking Team</strong>
                </p>
              </div>
            `;

            await emailSender(emailSubject, booking.user.email, emailHtml);

            // Mark email as sent
            await prisma.hotel_Booking.update({
              where: { id: booking.id },
              data: { checkoutEmailSent: true },
            });
            console.log(`Checkout reminder email sent and marked for booking ${booking.id}`);
          }
        }
      } catch (err) {
        console.error(`Error processing checkout reminder for booking ${booking.id}:`, err);
      }
    }
  });

  // delete expired PENDING_PAYMENT service bookings after 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    console.log("⏰ Expired service booking cleanup job running...");
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    try {
      // Find expired bookings
      const expiredBookings = await prisma.service_booking.findMany({
        where: {
          bookingStatus: BookingStatus.PENDING_PAYMENT,
          createdAt: { lt: fiveMinutesAgo },
        },
        select: { id: true },
      });

      if (expiredBookings.length > 0) {
        const bookingIds = expiredBookings.map((b) => b.id);
        console.log(`Found ${bookingIds.length} expired pending bookings. Cleaning up...`);

        // Use transaction to delete both payment records, notifications, and bookings
        await prisma.$transaction([
          prisma.payment.deleteMany({
            where: {
              service_bookingId: { in: bookingIds },
            },
          }),
          prisma.notifications.deleteMany({
            where: {
              bookingId: { in: bookingIds },
            },
          }),
          prisma.service_booking.deleteMany({
            where: {
              id: { in: bookingIds },
            },
          }),
        ]);

        console.log("Expired pending service bookings and their payment records deleted successfully.");
      }
    } catch (error) {
      console.error("Error in expired service booking cleanup cron job:", error);
    }
  });
};
