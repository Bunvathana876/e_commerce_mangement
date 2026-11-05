"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IoPersonSharp } from "react-icons/io5";
import { MdOutlineEmail } from "react-icons/md";
import { FaLock } from "react-icons/fa";
import { ArrowLeft } from "lucide-react";
import { authApi } from "@/lib/api";
import {
  isLoggedIn,
  saveAuthSession,
  getCurrentUser,
  getSafeRoleDestination,
  logout,
} from "@/lib/auth";

type Mode = "login" | "register";

interface AuthFormProps {
  mode: Mode;
}

function AuthFormInner({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  const [isLogin, setIsLogin] = useState(mode === "login");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsLogin(mode === "login");
    setErrorMessage(null);
  }, [mode]);

  useEffect(() => {
    if (isLoggedIn()) {
      const current = getCurrentUser();
      router.replace(getSafeRoleDestination(current?.role, redirectParam));
    }
  }, [router, redirectParam]);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const fillDemoAccount = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      if (isLogin) {
        const res = await authApi.login({ email, password });
        const userRole = (res.data?.user?.role || "").toLowerCase().trim();
        if (userRole === "customer") {
          setErrorMessage(
            "Access denied: Customer accounts cannot access the management portal. Please sign in to the customer storefront at http://localhost:3000."
          );
          logout();
          setLoading(false);
          return;
        }
        saveAuthSession(res.data.access_token, res.data.user);
        router.push(getSafeRoleDestination(res.data.user.role, redirectParam));
      } else {
        if (password !== confirmPassword) {
          setErrorMessage("Passwords do not match.");
          setLoading(false);
          return;
        }
        const res = await authApi.register({ name, email, password });
        saveAuthSession(res.data.access_token, res.data.user);
        router.push(getSafeRoleDestination(res.data.user.role, redirectParam));
      }
    } catch (err: any) {
      setErrorMessage(
        err.message || "Authentication failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  const switchToRegister = () => {
    setIsLogin(false);
    setErrorMessage(null);
    router.push(
      redirectParam
        ? `/register?redirect=${encodeURIComponent(redirectParam)}`
        : "/register"
    );
  };

  const switchToLogin = () => {
    setIsLogin(true);
    setErrorMessage(null);
    router.push(
      redirectParam
        ? `/login?redirect=${encodeURIComponent(redirectParam)}`
        : "/login"
    );
  };

  return (
    <div className="w-full max-w-4xl space-y-4">
      <div className="flex items-center justify-between px-1">
        <a
          href={process.env.NEXT_PUBLIC_STOREFRONT_URL || "http://localhost:3000"}
          className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-600 hover:text-blue-600 transition"
        >
          <ArrowLeft size={14} />
          Back to Customer Storefront
        </a>
      </div>

      <div className="relative flex w-full bg-white rounded-[2rem] shadow-[0_30px_90px_rgba(15,23,42,0.14)] overflow-hidden min-h-140 border border-white">
        {/* ========== REGISTER SIDE ========== */}
        <div
          className={`w-full md:w-1/2 p-8 sm:p-10 flex flex-col justify-center items-center ${
            isLogin ? "hidden md:flex" : "flex"
          }`}
        >
          <img
            src="/images/logo_panda_blue.png"
            alt="Blue Panda"
            width={48}
            height={48}
            className="w-12 h-12 rounded-2xl mb-3 shadow-md"
          />
          <h2 className="text-2xl font-extrabold mb-1 text-slate-900">
            Create Account
          </h2>
          <p className="text-xs text-slate-400 mb-6">
            Join Blue Panda on Web & Mobile App
          </p>

          {errorMessage && !isLogin && (
            <div className="w-full max-w-xs mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl">
              {errorMessage}
            </div>
          )}

          <form className="w-full space-y-3.5 max-w-xs" onSubmit={handleSubmit}>
            <div className="relative">
              <input
                type="text"
                autoComplete="name"
                value={name}
                placeholder="Full Name"
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl py-3 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white transition"
                required={!isLogin}
              />
              <span className="absolute right-3 top-3 text-gray-400">
                <IoPersonSharp size={18} />
              </span>
            </div>

            <div className="relative">
              <input
                type="email"
                autoComplete="email"
                value={email}
                placeholder="email@example.com"
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl py-3 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white transition"
                required
              />
              <span className="absolute right-3 top-3 text-gray-400">
                <MdOutlineEmail size={18} />
              </span>
            </div>

            <div className="relative">
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                placeholder="Password (min 6 chars)"
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl py-3 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white transition"
                required
              />
              <span className="absolute right-3 top-3 text-gray-400">
                <FaLock size={16} />
              </span>
            </div>

            <div className="relative">
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                placeholder="Confirm Password"
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl py-3 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white transition"
                required={!isLogin}
              />
              <span className="absolute right-3 top-3 text-gray-400">
                <FaLock size={16} />
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-bold rounded-xl py-3 mt-2 hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Create My Account"
              )}
            </button>

            <p className="mt-4 text-center text-sm text-gray-600 md:hidden">
              Already have an account?{" "}
              <button
                type="button"
                onClick={switchToLogin}
                className="text-blue-600 font-bold hover:underline"
              >
                Sign in here
              </button>
            </p>
          </form>
        </div>

        {/* ========== LOGIN SIDE ========== */}
        <div
          className={`w-full md:w-1/2 p-8 sm:p-10 flex flex-col justify-center items-center ${
            isLogin ? "flex" : "hidden md:flex"
          }`}
        >
          <img
            src="/images/logo_panda_blue.png"
            alt="Blue Panda"
            width={48}
            height={48}
            className="w-12 h-12 rounded-2xl mb-3 shadow-md"
          />
          <h2 className="text-2xl font-extrabold mb-1 text-slate-900">
            Sign In
          </h2>
          <p className="text-xs text-slate-400 mb-5">
            Access your orders, wishlist & rewards
          </p>

          {errorMessage && isLogin && (
            <div className="w-full max-w-xs mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl">
              {errorMessage}
            </div>
          )}

          <form className="w-full space-y-3.5 max-w-xs" onSubmit={handleSubmit}>
            <div className="relative">
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl py-3 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white transition"
                required
              />
              <span className="absolute right-3 top-3 text-gray-400">
                <MdOutlineEmail size={18} />
              </span>
            </div>

            <div className="relative">
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl py-3 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white transition"
                required
              />
              <span className="absolute right-3 top-3 text-gray-400">
                <FaLock size={16} />
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-bold rounded-xl py-3 mt-2 hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Sign In"
              )}
            </button>

            {/* Quick Demo Fill Pills */}
            <div className="pt-3 border-t border-slate-100">
              <p className="text-[11px] font-bold text-slate-400 text-center mb-2">
                Quick Demo Accounts
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    fillDemoAccount("customer@ecommerce.com", "password123")
                  }
                  className="py-1.5 px-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-extrabold transition cursor-pointer"
                >
                  Customer
                </button>
                <button
                  type="button"
                  onClick={() =>
                    fillDemoAccount("seller@ecommerce.com", "seller123")
                  }
                  className="py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-extrabold transition cursor-pointer"
                >
                  Seller
                </button>
                <button
                  type="button"
                  onClick={() =>
                    fillDemoAccount("admin@ecommerce.com", "admin123")
                  }
                  className="py-1.5 px-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-extrabold transition cursor-pointer"
                >
                  Admin
                </button>
              </div>
            </div>

            <p className="mt-4 text-center text-sm text-gray-600 md:hidden">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={switchToRegister}
                className="text-blue-600 font-bold hover:underline"
              >
                Register here
              </button>
            </p>
          </form>
        </div>

        {/* ========== SLIDING COBALT PANEL ========== */}
        <div
          className={`hidden md:flex absolute top-0 left-0 w-1/2 h-full bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-950 p-12 flex-col justify-center items-center text-white z-10 transition-all duration-700 ease-in-out ${
            isLogin
              ? "translate-x-0 rounded-r-[80px]"
              : "translate-x-full rounded-l-[80px]"
          }`}
        >
          {isLogin ? (
            <div className="flex flex-col items-center">
              <h2 className="text-3xl font-extrabold mb-3 tracking-tight text-center">
                Welcome Back!
              </h2>
              <p className="text-center text-sm text-blue-100 mb-8 max-w-xs leading-relaxed">
                New to Blue Panda? Create an account to unlock 10% OFF with code
                WELCOME10 and sync with our mobile app.
              </p>
              <button
                type="button"
                onClick={switchToRegister}
                className="border-2 border-white/80 rounded-xl px-10 py-2.5 text-sm font-extrabold hover:bg-white hover:text-blue-700 transition-colors cursor-pointer"
              >
                Create Account
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <h2 className="text-3xl font-extrabold mb-3 tracking-tight text-center">
                Hello, Shopper!
              </h2>
              <p className="text-center text-sm text-blue-100 mb-8 max-w-xs leading-relaxed">
                Already have an account from our mobile app or store? Sign in to
                sync your bag and orders.
              </p>
              <button
                type="button"
                onClick={switchToLogin}
                className="border-2 border-white/80 rounded-xl px-10 py-2.5 text-sm font-extrabold hover:bg-white hover:text-blue-700 transition-colors cursor-pointer"
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthForm({ mode }: AuthFormProps) {
  return (
    <Suspense
      fallback={
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      }
    >
      <AuthFormInner mode={mode} />
    </Suspense>
  );
}
