"use client";

import OwnerEarnings from "../../owner/components/OwnerEarnings";
import { useNotification } from "../../owner/components/PropertyOwnerLayout";

export default function EarningsPage() {
  const { triggerNotification } = useNotification();
  return <OwnerEarnings triggerNotification={triggerNotification} />;
}
