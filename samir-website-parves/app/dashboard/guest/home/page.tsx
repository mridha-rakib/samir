"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useNotification } from "../layout";
import { useCreateHotelBookingMutation, useCreateTravelersMutation } from "@/redux/api/hotelBookingApi";
import { useCreateStripeCheckoutSessionHotelMutation } from "@/redux/api/paymentApi";
import ExploreProperties from "../components/ExploreProperties";
import PropertyDetailsView from "../components/PropertyDetailsView";
import CheckInVerification from "../components/CheckInVerification";
import BookingConfirmation from "../components/BookingConfirmation";
import GuestBookingDetails from "../components/GuestBookingDetails";
import PaymentPendingScreen from "../components/PaymentPendingScreen";

interface Property {
  id: string | number;
  title: string;
  subtitle: string;
  location: string;
  rating: number;
  reviews: number;
  price: string;
  image: string;
  images: string[];
  description: string;
  capacity: {
    guests: number;
    bedrooms: number;
    bathrooms: number;
    wifi: number;
    laundry: number;
  };
  houseRules: string[];
  guard?: {
    name: string;
    phone: string;
    avatar: string;
    status: string;
  };
  amenities?: string[];
  addLocalTips?: any[];
  houseRulesImg?: string;
  customPrices?: any[];
  host?: {
    id: string;
    name: string;
    avatar: string;
  };
  bookedDates?: { bookedFromDate: string; bookedToDate: string }[];
}

export default function GuestHomePage() {
  const router = useRouter();
  const { triggerNotification, openNotifications, unreadCount } = useNotification();
  const [viewState, setViewState] = useState<"list" | "details" | "verification" | "confirmed" | "booking_details" | "payment_pending">("list");
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const [bookingCheckIn, setBookingCheckIn] = useState("");
  const [bookingCheckOut, setBookingCheckOut] = useState("");
  const [bookingGuests, setBookingGuests] = useState(2);
  const [lastCreatedBookingId, setLastCreatedBookingId] = useState<string | null>(null);

  const [createHotelBooking] = useCreateHotelBookingMutation();
  const [createTravelers] = useCreateTravelersMutation();
  const [createStripeCheckout] = useCreateStripeCheckoutSessionHotelMutation();

  const handleReserve = (checkIn: string, checkOut: string, guests: number) => {
    setBookingCheckIn(checkIn);
    setBookingCheckOut(checkOut);
    setBookingGuests(guests);
    setViewState("verification");
  };

  const handleVerificationSubmit = async (travelersList: { name: string; file: File }[]) => {
    if (!selectedProperty) return;
    try {
      const bookingData = {
        bookedFromDate: bookingCheckIn,
        bookedToDate: bookingCheckOut,
        personOfGuests: bookingGuests,
      };

      const bookingRes = await createHotelBooking({
        hotelId: selectedProperty.id.toString(),
        body: bookingData,
      }).unwrap();

      if (bookingRes?.success && bookingRes?.data?.id) {
        const bookingId = bookingRes.data.id;
        setLastCreatedBookingId(bookingId);

        const formData = new FormData();
        const bodyJSON = {
          travelers: travelersList.map(t => ({ fullName: t.name })),
        };
        formData.append("data", JSON.stringify(bodyJSON));

        travelersList.forEach((t) => {
          formData.append("passportImages", t.file);
        });

        const uploadRes = await createTravelers({
          bookingId,
          body: formData,
        }).unwrap();

        if (uploadRes?.success || uploadRes?.data) {
          triggerNotification("Travelers registered successfully! Creating payment session...", "success");
          try {
            const checkoutRes = await createStripeCheckout(bookingId).unwrap();
            const url = checkoutRes?.data?.url || checkoutRes?.data?.checkoutUrl;
            if (url) {
              setCheckoutUrl(url);
              window.open(url, "_blank");
            } else {
              triggerNotification("Stripe session URL not found.", "error");
            }
          } catch (paymentErr: any) {
            console.error(paymentErr);
            triggerNotification("Failed to create Stripe payment session.", "error");
          }
          setViewState("payment_pending");
        } else {
          triggerNotification("Failed to upload traveler documents", "error");
        }
      } else {
        triggerNotification(bookingRes?.message || "Failed to create booking", "error");
      }
    } catch (err: any) {
      console.error(err);
      triggerNotification(err?.data?.message || err?.message || "Overlap detected or booking creation failed.", "error");
    }
  };

  const handleOpenChatForHost = () => {
    if (!selectedProperty?.host?.id) {
      triggerNotification("Host information not available.", "error");
      return;
    }
    triggerNotification("Opening thread with host...", "success");
    router.push(`/dashboard/guest/chat?hostId=${selectedProperty.host.id}`);
  };

  return (
    <div className="h-full w-full">
      {viewState === "list" && (
        <ExploreProperties
          onSelectProperty={(prop) => { setSelectedProperty(prop); setViewState("details"); }}
          triggerNotification={triggerNotification}
          openNotifications={openNotifications}
          unreadCount={unreadCount}
        />
      )}

      {viewState === "details" && selectedProperty && (
        <PropertyDetailsView
          property={selectedProperty}
          onBack={() => setViewState("list")}
          onReserve={handleReserve}
          triggerNotification={triggerNotification}
        />
      )}

      {viewState === "verification" && (
        <CheckInVerification
          onBack={() => setViewState("details")}
          onSubmit={handleVerificationSubmit}
          triggerNotification={triggerNotification}
          guestsCount={bookingGuests}
        />
      )}

      {viewState === "confirmed" && (
        <BookingConfirmation
          onViewDetails={() => setViewState("booking_details")}
        />
      )}

      {viewState === "booking_details" && (
        <GuestBookingDetails
          bookingId={lastCreatedBookingId}
          triggerNotification={triggerNotification}
          onBackToList={() => setViewState("list")}
        />
      )}

      {viewState === "payment_pending" && lastCreatedBookingId && (
        <PaymentPendingScreen
          checkoutUrl={checkoutUrl}
          bookingId={lastCreatedBookingId}
          onPaymentSuccess={() => setViewState("confirmed")}
          onBack={() => setViewState("list")}
          triggerNotification={triggerNotification}
        />
      )}
    </div>
  );
}
