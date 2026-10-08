"use client";

import { useParams, useRouter } from "next/navigation";
import SPJobDetails from "../../provider/components/SPJobDetails";
import { useNotification } from "../layout";

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const { triggerNotification } = useNotification();

  return (
    <div className="flex-1 w-full relative overflow-y-auto">
      <SPJobDetails
        jobId={jobId}
        onBack={() => router.push("/dashboard/service")}
        triggerNotification={triggerNotification}
      />
    </div>
  );
}
