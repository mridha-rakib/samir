"use client";

import React, { useState } from "react";
import { useGetAllFaqQuery } from "@/redux/api/faqApi";
import { useDebounce } from "@/app/hooks/useDebounce";

export default function FAQView() {
  const { data: faqResponse, isLoading: isLoadingFaq } = useGetAllFaqQuery(undefined);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const faqs = React.useMemo(() => {
    const list = Array.isArray(faqResponse?.data?.data)
      ? faqResponse.data.data
      : Array.isArray(faqResponse?.data)
      ? faqResponse.data
      : Array.isArray(faqResponse)
      ? faqResponse
      : [];
    return list;
  }, [faqResponse]);

  const filteredFaqs = React.useMemo(() => {
    if (!debouncedSearchQuery.trim()) return faqs;
    const lowerQuery = debouncedSearchQuery.toLowerCase();
    return faqs.filter((faq: any) =>
      (faq.question || "").toLowerCase().includes(lowerQuery) ||
      (faq.answer || "").toLowerCase().includes(lowerQuery)
    );
  }, [faqs, debouncedSearchQuery]);

  if (isLoadingFaq) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl text-left w-full">
      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search FAQs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-4 pr-10 py-3.5 rounded-2xl border border-zinc-200 outline-none text-xs font-bold bg-zinc-50/50 focus:border-blue-500 transition-colors"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
      </div>

      {filteredFaqs.length === 0 ? (
        <div className="text-center py-12 bg-zinc-50 border border-zinc-150 rounded-3xl p-6">
          <p className="text-xs text-zinc-400 font-bold">No FAQs found matching your criteria.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFaqs.map((faq: any, idx: number) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={faq.id || faq._id || idx}
                className="border border-zinc-150 rounded-2xl bg-white overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left cursor-pointer hover:bg-zinc-50/50 transition-colors"
                >
                  <span className="text-xs font-extrabold text-zinc-955 pr-4 font-sans">{faq.question}</span>
                  <span className={`text-zinc-450 transition-transform duration-300 shrink-0 ${isOpen ? "rotate-180" : ""}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isOpen ? "max-h-[500px] border-t border-zinc-100" : "max-h-0"
                  }`}
                >
                  <div className="px-5 py-4 text-xs text-zinc-500 font-semibold leading-relaxed font-sans" dangerouslySetInnerHTML={{ __html: faq.answer }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
