"use client";

import OwnerHome from "../../owner/components/OwnerHome";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useGetMyProfileQuery } from "@/redux/api/userApi";
import { useNotification } from "../../owner/components/PropertyOwnerLayout";

export default function HomePage() {
  const router = useRouter();
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: profileResponse } = useGetMyProfileQuery(undefined, { skip: !token });
  
  const { triggerNotification, navigateTab } = useNotification();
  
  const profName = profileResponse?.data?.fullName || user?.fullName || "";

  const handleStartWizard = () => {
    // Navigate to the property‑creation wizard page
    router.push("/dashboard/propertyowner/add-property");
  };

  return (
    <OwnerHome
      profName={profName}
      onNavigateTab={navigateTab}
      onStartWizard={handleStartWizard}
      triggerNotification={triggerNotification}
    />
  );
}
