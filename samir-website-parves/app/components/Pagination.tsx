import React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  totalItems?: number;
  limit?: number;
  totalPages?: number;
  onPageChange: (page: number) => void;
  className?: string;
  showItemCount?: boolean;
}

export default function Pagination({
  currentPage,
  totalItems,
  limit,
  totalPages: customTotalPages,
  onPageChange,
  className = "",
  showItemCount = false,
}: PaginationProps) {
  // Calculate total pages from totalItems & limit if totalPages not explicitly provided
  const totalPages =
    customTotalPages ??
    (totalItems !== undefined && limit !== undefined && limit > 0
      ? Math.ceil(totalItems / limit)
      : 1);

  // If 1 or 0 pages, do not render pagination
  if (totalPages <= 1) return null;

  // Helper to generate the array of page numbers and ellipsis
  const getPageNumbers = (): (number | "...")[] => {
    // If total pages is 7 or fewer, show all page numbers
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // If total pages > 7:
    // 1. Near the start: pages 1 to 5, then '...', then last page
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }

    // 2. Near the end: first page, '...', then last 5 pages
    if (currentPage >= totalPages - 3) {
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    // 3. Somewhere in the middle: first page, '...', previous, current, next, '...', last page
    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ];
  };

  const pages = getPageNumbers();

  const startItem =
    totalItems !== undefined && limit !== undefined ? (currentPage - 1) * limit + 1 : null;
  const endItem =
    totalItems !== undefined && limit !== undefined
      ? Math.min(currentPage * limit, totalItems)
      : null;

  return (
    <div className={`flex flex-col items-center gap-3 mt-8 mb-6 ${className}`}>
      {showItemCount && startItem !== null && endItem !== null && totalItems !== undefined && (
        <p className="text-xs text-zinc-500 font-medium">
          Showing <span className="font-semibold text-zinc-800">{startItem}</span> to{" "}
          <span className="font-semibold text-zinc-800">{endItem}</span> of{" "}
          <span className="font-semibold text-zinc-800">{totalItems}</span> results
        </p>
      )}

      <nav
        role="navigation"
        aria-label="Pagination"
        className="flex items-center justify-center gap-1 sm:gap-1.5"
      >
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          aria-label="Go to previous page"
          className="inline-flex items-center justify-center gap-1 h-9 px-2.5 sm:px-3 rounded-lg border border-zinc-200 bg-white text-xs sm:text-sm font-medium text-zinc-700 transition-all hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-40 shadow-xs cursor-pointer select-none"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Page Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {pages.map((page, index) => {
            if (page === "...") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="flex h-9 w-8 sm:w-9 items-center justify-center text-zinc-400 select-none"
                  aria-hidden="true"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">More pages</span>
                </span>
              );
            }

            const isCurrent = page === currentPage;
            return (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                aria-current={isCurrent ? "page" : undefined}
                aria-label={`Page ${page}`}
                className={`inline-flex h-9 min-w-9 px-3 items-center justify-center rounded-lg text-xs sm:text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1 cursor-pointer select-none ${
                  isCurrent
                    ? "bg-zinc-900 text-white shadow-xs hover:bg-zinc-800"
                    : "bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          aria-label="Go to next page"
          className="inline-flex items-center justify-center gap-1 h-9 px-2.5 sm:px-3 rounded-lg border border-zinc-200 bg-white text-xs sm:text-sm font-medium text-zinc-700 transition-all hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-40 shadow-xs cursor-pointer select-none"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </nav>
    </div>
  );
}
