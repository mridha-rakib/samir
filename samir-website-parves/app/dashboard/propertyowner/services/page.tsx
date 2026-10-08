"use client";

import { Suspense } from "react";
import OwnerServices from "../../owner/components/OwnerServices";
import { useNotification } from "../../owner/components/PropertyOwnerLayout";

function ServicesPageContent() {
  const { triggerNotification } = useNotification();
  return <OwnerServices triggerNotification={triggerNotification} />;
}

export default function ServicesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex flex-col justify-center items-center bg-zinc-50 font-sans">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <ServicesPageContent />
    </Suspense>
  );
}
