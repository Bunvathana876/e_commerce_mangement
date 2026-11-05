"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SellerLayout from "@/components/seller/SellerLayout";
import { getCurrentUser, isLoggedIn } from "@/lib/auth";

export default function SellerRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      if (!isLoggedIn()) {
        setReady(false);
        const currentPath =
          typeof window !== "undefined"
            ? window.location.pathname
            : "/seller";
        router.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
        return;
      }

      const user = getCurrentUser();
      const role = (user?.role || "").toLowerCase().trim();

      if (role === "seller") {
        setReady(true);
      } else if (role === "admin") {
        setReady(false);
        router.replace("/admin/dashboard");
      } else {
        setReady(false);
        router.replace("/login?error=access_denied");
      }
    };

    checkAuth();

    window.addEventListener("auth-changed", checkAuth);
    return () => window.removeEventListener("auth-changed", checkAuth);
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
            Verifying Seller Authorization…
          </p>
        </div>
      </div>
    );
  }

  return <SellerLayout>{children}</SellerLayout>;
}
