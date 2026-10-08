import React from "react";
import PropertyCard from "./PropertyCard";
import Pagination from "@/app/components/Pagination";

interface PropertiesListProps {
  displayedProperties: any[];
  isPropertiesLoading: boolean;
  onStartAddProperty: () => void;
  onDeleteProperty: (id: string) => void;
  onShareProperty: (rawData: any) => void;
  onViewInventory?: (id: string) => void;
  getStatusBadgeStyles: (status: string) => string;
  meta?: any;
  page?: number;
  limit?: number;
  onPageChange?: (page: number) => void;
}

export default function PropertiesList({
  displayedProperties,
  isPropertiesLoading,
  onStartAddProperty,
  onDeleteProperty,
  onShareProperty,
  onViewInventory,
  getStatusBadgeStyles,
  meta,
  page,
  limit,
  onPageChange,
}: PropertiesListProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="text-left">
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight">
            My Properties
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400 font-semibold">
            Manage and share your listings
          </p>
        </div>
        <button
          onClick={onStartAddProperty}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/10 transition-all text-sm flex items-center gap-1.5 cursor-pointer"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Property
        </button>
      </div>

      {isPropertiesLoading ? (
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-zinc-400 font-bold mt-2">
            Loading properties...
          </p>
        </div>
      ) : displayedProperties.length === 0 ? (
        <div className="py-24 text-center bg-white border border-zinc-150 rounded-3xl shadow-sm">
          <svg
            className="w-12 h-12 text-zinc-300 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <p className="text-sm font-bold text-zinc-500">No properties found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedProperties.map((prop) => (
              <PropertyCard
                key={prop.id}
                prop={prop}
                onDelete={onDeleteProperty}
                onShare={onShareProperty}
                onViewInventory={onViewInventory}
                getStatusBadgeStyles={getStatusBadgeStyles}
              />
            ))}
          </div>
          
          {meta && page && limit && onPageChange && (
            <Pagination
              currentPage={page}
              totalItems={meta.total}
              limit={limit}
              onPageChange={onPageChange}
            />
          )}
        </>
      )}
    </div>
  );
}
