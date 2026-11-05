"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, ReactNode } from "react";
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  Boxes,
  ShoppingCart,
  BarChart3,
  Store,
  Settings,
  ExternalLink,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getCurrentUser, logout } from "@/lib/auth";

export interface SellerNavItem {
  title: string;
  href: string;
  icon: ReactNode;
  disabled?: boolean;
  badge?: string;
  external?: boolean;
}

export interface SellerNavGroup {
  label: string;
  items: SellerNavItem[];
}

interface SellerSidebarProps {
  isCollapsed?: boolean;
  onNavigate?: () => void;
}

export default function SellerSidebar({
  isCollapsed = false,
  onNavigate,
}: SellerSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const navGroups: SellerNavGroup[] = [
    {
      label: "Overview",
      items: [
        {
          title: "Dashboard",
          href: "/seller",
          icon: <LayoutDashboard size={18} />,
        },
      ],
    },
    {
      label: "Catalog & Stock",
      items: [
        {
          title: "My Products",
          href: "/seller/products",
          icon: <Package size={18} />,
        },
        {
          title: "Add Product",
          href: "/seller/products/new",
          icon: <PlusCircle size={18} />,
          disabled: true,
          badge: "Phase C",
        },
        {
          title: "Inventory",
          href: "/seller/inventory",
          icon: <Boxes size={18} />,
          disabled: true,
          badge: "Phase C",
        },
      ],
    },
    {
      label: "Fulfillment & Insights",
      items: [
        {
          title: "Orders",
          href: "/seller/orders",
          icon: <ShoppingCart size={18} />,
          disabled: true,
          badge: "Phase C",
        },
        {
          title: "Sales Analytics",
          href: "/seller/analytics",
          icon: <BarChart3 size={18} />,
          disabled: true,
          badge: "Phase C",
        },
      ],
    },
    {
      label: "Storefront & Settings",
      items: [
        {
          title: "Store Profile",
          href: "/seller/store",
          icon: <Store size={18} />,
        },
        {
          title: "Settings",
          href: "/seller/settings",
          icon: <Settings size={18} />,
          disabled: true,
          badge: "Phase C",
        },
        {
          title: "Public Storefront",
          href: "/",
          icon: <ExternalLink size={18} />,
          external: true,
        },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-slate-950 text-white border-r border-white/8 transition-all duration-300 ease-in-out shadow-[12px_0_40px_rgba(15,23,42,0.08)]",
        isCollapsed ? "w-18" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-4 h-17 border-b border-white/8 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white text-lg font-black shrink-0 shadow-lg shadow-blue-600/25">
          BP
        </div>
        {!isCollapsed && (
          <div className="min-w-0">
            <span className="font-extrabold text-white text-[15px] truncate tracking-tight block">
              Seller Center
            </span>
            <span className="text-[11px] font-semibold text-blue-400 block tracking-wide">
              Blue Panda Partner
            </span>
          </div>
        )}
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!isCollapsed && (
              <p className="px-3 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.16em]">
                {group.label}
              </p>
            )}

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  !item.disabled &&
                  !item.external &&
                  (pathname === item.href || pathname.startsWith(item.href + "/"));

                if (item.disabled) {
                  return (
                    <div
                      key={item.href}
                      title={isCollapsed ? `${item.title} (Available in Phase C)` : undefined}
                      className={cn(
                        "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium opacity-50 cursor-not-allowed select-none text-slate-500",
                        isCollapsed && "justify-center"
                      )}
                    >
                      <span className="shrink-0 w-5 h-5 flex items-center justify-center">
                        {item.icon}
                      </span>
                      {!isCollapsed && (
                        <>
                          <span className="truncate">{item.title}</span>
                          {item.badge && (
                            <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                    title={isCollapsed ? item.title : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-950/40"
                        : "text-slate-400 hover:bg-white/7 hover:text-white",
                      isCollapsed && "justify-center"
                    )}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-r-full" />
                    )}

                    <span
                      className={cn(
                        "shrink-0 w-5 h-5 flex items-center justify-center transition-transform",
                        !isActive && "group-hover:scale-110"
                      )}
                    >
                      {item.icon}
                    </span>

                    {!isCollapsed && (
                      <>
                        <span className="truncate">{item.title}</span>
                        {item.badge && (
                          <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer: User Details & Logout */}
      <div className="border-t border-white/8 p-3 shrink-0 space-y-1">
        <div
          className={cn(
            "flex items-center gap-3 p-2.5 rounded-xl bg-white/4",
            isCollapsed && "justify-center"
          )}
        >
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">
            {(currentUser?.name || "Seller").charAt(0).toUpperCase()}
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate flex items-center gap-1.5">
                {currentUser?.name || "Verified Seller"}
                <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
              </p>
              <p className="text-xs text-slate-400 truncate">
                {currentUser?.email || "seller@bluepanda.com"}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer",
            isCollapsed && "justify-center"
          )}
          title="Sign Out"
        >
          <LogOut size={18} />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
