"use client";

import { useState } from "react";
import SellerSidebar from "./SellerSidebar";
import SellerNavbar from "./SellerNavbar";

interface SellerLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function SellerLayout({
  children,
  title = "Seller Dashboard",
}: SellerLayoutProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-[#F5F7FB] overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <SellerSidebar isCollapsed={isCollapsed} />
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SellerSidebar onNavigate={() => setIsMobileOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <SellerNavbar
          title={title}
          onMenuClick={() => setIsMobileOpen(true)}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          isCollapsed={isCollapsed}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 xl:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
