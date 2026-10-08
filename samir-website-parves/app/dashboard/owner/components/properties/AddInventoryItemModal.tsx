import React, { useState } from "react";

interface AddInventoryItemModalProps {
  show: boolean;
  onCancel: () => void;
  onAdd: (name: string, qty: string) => void;
}

export default function AddInventoryItemModal({
  show,
  onCancel,
  onAdd,
}: AddInventoryItemModalProps) {
  const [newInvName, setNewInvName] = useState("");
  const [newInvQty, setNewInvQty] = useState("");

  if (!show) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newInvName.trim() && newInvQty.trim()) {
      onAdd(newInvName.trim(), newInvQty.trim());
      setNewInvName("");
      setNewInvQty("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-xs">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[320px] bg-white border border-zinc-205 rounded-2xl p-6 shadow-2xl space-y-4"
      >
        <h3 className="font-black text-sm text-zinc-955 text-center">
          Add New Item
        </h3>

        <div className="space-y-3 text-left">
          <div>
            <label className="block text-[10px] font-bold text-zinc-700 mb-1 uppercase tracking-wider">
              Item Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Fork"
              value={newInvName}
              onChange={(e) => setNewInvName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 outline-none text-xs font-bold"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-700 mb-1 uppercase tracking-wider">
              Quantity
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 12 Forks"
              value={newInvQty}
              onChange={(e) => setNewInvQty(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 outline-none text-xs font-bold"
            />
            <p className="text-[9px] text-zinc-400 mt-1">
              Format: number followed by item name (e.g. &quot;6 Forks&quot;)
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setNewInvName("");
              setNewInvQty("");
              onCancel();
            }}
            className="flex-1 py-2.5 border border-zinc-200 text-zinc-500 rounded-xl text-xs font-bold hover:bg-zinc-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            Add
          </button>
        </div>
      </form>
    </div>
  );
}
