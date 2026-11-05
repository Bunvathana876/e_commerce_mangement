"use client";

import { useEffect, useState, useCallback, useId } from "react";
import Link from "next/link";
import {
  Store,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
  RefreshCw,
  CheckCircle2,
  Save,
  RotateCcw,
  ExternalLink,
  Package,
  Star,
  DollarSign,
  Mail,
  Phone,
  MapPin,
  Image as ImageIcon,
  HelpCircle,
} from "lucide-react";
import { sellerMeApi, type ApiSeller } from "@/lib/api";
import { isTokenExpired, getAccessToken, logout } from "@/lib/auth";

interface FormErrors {
  name?: string;
  phone?: string;
  address?: string;
  description?: string;
  logo?: string;
}

export default function SellerStorePage() {
  const storeNameId = useId();
  const phoneId = useId();
  const addressId = useId();
  const logoId = useId();
  const descriptionId = useId();

  const [seller, setSeller] = useState<ApiSeller | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<{
    type: "not_found" | "network" | "unauthorized" | "generic";
    message: string;
  } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form fields
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    phone: "",
    address: "",
    logo: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isDirty, setIsDirty] = useState(false);

  // Check auth session
  const checkSession = useCallback((): boolean => {
    const token = getAccessToken();
    if (!token || isTokenExpired(token)) {
      logout();
      window.location.href = `/login?redirect=${encodeURIComponent("/seller/store")}&expired=true`;
      return false;
    }
    return true;
  }, []);

  // Fetch seller store profile
  const fetchStoreProfile = useCallback(async () => {
    if (!checkSession()) return;

    setLoading(true);
    setLoadError(null);
    setActionError(null);

    try {
      const response = await sellerMeApi.getStore();
      if (response && response.success && response.data) {
        const s = response.data;
        setSeller(s);
        setFormData({
          name: s.name || "",
          description: s.description || "",
          phone: s.phone || "",
          address: s.address || "",
          logo: s.logo || "",
        });
        setIsDirty(false);
        setErrors({});
      } else {
        setLoadError({
          type: "generic",
          message: response?.message || "Failed to load store information.",
        });
      }
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("404") || msg.toLowerCase().includes("not found")) {
        setLoadError({
          type: "not_found",
          message:
            "No merchant store profile is linked to this account. Please contact an administrator to complete your merchant onboarding.",
        });
      } else if (
        msg.includes("401") ||
        msg.toLowerCase().includes("unauthorized") ||
        msg.toLowerCase().includes("token")
      ) {
        logout();
        window.location.href = `/login?redirect=${encodeURIComponent("/seller/store")}&expired=true`;
      } else {
        setLoadError({
          type: "network",
          message:
            msg ||
            "Unable to connect to the backend server. Please verify your connection or try again.",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [checkSession]);

  useEffect(() => {
    fetchStoreProfile();
  }, [fetchStoreProfile]);

  // Form field change handler
  const handleChange = (
    field: keyof typeof formData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    setActionError(null);
    setSuccessMessage(null);

    // Clear inline error on change
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      newErrors.name = "Store name is required.";
    } else if (trimmedName.length < 2) {
      newErrors.name = "Store name must be at least 2 characters long.";
    } else if (trimmedName.length > 150) {
      newErrors.name = "Store name cannot exceed 150 characters.";
    }

    if (formData.phone && formData.phone.length > 50) {
      newErrors.phone = "Phone number cannot exceed 50 characters.";
    }

    if (formData.address && formData.address.length > 255) {
      newErrors.address = "Address cannot exceed 255 characters.";
    }

    if (formData.description && formData.description.length > 2000) {
      newErrors.description = "Store description cannot exceed 2,000 characters.";
    }

    if (formData.logo && formData.logo.length > 500) {
      newErrors.logo = "Logo URL cannot exceed 500 characters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Reset form to loaded seller state
  const handleReset = () => {
    if (!seller) return;
    setFormData({
      name: seller.name || "",
      description: seller.description || "",
      phone: seller.phone || "",
      address: seller.address || "",
      logo: seller.logo || "",
    });
    setErrors({});
    setIsDirty(false);
    setActionError(null);
    setSuccessMessage(null);
  };

  // Submit updates
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkSession()) return;

    if (!seller) return;

    if (seller.status !== "Active") {
      setActionError(
        seller.status === "Pending"
          ? "Store is pending administrator approval. Changes cannot be saved until approved."
          : "Store is suspended. Profile updates are disabled."
      );
      return;
    }

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setActionError(null);
    setSuccessMessage(null);

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        logo: formData.logo.trim() || undefined,
      };

      const res = await sellerMeApi.updateStore(payload);
      if (res && res.success && res.data) {
        setSeller(res.data);
        setFormData({
          name: res.data.name || "",
          description: res.data.description || "",
          phone: res.data.phone || "",
          address: res.data.address || "",
          logo: res.data.logo || "",
        });
        setIsDirty(false);
        setSuccessMessage("Store settings updated successfully.");
        // Auto-dismiss success message after 5 seconds
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setActionError(res?.message || "Failed to update store settings.");
      }
    } catch (err: any) {
      setActionError(
        err?.message || "An unexpected error occurred while saving changes."
      );
    } finally {
      setSaving(false);
    }
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse" />
        <div className="p-8 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-6 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-200" />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-40 bg-slate-200 rounded" />
              <div className="h-3 w-64 bg-slate-100 rounded" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            <div className="h-10 bg-slate-100 rounded-xl" />
            <div className="h-10 bg-slate-100 rounded-xl" />
            <div className="h-24 bg-slate-100 rounded-xl md:col-span-2" />
          </div>
        </div>
      </div>
    );
  }

  // 2. Load Error State (Missing store, network failure, etc.)
  if (loadError) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Store Profile
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your public merchant storefront information
          </p>
        </div>

        {loadError.type === "not_found" ? (
          <div className="p-8 sm:p-10 rounded-3xl bg-white border border-amber-200 shadow-sm text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <Store size={28} />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h2 className="text-lg font-bold text-slate-900">
                No Store Profile Linked
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                {loadError.message}
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={fetchStoreProfile}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
              >
                <RefreshCw size={14} />
                <span>Check Again</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 sm:p-10 rounded-3xl bg-white border border-red-200 shadow-sm text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle size={28} />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h2 className="text-lg font-bold text-slate-900">
                Unable to Load Store Profile
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                {loadError.message}
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={fetchStoreProfile}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-600/20"
              >
                <RefreshCw size={14} />
                <span>Retry Connection</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!seller) return null;

  const isApproved = seller.status === "Active";
  const isPending = seller.status === "Pending";
  const isSuspended = seller.status === "Suspended";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Store Profile & Settings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure your brand identity, customer contact channels, and store information
          </p>
        </div>

        {isApproved && (
          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs"
            >
              <span>View Public Store</span>
              <ExternalLink size={13} />
            </Link>
          </div>
        )}
      </div>

      {/* Account Status Banners */}
      {isPending && (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3.5 text-amber-900 shadow-2xs">
          <Clock size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm space-y-1">
            <p className="font-bold text-amber-950">
              Account Status: Pending Administrator Approval
            </p>
            <p className="text-amber-800 text-xs leading-relaxed">
              Your store registration has been submitted and is currently being reviewed by Blue Panda administrators. Store settings and catalog publishing will become fully active once your account is verified and approved.
            </p>
          </div>
        </div>
      )}

      {isSuspended && (
        <div className="p-5 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3.5 text-red-900 shadow-2xs">
          <ShieldAlert size={20} className="text-red-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm space-y-1">
            <p className="font-bold text-red-950">
              Account Status: Store Suspended
            </p>
            <p className="text-red-800 text-xs leading-relaxed">
              This merchant store is currently suspended. Product listings and profile modifications are disabled. Please contact Blue Panda merchant support at support@bluepanda.com to resolve your account status.
            </p>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-900 shadow-2xs transition-all">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span className="text-xs font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Action Error Notification */}
      {actionError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-900 shadow-2xs">
          <AlertTriangle size={18} className="text-red-600 shrink-0" />
          <span className="text-xs font-semibold">{actionError}</span>
        </div>
      )}

      {/* Store Overview Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
              {formData.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={formData.logo}
                  alt={formData.name || "Store logo"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              ) : (
                <Store size={32} className="text-slate-400" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  {seller.name}
                </h2>
                {isApproved && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                    <ShieldCheck size={12} />
                    Verified Store
                  </span>
                )}
                {isPending && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold">
                    <Clock size={12} />
                    Pending Approval
                  </span>
                )}
                {isSuspended && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-[11px] font-bold">
                    <ShieldAlert size={12} />
                    Suspended
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Owner: <span className="font-semibold text-slate-700">{seller.owner_name}</span> • ID: #{seller.id}
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 shrink-0">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <div className="flex items-center justify-center gap-1 text-amber-500 text-xs font-bold">
                <Star size={13} fill="currentColor" />
                <span>{Number(seller.rating || 5.0).toFixed(1)}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium uppercase mt-0.5 block">
                Rating
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <div className="flex items-center justify-center gap-1 text-blue-600 text-xs font-bold">
                <Package size={13} />
                <span>{seller.products_count ?? 0}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium uppercase mt-0.5 block">
                Products
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <div className="flex items-center justify-center gap-1 text-emerald-600 text-xs font-bold">
                <DollarSign size={13} />
                <span>{Number(seller.total_revenue || 0).toLocaleString()}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium uppercase mt-0.5 block">
                Revenue
              </span>
            </div>
          </div>
        </div>

        {/* Edit Store Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-400">
              Public Store Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Store Name */}
              <div className="space-y-1.5">
                <label
                  htmlFor={storeNameId}
                  className="text-xs font-bold text-slate-700 flex items-center justify-between"
                >
                  <span>Store Name <span className="text-red-500">*</span></span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {formData.name.length}/150
                  </span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Store size={15} />
                  </div>
                  <input
                    id={storeNameId}
                    type="text"
                    disabled={!isApproved || saving}
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="e.g. Apex Tech Accessories"
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition focus:outline-hidden ${
                      errors.name
                        ? "border-red-400 bg-red-50/20 text-red-900 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                        : "border-slate-200 bg-white text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    } ${!isApproved ? "bg-slate-50 text-slate-500 cursor-not-allowed" : ""}`}
                  />
                </div>
                {errors.name && (
                  <p className="text-[11px] font-semibold text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label
                  htmlFor={phoneId}
                  className="text-xs font-bold text-slate-700 flex items-center justify-between"
                >
                  <span>Customer Support Phone</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {formData.phone.length}/50
                  </span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone size={15} />
                  </div>
                  <input
                    id={phoneId}
                    type="text"
                    disabled={!isApproved || saving}
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="+855 12 345 678"
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition focus:outline-hidden ${
                      errors.phone
                        ? "border-red-400 bg-red-50/20 text-red-900 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                        : "border-slate-200 bg-white text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    } ${!isApproved ? "bg-slate-50 text-slate-500 cursor-not-allowed" : ""}`}
                  />
                </div>
                {errors.phone && (
                  <p className="text-[11px] font-semibold text-red-600">{errors.phone}</p>
                )}
              </div>

              {/* Address */}
              <div className="space-y-1.5 md:col-span-2">
                <label
                  htmlFor={addressId}
                  className="text-xs font-bold text-slate-700 flex items-center justify-between"
                >
                  <span>Store Physical Address</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {formData.address.length}/255
                  </span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <MapPin size={15} />
                  </div>
                  <input
                    id={addressId}
                    type="text"
                    disabled={!isApproved || saving}
                    value={formData.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    placeholder="Building, Street, District, City"
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition focus:outline-hidden ${
                      errors.address
                        ? "border-red-400 bg-red-50/20 text-red-900 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                        : "border-slate-200 bg-white text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    } ${!isApproved ? "bg-slate-50 text-slate-500 cursor-not-allowed" : ""}`}
                  />
                </div>
                {errors.address && (
                  <p className="text-[11px] font-semibold text-red-600">{errors.address}</p>
                )}
              </div>

              {/* Logo URL */}
              <div className="space-y-1.5 md:col-span-2">
                <label
                  htmlFor={logoId}
                  className="text-xs font-bold text-slate-700 flex items-center justify-between"
                >
                  <span>Store Logo URL</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {formData.logo.length}/500
                  </span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <ImageIcon size={15} />
                  </div>
                  <input
                    id={logoId}
                    type="url"
                    disabled={!isApproved || saving}
                    value={formData.logo}
                    onChange={(e) => handleChange("logo", e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition focus:outline-hidden ${
                      errors.logo
                        ? "border-red-400 bg-red-50/20 text-red-900 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                        : "border-slate-200 bg-white text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    } ${!isApproved ? "bg-slate-50 text-slate-500 cursor-not-allowed" : ""}`}
                  />
                </div>
                {errors.logo && (
                  <p className="text-[11px] font-semibold text-red-600">{errors.logo}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5 md:col-span-2">
                <label
                  htmlFor={descriptionId}
                  className="text-xs font-bold text-slate-700 flex items-center justify-between"
                >
                  <span>Store Bio & Description</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {formData.description.length}/2,000
                  </span>
                </label>
                <textarea
                  id={descriptionId}
                  rows={4}
                  disabled={!isApproved || saving}
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Describe your brand, return policies, warranty guarantees, and product focus..."
                  className={`w-full p-3.5 rounded-xl border text-xs sm:text-sm font-medium transition focus:outline-hidden ${
                    errors.description
                      ? "border-red-400 bg-red-50/20 text-red-900 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                      : "border-slate-200 bg-white text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  } ${!isApproved ? "bg-slate-50 text-slate-500 cursor-not-allowed" : ""}`}
                />
                {errors.description && (
                  <p className="text-[11px] font-semibold text-red-600">{errors.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Account Read-Only Metadata (Security & Trust) */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-400">
                Verified Account Details (Read-Only)
              </h3>
              <div className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                <HelpCircle size={12} />
                <span>Privileged administrative fields</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Registered Email
                </span>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <Mail size={14} className="text-slate-400" />
                  <span>{seller.email}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Owner Legal Full Name
                </span>
                <span className="text-xs font-semibold text-slate-700 block">
                  {seller.owner_name}
                </span>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div>
              {isDirty && isApproved && (
                <span className="text-xs text-amber-600 font-semibold">
                  You have unsaved changes.
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {isDirty && isApproved && (
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition disabled:opacity-50"
                >
                  <RotateCcw size={14} />
                  <span>Discard</span>
                </button>
              )}

              <button
                type="submit"
                disabled={!isApproved || !isDirty || saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
