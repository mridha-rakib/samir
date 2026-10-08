"use client";

import { useGetAllPrivacyPolicyQuery } from "@/redux/api/policyApi";
import Link from "next/link";

export default function PrivacyPolicyPage() {
  const { data: privacyResponse, isLoading, error } = useGetAllPrivacyPolicyQuery(undefined);

  const privacyText = privacyResponse?.data?.[0]?.description || "";

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 antialiased">
      {/* Header Banner */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 py-12 px-6 text-center text-white shadow-md">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold bg-white/10 hover:bg-white/20 transition px-4 py-2 rounded-full backdrop-blur-sm self-start md:self-center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Privacy Policy</h1>
          <p className="text-blue-100/90 text-sm md:text-base font-medium max-w-xl">
            Learn how Hostibook collects, uses, and protects your information.
          </p>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto py-12 px-6">
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-8 md:p-12 shadow-sm min-h-[400px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-zinc-500 font-semibold text-sm">Loading Privacy Policy...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <span className="text-red-500 text-5xl">⚠️</span>
              <h2 className="text-xl font-bold text-zinc-800">Failed to load Privacy Policy</h2>
              <p className="text-zinc-500 max-w-sm text-sm">
                Something went wrong while retrieving the policy. Please try again later.
              </p>
            </div>
          ) : !privacyText ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
              <span className="text-zinc-400 text-5xl">📜</span>
              <p className="text-zinc-500 font-semibold">No privacy policy defined yet.</p>
            </div>
          ) : (
            <article 
              className="prose prose-blue max-w-none prose-headings:font-bold prose-p:text-zinc-600 prose-headings:text-zinc-800"
              dangerouslySetInnerHTML={{ __html: privacyText }} 
            />
          )}
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="text-center py-8 border-t border-zinc-200 bg-white">
        <p className="text-xs text-zinc-400 font-medium">
          &copy; {new Date().getFullYear()} Hostibook. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
