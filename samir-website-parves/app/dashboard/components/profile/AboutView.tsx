"use client";

import React from "react";
import { useGetAboutQuery } from "@/redux/api/settingApi";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

export default function AboutView() {
  const token = useSelector((state: RootState) => state.auth.token);
  const { data: aboutResponse, isLoading } = useGetAboutQuery(undefined, { skip: !token });
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const aboutText = aboutResponse?.data?.[0]?.description || "No about information defined yet.";

  return (
    <div className="text-xs text-zinc-500 font-semibold leading-relaxed space-y-3 w-full text-left">
      <div dangerouslySetInnerHTML={{ __html: aboutText }} />
    </div>
  );
}
