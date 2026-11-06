"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { validateManagementSession } from "@/lib/management-session";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let validation = 0;
    const checkAuth = async () => {
      const currentValidation = ++validation;
      setReady(false);
      const user = await validateManagementSession();
      if (cancelled || currentValidation !== validation) return;
      if (!user) {
        router.replace(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      } else if (user.role === "admin") {
        setReady(true);
      } else if (user.role === "seller") {
        router.replace("/seller");
      }
    };

    const revalidate = () => { void checkAuth(); };
    revalidate();
    window.addEventListener("auth-changed", revalidate);
    window.addEventListener("storage", revalidate);
    return () => {
      cancelled = true;
      window.removeEventListener("auth-changed", revalidate);
      window.removeEventListener("storage", revalidate);
    };
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
            Verifying Admin Authorization…
          </p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout role="admin" title="Admin Dashboard">
      {children}
    </DashboardLayout>
  );
}
