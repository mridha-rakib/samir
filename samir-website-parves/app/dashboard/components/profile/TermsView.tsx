"use client";

import React from "react";
import { useGetTermsConditionsQuery } from "@/redux/api/policyApi";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

export default function TermsView() {
  const token = useSelector((state: RootState) => state.auth.token);
  const { data: termsResponse, isLoading } = useGetTermsConditionsQuery(undefined, { skip: !token });
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const termsText = termsResponse?.data?.[0]?.description || "No terms and conditions defined yet.";

  return (
    <div className="text-xs text-zinc-500 font-semibold leading-relaxed space-y-3 w-full text-left">
      <div dangerouslySetInnerHTML={{ __html: termsText }} />
    </div>
  );
}
