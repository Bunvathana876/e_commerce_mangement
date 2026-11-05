"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Store,
  ShieldCheck,
  Package,
  ShoppingCart,
  Boxes,
  ArrowRight,
  Info,
  Clock,
  Layers,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

export default function SellerDashboardPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const sellerName = currentUser?.name || "Merchant Partner";
  const sellerEmail = currentUser?.email || "seller@bluepanda.com";

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-slate-950 via-slate-900 to-blue-950 text-white p-6 sm:p-8 md:p-10 shadow-xl border border-white/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-200 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck size={14} className="text-emerald-400" />
              Verified Seller Workspace
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white">
              Welcome, {sellerName}
            </h1>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              Your dedicated Blue Panda Seller Center is now active. This portal provides isolated, role-guarded access for managing your store catalog, fulfilling orders, and tracking verified sales.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Store size={14} className="text-blue-400" />
                Account: {sellerEmail}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-600" />
              <span className="flex items-center gap-1.5 font-medium">
                <Clock size={14} className="text-emerald-400" />
                Phase B: Interface Segregation Active
              </span>
            </div>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-3">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg shadow-blue-600/30"
            >
              <span>View Public Storefront</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Ambient Decorative Accents */}
        <div className="absolute right-0 top-0 -mt-12 -mr-12 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Architecture Separation Status Notice */}
      <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/80 border border-blue-200/80 flex items-start gap-3.5 text-blue-900">
        <Info size={20} className="text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm leading-relaxed space-y-1">
          <p className="font-bold text-blue-950">
            Phase B Architecture Completed: Isolated Seller Space
          </p>
          <p className="text-blue-800">
            Seller access is now segregated from administrative routes. Administrators and customers cannot access this view, and seller operations will be directly integrated with FastAPI multi-tenant APIs in subsequent phases without fabricated data.
          </p>
        </div>
      </div>

      {/* Roadmap & Feature Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Module 1: Catalog */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Package size={20} />
            </div>
            <div>
              <span className="inline-block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Phase C Milestone
              </span>
              <h2 className="text-base font-bold text-slate-900">
                Products & Catalog
              </h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Create and manage products scoped strictly to your store, with secure image uploads and category classifications.
            </p>
          </div>
          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">
              Feature Module
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
              Phase C
            </span>
          </div>
        </div>

        {/* Module 2: Order Fulfillment */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <ShoppingCart size={20} />
            </div>
            <div>
              <span className="inline-block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Phase D Milestone
              </span>
              <h2 className="text-base font-bold text-slate-900">
                Order Fulfillment
              </h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Process customer orders containing items from your store. Advance fulfillment status from processing to shipped.
            </p>
          </div>
          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">
              FastAPI Integration
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
              Phase D
            </span>
          </div>
        </div>

        {/* Module 3: Inventory Oversight */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Boxes size={20} />
            </div>
            <div>
              <span className="inline-block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Phase D Milestone
              </span>
              <h2 className="text-base font-bold text-slate-900">
                Real-Time Stock & Analytics
              </h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Atomic inventory tracking directly with PostgreSQL. View real-time stock levels, out-of-stock notices, and verified revenue.
            </p>
          </div>
          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">
              Live Database
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
              Phase D
            </span>
          </div>
        </div>
      </div>

      {/* Store Readiness Checklist */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
            <Layers size={18} />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Multi-Vendor Marketplace Roadmap
            </h2>
            <p className="text-xs text-slate-500">
              Implementation progression for Blue Panda multi-vendor architecture
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800">Task B.1</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <p className="text-xs font-bold text-slate-900">Role Separation</p>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Dedicated Seller Center and layout segregation completed.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-800">Phase C</span>
              <span className="text-[10px] font-bold text-blue-600 uppercase">Next</span>
            </div>
            <p className="text-xs font-bold text-slate-900">Seller UI Pages</p>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Product creation wizard, order tables, and inventory UI.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">Phase D</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Upcoming</span>
            </div>
            <p className="text-xs font-bold text-slate-900">Backend APIs</p>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              FastAPI seller endpoints for scoped metrics, orders, and products.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">Phase F</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Upcoming</span>
            </div>
            <p className="text-xs font-bold text-slate-900">End-to-End Flow</p>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Customer checkout, stock deduction, and seller fulfillment integration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
