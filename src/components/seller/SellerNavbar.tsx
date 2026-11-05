"use client";

import { useEffect, useState } from "react";
import {
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ShoppingBag,
  Store,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

interface SellerNavbarProps {
  onMenuClick?: () => void;
  onToggleCollapse?: () => void;
  isCollapsed?: boolean;
  title?: string;
}

export default function SellerNavbar({
  onMenuClick,
  onToggleCollapse,
  isCollapsed = false,
  title = "Seller Dashboard",
}: SellerNavbarProps) {
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-17 px-4 md:px-6 xl:px-8 bg-white/92 backdrop-blur-xl border-b border-slate-200/80">
      {/* Left side */}
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 lg:hidden transition cursor-pointer"
          aria-label="Open mobile navigation menu"
        >
          <Menu size={20} />
        </button>

        {/* Desktop Collapse Button */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex p-2.5 rounded-xl hover:bg-slate-100 text-slate-600 transition cursor-pointer"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>

        <div>
          <h1 className="text-lg font-extrabold tracking-tight text-slate-950">
            {title}
          </h1>
          <p className="text-[11px] font-medium text-slate-500 hidden sm:block">
            Merchant & Vendor Operations
          </p>
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-3">
        {/* Storefront Link */}
        <a
          href={process.env.NEXT_PUBLIC_STOREFRONT_URL || "http://localhost:3000"}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
        >
          <ShoppingBag size={14} className="text-blue-600" />
          Customer Storefront
        </a>

        {/* Status Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Active Merchant</span>
        </div>

        {/* Seller Profile Pill */}
        <div className="flex items-center gap-2.5 pl-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
            <Store size={15} />
          </div>
          <div className="hidden sm:block text-left">
            <span className="block text-xs font-bold text-slate-900 leading-tight">
              {currentUser?.name || "Seller Partner"}
            </span>
            <span className="block text-[10px] font-semibold text-slate-400">
              Verified Store
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
