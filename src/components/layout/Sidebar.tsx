"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode } from "react";
import { cn } from "@/lib/utils"; // if you don't have cn, see note below
import { LogOut } from "lucide-react";
import { logout } from "@/lib/auth";

export type SidebarItem = {
  title: string;
  href: string;
  icon: ReactNode;
  badge?: string | number;
};

export type SidebarGroup = {
  label: string;
  items: SidebarItem[];
};

interface SidebarProps {
  groups: SidebarGroup[];
  title?: string;
  logo?: ReactNode;
  isCollapsed?: boolean;
  userName?: string;
  userRole?: string;
  onLogout?: () => void;
}

export default function Sidebar({
  groups,
  title = "MyMarketplace",
  logo,
  isCollapsed = false,
  userName = "Admin",
  userRole = "Super Admin",
  onLogout,
}: SidebarProps) {
  // 1. Hooks MUST be inside the component!
  const pathname = usePathname();
  const router = useRouter(); 

  // 2. Moved the logout logic inside so it can access the router
  const handleLogout = () => {
    // If the parent provided a custom onLogout prop, run that
    if (onLogout) {
      onLogout();
    } else {
      // Otherwise use the default logout logic
      logout();
      router.replace("/login");
    }
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-slate-950 text-white border-r border-white/8 transition-all duration-300 ease-in-out shadow-[12px_0_40px_rgba(15,23,42,0.08)]",
        isCollapsed ? "w-18" : "w-64"
      )}
    >
      {/* ========== Logo ========== */}
      <div className="flex items-center gap-3 px-4 h-17 border-b border-white/8 shrink-0">
        {logo ? (
          logo
        ) : (
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white text-lg shrink-0 shadow-lg shadow-blue-600/25">
            B
          </div>
        )}
        {!isCollapsed && (
          <span className="font-extrabold text-white text-[15px] truncate tracking-tight">
            {title}
          </span>
        )}
      </div>

      {/* ========== Navigation ========== */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {groups.map((group) => (
          <div key={group.label}>
            {/* Group Label */}
            {!isCollapsed && (
              <p className="px-3 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.16em]">
                {group.label}
              </p>
            )}

            {/* Group Items */}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={isCollapsed ? item.title : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-950/40"
                        : "text-slate-400 hover:bg-white/7 hover:text-white"
                    )}
                  >
                    {/* Active left bar */}
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
                          <span
                            className={cn(
                              "ml-auto text-xs font-semibold px-2 py-0.5 rounded-full",
                              isActive
                                ? "bg-white/20 text-white"
                                : "bg-red-100 text-red-600"
                            )}
                          >
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

      {/* ========== Footer (User + Logout) ========== */}
      <div className="border-t border-white/8 p-3 shrink-0 space-y-1">
        {/* User */}
        <Link
          href="/admin/profile"
          className={cn(
            "flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/7 transition-colors",
            isCollapsed && "justify-center"
          )}
        >
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {userName.charAt(0)}
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {userName}
              </p>
              <p className="text-xs text-slate-500 truncate">{userRole}</p>
            </div>
          )}
        </Link>

        {/* Logout */}
        <button
          onClick={handleLogout} // 3. Updated this to use the internal handleLogout function
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-colors",
            isCollapsed && "justify-center"
          )}
        >
          <LogOut size={18} />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
