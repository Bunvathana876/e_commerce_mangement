"use client";

import { STOREFRONT_URL } from "@/lib/config";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Package,
  Search,
  Filter,
  PlusCircle,
  RefreshCw,
  ExternalLink,
  Edit3,
  Clock,
  ShieldAlert,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Boxes,
  X,
  Tag,
} from "lucide-react";
import {
  sellerProductsApi,
  sellerMeApi,
  categoriesApi,
  type ApiProduct,
  type ApiCategory,
  type ApiSeller,
} from "@/lib/api";
import { getAccessToken, isTokenExpired, logout } from "@/lib/auth";

const STATUS_FILTERS = [
  { label: "All Products", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive / Draft", value: "inactive" },
  { label: "Low Stock", value: "low_stock" },
  { label: "Out of Stock", value: "out_of_stock" },
];

export default function SellerProductsPage() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [seller, setSeller] = useState<ApiSeller | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Session verification
  const checkSession = useCallback((): boolean => {
    const token = getAccessToken();
    if (!token || isTokenExpired(token)) {
      logout();
      window.location.href = `/login?redirect=${encodeURIComponent("/seller/products")}&expired=true`;
      return false;
    }
    return true;
  }, []);

  // Fetch initial metadata (seller profile & categories)
  useEffect(() => {
    if (!checkSession()) return;

    let isMounted = true;
    const fetchMetadata = async () => {
      try {
        const [sellerRes, catRes] = await Promise.allSettled([
          sellerMeApi.getStore(),
          categoriesApi.list(),
        ]);

        if (isMounted) {
          if (sellerRes.status === "fulfilled" && sellerRes.value.success) {
            setSeller(sellerRes.value.data);
          }
          if (catRes.status === "fulfilled" && catRes.value.success) {
            setCategories(catRes.value.data || []);
          }
        }
      } catch {
        // Handled silently; primary data load handles errors
      }
    };

    fetchMetadata();
    return () => {
      isMounted = false;
    };
  }, [checkSession]);

  // Fetch products from backend
  const loadProducts = useCallback(async () => {
    if (!checkSession()) return;

    setLoading(true);
    setError(null);

    try {
      const categoryIdParam =
        selectedCategory !== "all" ? Number(selectedCategory) : undefined;
      const statusParam = selectedStatus !== "all" ? selectedStatus : undefined;

      const response = await sellerProductsApi.list({
        page,
        limit,
        search: searchQuery.trim() || undefined,
        category_id: categoryIdParam,
        status: statusParam,
      });

      if (response && response.success && response.data) {
        setProducts(response.data.items || []);
        setTotal(response.data.total || 0);
        setTotalPages(response.data.total_pages || 1);
      } else {
        setError(response?.message || "Failed to retrieve products from backend.");
      }
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("401") || msg.toLowerCase().includes("token")) {
        logout();
        window.location.href = `/login?redirect=${encodeURIComponent("/seller/products")}&expired=true`;
      } else {
        setError(
          msg ||
            "Unable to connect to backend server. Please verify your connection."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [checkSession, page, limit, searchQuery, selectedCategory, selectedStatus]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchQuery(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchQuery("");
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedStatus("all");
    setPage(1);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Product Catalog
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
              {total} {total === 1 ? "Product" : "Products"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage your store&apos;s product inventory, visibility status, and catalog listings
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadProducts}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-2xs disabled:opacity-50"
            title="Refresh Catalog"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>

          {/* Add Product Button (Disabled for Task C.1, implemented in Task C.2) */}
          <div className="relative group">
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-400 border border-slate-200 text-xs font-bold cursor-not-allowed transition"
            >
              <PlusCircle size={15} />
              <span>Add Product</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                Phase C.2
              </span>
            </button>
            <div className="absolute right-0 top-full mt-1.5 hidden group-hover:block z-20 whitespace-nowrap px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[11px] shadow-lg">
              Product creation form will be enabled in Task C.2
            </div>
          </div>
        </div>
      </div>

      {/* Account Status Alerts */}
      {seller?.status === "Pending" && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3.5 text-amber-900 shadow-2xs">
          <Clock size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-amber-950">
              Account Status: Pending Administrator Approval
            </p>
            <p className="text-amber-800 leading-relaxed">
              Your merchant account is currently in review. Products in your catalog are in preview mode and cannot be purchased by customers until your store is approved.
            </p>
          </div>
        </div>
      )}

      {seller?.status === "Suspended" && (
        <div className="p-4 sm:p-5 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3.5 text-red-900 shadow-2xs">
          <ShieldAlert size={18} className="text-red-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-red-950">
              Account Status: Store Suspended
            </p>
            <p className="text-red-800 leading-relaxed">
              Your merchant store has been suspended. All product listings are currently suppressed from the public customer storefront. Contact support@bluepanda.com for assistance.
            </p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
          {STATUS_FILTERS.map((tab) => {
            const active = selectedStatus === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  setSelectedStatus(tab.value);
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  active
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search & Category Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input Form */}
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex-1 flex items-center"
          >
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search size={15} />
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products by title or description..."
              className="w-full pl-10 pr-20 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-14 text-slate-400 hover:text-slate-600 p-1"
                title="Clear Search"
              >
                <X size={14} />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-xs"
            >
              Search
            </button>
          </form>

          {/* Category Dropdown Filter */}
          <div className="relative min-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Filter size={14} />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition appearance-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        /* Loading Skeleton */
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden divide-y divide-slate-100">
          <div className="p-4 bg-slate-50/60 flex items-center justify-between">
            <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 sm:p-5 flex items-center gap-4 animate-pulse">
              <div className="w-14 h-14 rounded-xl bg-slate-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 bg-slate-200 rounded" />
                <div className="h-3 w-32 bg-slate-100 rounded" />
              </div>
              <div className="hidden sm:block h-4 w-20 bg-slate-100 rounded" />
              <div className="h-4 w-16 bg-slate-200 rounded" />
              <div className="h-6 w-20 bg-slate-100 rounded-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        /* Error State */
        <div className="p-8 sm:p-12 rounded-3xl bg-white border border-red-200 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <AlertTriangle size={28} />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="text-base font-bold text-slate-900">
              Unable to Load Product Catalog
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">{error}</p>
          </div>
          <button
            type="button"
            onClick={loadProducts}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-600/20"
          >
            <RefreshCw size={14} />
            <span>Retry Loading</span>
          </button>
        </div>
      ) : products.length === 0 ? (
        /* Empty State */
        <div className="p-8 sm:p-14 rounded-3xl bg-white border border-slate-200 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto border border-slate-100">
            <Package size={32} />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="text-base font-bold text-slate-900">
              {searchQuery || selectedCategory !== "all" || selectedStatus !== "all"
                ? "No Products Found"
                : "Your Catalog is Empty"}
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              {searchQuery || selectedCategory !== "all" || selectedStatus !== "all"
                ? "No products matched your active search query or filter criteria. Try broadening your filters."
                : "You haven't listed any products yet. Products will be created and cataloged here in Task C.2."}
            </p>
          </div>

          {searchQuery || selectedCategory !== "all" || selectedStatus !== "all" ? (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
            >
              <span>Reset Filters</span>
            </button>
          ) : null}
        </div>
      ) : (
        /* Product Table */
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Product</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Stock</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {products.map((product) => {
                  const numPrice = Number(product.price);
                  const numDiscount = product.discount_price
                    ? Number(product.discount_price)
                    : null;
                  const stockNum = product.stock;

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Product Thumbnail & Title */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3.5">
                          <div className="relative w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {product.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <Package size={20} className="text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0 max-w-xs sm:max-w-sm">
                            <h3 className="font-bold text-slate-900 truncate">
                              {product.name}
                            </h3>
                            <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                              SKU #{product.id}
                              {product.description
                                ? ` • ${product.description.slice(0, 40)}...`
                                : ""}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                          <Tag size={11} className="text-slate-400" />
                          <span>{product.category?.name || "Uncategorized"}</span>
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-4 px-4">
                        <div>
                          {numDiscount !== null && numDiscount < numPrice ? (
                            <div className="space-y-0.5">
                              <span className="font-bold text-emerald-600 block">
                                ${numDiscount.toFixed(2)}
                              </span>
                              <span className="text-[11px] text-slate-400 line-through block">
                                ${numPrice.toFixed(2)}
                              </span>
                            </div>
                          ) : (
                            <span className="font-bold text-slate-900">
                              ${numPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Stock Quantity */}
                      <td className="py-4 px-4">
                        <div>
                          {stockNum === 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                              Out of Stock
                            </span>
                          ) : stockNum < 10 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Low Stock ({stockNum})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              {stockNum} units
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Visibility Status */}
                      <td className="py-4 px-4">
                        {product.is_active ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400">
                            <span className="w-2 h-2 rounded-full bg-slate-300" />
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Storefront View Shortcut */}
                          {product.is_active ? (
                            <a
                              href={`${STOREFRONT_URL}/product/${product.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                              title="View on Public Storefront"
                            >
                              <ExternalLink size={15} />
                            </a>
                          ) : null}

                          {/* Edit Product (Disabled for Task C.1, implemented in Task C.2) */}
                          <button
                            type="button"
                            disabled
                            className="p-2 rounded-lg text-slate-300 cursor-not-allowed"
                            title="Product editing will be available in Task C.2"
                          >
                            <Edit3 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
              <div>
                Showing {(page - 1) * limit + 1} to{" "}
                {Math.min(page * limit, total)} of {total} products
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page <= 1 || loading}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft size={14} />
                  <span>Previous</span>
                </button>

                <span className="px-3 py-1.5 text-slate-700 font-bold">
                  Page {page} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page >= totalPages || loading}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
