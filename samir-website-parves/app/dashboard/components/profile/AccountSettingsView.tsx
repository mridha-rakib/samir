"use client";

import React from "react";
import { Key, FileText, Shield, Info, HelpCircle } from "lucide-react";

type ProfileSubView = "password" | "terms" | "privacy" | "about" | "faq" | "main";

interface AccountSettingsViewProps {
  onNavigate: (view: ProfileSubView) => void;
}

export default function AccountSettingsView({ onNavigate }: AccountSettingsViewProps) {
  return (
    <div className="space-y-6 flex-1 flex flex-col justify-between text-left">
      <div>
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center gap-3 border-b border-zinc-150 pb-4 mb-4">
          <button onClick={() => onNavigate("main")} className="text-zinc-400 hover:text-zinc-600 cursor-pointer font-bold text-lg">←</button>
          <h3 className="text-base font-black text-zinc-950">Account Settings</h3>
        </div>

        {/* Desktop Header */}
        <h3 className="hidden lg:block text-base font-black text-zinc-955 border-b border-zinc-100 pb-3 mb-6">Account Settings</h3>

        {/* Mobile List View */}
        <div className="lg:hidden space-y-1">
          {[
            { label: "Change Password", key: "password" },
            { label: "Terms of services", key: "terms" },
            { label: "Privacy Policy", key: "privacy" },
            { label: "About us", key: "about" },
            { label: "FAQ", key: "faq" },
          ].map((link) => (
            <button 
              key={link.key} 
              onClick={() => onNavigate(link.key as ProfileSubView)} 
              className="w-full py-3.5 px-2 border-b border-zinc-100 flex items-center justify-between text-xs font-bold text-zinc-700 hover:text-zinc-955 transition-colors cursor-pointer"
            >
              <span>{link.label}</span>
              <span className="text-zinc-350 font-bold">→</span>
            </button>
          ))}
        </div>

        <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: "Change Password", key: "password", icon: <Key className="w-5 h-5" />, desc: "Update and secure your account credentials" },
            { label: "Terms of Services", key: "terms", icon: <FileText className="w-5 h-5" />, desc: "Read our service terms and rules" },
            { label: "Privacy Policy", key: "privacy", icon: <Shield className="w-5 h-5" />, desc: "Review how we secure your data" },
            { label: "About Us", key: "about", icon: <Info className="w-5 h-5" />, desc: "Learn more about Hostibook history and vision" },
            { label: "FAQ", key: "faq", icon: <HelpCircle className="w-5 h-5" />, desc: "Find answers to frequently asked questions" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key as ProfileSubView)}
              className="p-5 border border-zinc-150 rounded-2xl text-left hover:border-blue-400 hover:shadow-sm transition-all flex items-center justify-between cursor-pointer group bg-zinc-50/30 hover:bg-white"
            >
              <div className="flex items-start gap-4">
                <span className="text-xl shrink-0 mt-0.5">{item.icon}</span>
                <div>
                  <h4 className="text-xs font-bold text-zinc-955">{item.label}</h4>
                  <p className="text-[10px] text-zinc-400 font-semibold mt-1 leading-normal">{item.desc}</p>
                </div>
              </div>
              <span className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all">
                →
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
