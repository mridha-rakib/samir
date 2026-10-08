import axios from "axios";
import ical from "node-ical";
import prisma from "../../../shared/prisma";
import { BookingSource, BookingStatus } from "@prisma/client";

export const syncAirbnbBookedCalendar = async () => {
  //  get all hotels that should sync with Airbnb
  const hotels = await prisma.hotel.findMany({
    where: {
      syncWithAirbnb: true,
      NOT: [{ airbnbIcalUrl: null }, { airbnbIcalUrl: "" }],
    },
    select: {
      id: true,
      partnerId: true,
      airbnbIcalUrl: true,
    },
  });

  for (const hotel of hotels) {
    try {
      if (!hotel.airbnbIcalUrl) continue;

      const trimmedUrl = hotel.airbnbIcalUrl.trim();
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(trimmedUrl);
        if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
          console.warn(`[Airbnb Sync] ⚠️ Skipping hotel ${hotel.id}: Invalid protocol "${parsedUrl.protocol}" in URL: "${hotel.airbnbIcalUrl}"`);
          continue;
        }
      } catch {
        console.warn(`[Airbnb Sync] ⚠️ Skipping hotel ${hotel.id}: Invalid Airbnb iCal URL format "${hotel.airbnbIcalUrl}". Expected a valid http/https URL.`);
        continue;
      }

      const response = await axios.get(trimmedUrl, {
        timeout: 10000,
        headers: {
          "User-Agent": "Hostibook-iCal-Sync/1.0",
        },
      });
      const events = ical.parseICS(response.data);

      for (const event of Object.values(events)) {
        if (event.type !== "VEVENT") continue;

        // skip invalid dates
        if (!event.start || !event.end) continue;

        // default values for missing fields
        const bookedFromDate = event.start.toISOString().split("T")[0];
        const bookedToDate = event.end.toISOString().split("T")[0];

        // loop prevention:
        // only accept real Airbnb reservation events
        const summary = typeof event.summary === "string" ? event.summary : (event.summary as any)?.val;

        if (
          !event.uid ||
          !event.uid.includes("@airbnb.com") ||
          !summary ||
          !summary.toLowerCase().includes("reserved")
        ) {
          continue;
        }

        // check if booking already exist
        const existingBooking = await prisma.hotel_Booking.findUnique({
          where: {
            externalBookingId: event.uid,
          },
        });

        // handle cancellation
        if (event.status === "CANCELLED" && existingBooking) {
          await prisma.hotel_Booking.update({
            where: { id: existingBooking.id },
            data: {
              bookingStatus: BookingStatus.CANCELLED,
            },
          });
          continue;
        }

        // conflict check: overlapping dates
        // check if there is any other confirmed booking that overlaps with these dates
        const overlappingAppBooking = await prisma.hotel_Booking.findFirst({
          where: {
            hotelId: hotel.id,
            bookingStatus: BookingStatus.CONFIRMED,
            bookedFromDate: { lt: bookedToDate },
            bookedToDate: { gt: bookedFromDate },
            NOT: {
              externalBookingId: event.uid,
            },
          },
        });

        if (overlappingAppBooking) {
          // Conflict detected! Same date e aage theke booking thakle skip korbo.
          // Because APP er user der priority aage dibo.
          console.warn(`[Airbnb Sync] Conflict detected for hotel ${hotel.id} on dates ${bookedFromDate} to ${bookedToDate}. Skipping Airbnb booking ${event.uid}.`);
          continue;
        }

        // create new (airbnb) booking if not exists
        if (!existingBooking) {
          await prisma.hotel_Booking.create({
            data: {
              hotelId: hotel.id,
              partnerId: hotel.partnerId!,
              externalBookingId: event.uid,
              bookingStatus: BookingStatus.CONFIRMED,
              bookingSource: BookingSource.AIRBNB,
              bookedFromDate,
              bookedToDate,
              personOfGuests: 1, // iCal does not provide guest count (but my website this field required)
              totalPrice: 0, // iCal does not provide price (but my website this field required)
            },
          });
        }
      }
    } catch (err: any) {
      console.error(`[Airbnb Sync] Failed to sync hotel ${hotel.id}:`, err?.message || err);
    }
  }
};
