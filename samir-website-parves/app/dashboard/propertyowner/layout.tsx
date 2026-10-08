"use client";

import { Suspense } from "react";
import PropertyOwnerLayout from "../owner/components/PropertyOwnerLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex flex-col justify-center items-center bg-zinc-50 font-sans">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <PropertyOwnerLayout>{children}</PropertyOwnerLayout>
    </Suspense>
  );
}
