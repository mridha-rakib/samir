"use client";

import OwnerBookings from "../../owner/components/OwnerBookings";
import { useNotification } from "../../owner/components/PropertyOwnerLayout";

export default function BookingsPage() {
  const { triggerNotification } = useNotification();
  return <OwnerBookings triggerNotification={triggerNotification} />;
}
