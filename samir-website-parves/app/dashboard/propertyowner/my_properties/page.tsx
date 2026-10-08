"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import OwnerProperties from "../../owner/components/OwnerProperties";
import { useNotification } from "../../owner/components/PropertyOwnerLayout";

function MyPropertiesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { triggerNotification } = useNotification();
  
  const wizardActive = searchParams.get("wizard") === "true";
  const setWizardActive = (val: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val) {
      params.set("wizard", "true");
    } else {
      params.delete("wizard");
    }
    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  return (
    <OwnerProperties
      wizardActive={wizardActive}
      setWizardActive={setWizardActive}
      triggerNotification={triggerNotification}
    />
  );
}

export default function MyPropertiesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex flex-col justify-center items-center bg-zinc-50 font-sans">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <MyPropertiesPageContent />
    </Suspense>
  );
}
