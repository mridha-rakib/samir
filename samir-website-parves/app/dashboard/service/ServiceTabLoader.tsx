"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useGetMyProfileQuery } from "@/redux/api/userApi";
import { useNotification } from "./layout";
import SPHome from "../provider/components/SPHome";

interface ServiceTabLoaderProps {
  activeTab: "new" | "accepted" | "ongoing" | "completed" | "myservice" | null;
}

export default function ServiceTabLoader({ activeTab }: ServiceTabLoaderProps) {
  const router = useRouter();
  const token = useSelector((state: RootState) => state.auth.token);
  const { data: profileResponse } = useGetMyProfileQuery(undefined, { skip: !token });
  const { triggerNotification } = useNotification();

  const profName = profileResponse?.data?.fullName || "Mr. Rahman";

  // Local state for toggling nested subviews like "services" when on the main service dashboard
  const [localSubView, setLocalSubView] = useState<"services" | "jobs" | "job-details" | "earnings" | null>(null);

  // Map subView dynamically based on active Tab
  const subView = activeTab === "myservice" ? "services" : (activeTab === null ? localSubView : "jobs");

  const setSubView = (view: "services" | "jobs" | "job-details" | "earnings" | null) => {
    if (view === "jobs") {
      router.push("/dashboard/service/newrequest");
    } else if (view === "services") {
      router.push("/dashboard/service/myservice?ALL");
    } else if (view === "earnings") {
      setLocalSubView("earnings");
    } else if (activeTab === null) {
      setLocalSubView(view);
    } else if (view === null) {
      setLocalSubView(null);
      router.push("/dashboard/service");
    }
  };

  const handleTabChange = (tab: "new" | "accepted" | "ongoing" | "completed") => {
    const routeMap = {
      new: "newrequest",
      accepted: "accepted",
      ongoing: "ongoing",
      completed: "completed",
    };
    router.push(`/dashboard/service/${routeMap[tab]}`);
  };

  return (
    <div className="flex-1 w-full relative overflow-y-auto">
      <Suspense fallback={
        <div className="min-h-[400px] w-full flex flex-col justify-center items-center font-sans">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }>
        <SPHome
          profName={profName}
          subView={subView}
          setSubView={setSubView}
          jobsActiveSubTab={activeTab !== "myservice" && activeTab !== null ? activeTab : "new"}
          setJobsActiveSubTab={handleTabChange}
          onViewJobDetails={(jobId) => {
            router.push(`/dashboard/service/${jobId}`);
          }}
          onViewProofOfWork={(jobId) => {
            router.push(`/dashboard/service/${jobId}`);
          }}
          onMessageOwner={(ownerId) => {
            router.push(`/dashboard/service/message?ownerId=${ownerId}`);
          }}
          triggerNotification={triggerNotification}
        />
      </Suspense>
    </div>
  );
}
