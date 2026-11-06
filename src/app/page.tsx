"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { validateManagementSession } from "@/lib/management-session";

export default function ManagementRootPage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    void validateManagementSession().then((user) => {
      if (cancelled) return;
      router.replace(user?.role === "admin" ? "/admin/dashboard" : user?.role === "seller" ? "/seller" : "/login");
    });
    return () => { cancelled = true; };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-9 h-9 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
          Routing to Portal…
        </p>
      </div>
    </div>
  );
}
