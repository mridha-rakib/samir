"use client";

import OwnerGuests from "../../owner/components/OwnerGuests";
import { useNotification } from "../../owner/components/PropertyOwnerLayout";

export default function GuestsPage() {
  const { triggerNotification } = useNotification();
  return <OwnerGuests triggerNotification={triggerNotification} />;
}
