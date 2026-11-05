"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, isLoggedIn } from "@/lib/auth";

export default function ManagementRootPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    const user = getCurrentUser();
    const role = (user?.role || "").toLowerCase().trim();
    if (role === "admin") {
      router.replace("/admin/dashboard");
    } else if (role === "seller") {
      router.replace("/seller");
    } else {
      router.replace("/login");
    }
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
