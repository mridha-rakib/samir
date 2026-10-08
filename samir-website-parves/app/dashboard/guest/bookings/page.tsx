"use client";

import React, { useState } from "react";
import { useNotification } from "../layout";
import GuestBookingsList from "../components/GuestBookingsList";
import GuestBookingDetails from "../components/GuestBookingDetails";

export default function GuestBookingsPage() {
  const { triggerNotification } = useNotification();
  const [viewState, setViewState] = useState<"list" | "booking_details">("list");
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  return (
    <div className="h-full w-full">
      {viewState !== "booking_details" && (
        <GuestBookingsList
          onSelectBooking={(id) => {
            setSelectedBookingId(id);
            setViewState("booking_details");
          }}
          triggerNotification={triggerNotification}
        />
      )}
      {viewState === "booking_details" && selectedBookingId && (
        <GuestBookingDetails
          bookingId={selectedBookingId}
          triggerNotification={triggerNotification}
          onBackToList={() => {
            setViewState("list");
            setSelectedBookingId(null);
          }}
        />
      )}
    </div>
  );
}
