import React from "react";
import { MapPinIcon, TrashIcon } from "../Icons";

interface PropertyCardProps {
  prop: {
    id: string;
    title: string;
    location: string;
    guard: string;
    status: string;
    image: string;
    rawData: any;
  };
  onDelete: (id: string) => void;
  onShare: (rawData: any) => void;
  onViewInventory?: (id: string) => void;
  getStatusBadgeStyles: (status: string) => string;
}

export default function PropertyCard({
  prop,
  onDelete,
  onShare,
  onViewInventory,
  getStatusBadgeStyles,
}: PropertyCardProps) {
  return (
    <div className="bg-white border border-zinc-150 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group text-left">
      {/* Delete trigger */}
      <button
        onClick={() => onDelete(prop.id)}
        className="absolute top-4 left-4 p-2 bg-white/95 rounded-full shadow-md z-10 hover:bg-red-50 text-red-500 hover:text-red-700 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
        title="Delete property"
      >
        <TrashIcon />
      </button>

      <div className="relative h-48 w-full">
        <img
          src={prop.image}
          alt={prop.title}
          className="object-cover w-full h-full"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80";
          }}
        />
        <span
          className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${getStatusBadgeStyles(
            prop.status
          )}`}
        >
          {prop.status}
        </span>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div className="text-left space-y-2">
          <h3 className="text-base font-black text-zinc-955 tracking-tight leading-snug">
            {prop.title}
          </h3>
          <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-semibold">
            <MapPinIcon />
            <span className="truncate">{prop.location}</span>
          </div>
          <p className="text-xs text-zinc-500 font-bold">{prop.guard}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mt-2">
          <button
            onClick={() => onShare(prop.rawData)}
            className="flex-1 py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-2xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M8.684 10.742l4.636-2.318m0 4.152l-4.636-2.318M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Share
          </button>
          
          {onViewInventory && (
            <button
              onClick={() => onViewInventory(prop.id)}
              className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-2xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-center"
            >
              Inventory Report
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
