import React from "react";
import { TrashIcon } from "../Icons";
import { useGetInventoryByHotelIdQuery } from "@/redux/api/hotelApi";

interface InventoryModalProps {
  show: boolean;
  onClose: () => void;
  hotelId?: string | null;
  propInventory: Array<{ name: string; qty: string }>;
  setPropInventory: (items: Array<{ name: string; qty: string }>) => void;
  onOpenAddItem: () => void;
  triggerNotification: (msg: string, type?: "success" | "error") => void;
}

export default function InventoryModal({
  show,
  onClose,
  hotelId,
  propInventory,
  setPropInventory,
  onOpenAddItem,
  triggerNotification,
}: InventoryModalProps) {
  // Call hook only when hotelId is provided and show is true
  const { data: liveInventoryRes, isLoading } = useGetInventoryByHotelIdQuery(hotelId, {
    skip: !show || !hotelId,
  });

  if (!show) return null;

  // Determine if we are in live view mode vs local edit wizard mode
  const isLiveView = !!hotelId;
  const liveItems = liveInventoryRes?.data?.items || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-955/40 backdrop-blur-sm">
      <div className="w-full max-w-[390px] bg-white border border-zinc-200 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-2 border-b border-zinc-150">
          <h3 className="font-black text-base text-zinc-950">
            {isLiveView ? "Inventory Report" : "Inventory Checklist"}
          </h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-650 font-extrabold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {isLiveView && isLoading ? (
          <div className="py-12 text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-zinc-400 font-bold mt-2">
              Fetching inventory report...
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[40vh] overflow-y-auto pr-1">
            {isLiveView ? (
              liveItems.length === 0 ? (
                <p className="text-xs text-zinc-400 py-6 text-center font-bold">
                  No inventory items registered.
                </p>
              ) : (
                liveItems.map((item: any) => {
                  const isMissing = item.missingQuantity > 0;
                  return (
                    <div
                      key={item.id}
                      className="flex justify-between items-center p-3.5 border border-zinc-150 rounded-2xl bg-zinc-50/50"
                    >
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-xs font-black text-zinc-800 truncate">{item.name}</p>
                        {item.description && (
                          <p className="text-[9px] text-zinc-400 font-medium truncate mt-0.5">{item.description}</p>
                        )}
                        <p className="text-[10px] text-blue-600 font-bold mt-1">
                          In Stock: {item.quantity}
                        </p>
                      </div>
                      <div className="shrink-0 pl-2">
                        {isMissing ? (
                          <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-100 text-[9px] font-black uppercase tracking-wider">
                            ⚠️ {item.missingQuantity} Missing
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-black uppercase tracking-wider">
                            ✓ OK
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )
            ) : propInventory.length === 0 ? (
              <p className="text-xs text-zinc-400 py-4 text-center">
                No inventory items added yet.
              </p>
            ) : (
              propInventory.map((item) => (
                <div
                  key={item.name}
                  className="flex justify-between items-center p-3 border border-zinc-150 rounded-xl bg-zinc-50/50"
                >
                  <div className="text-left">
                    <p className="text-xs font-bold text-zinc-800">{item.name}</p>
                    <p className="text-[10px] text-blue-600 font-bold mt-0.5">
                      {item.qty}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPropInventory(
                        propInventory.filter((i) => i.name !== item.name)
                      );
                      triggerNotification("Item deleted");
                    }}
                    className="p-1 hover:bg-zinc-100 rounded cursor-pointer"
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        <div className="space-y-2 pt-3 border-t border-zinc-150">
          {!isLiveView ? (
            <>
              <button
                type="button"
                onClick={onOpenAddItem}
                className="w-full py-3 border-2 border-blue-600 hover:bg-blue-50 text-blue-600 rounded-2xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                + Add Item
              </button>
              <button
                onClick={onClose}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-md text-xs cursor-pointer"
              >
                Save Inventory
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-3.5 bg-zinc-800 hover:bg-zinc-900 text-white rounded-2xl font-bold shadow-md text-xs cursor-pointer"
            >
              Close Report
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
