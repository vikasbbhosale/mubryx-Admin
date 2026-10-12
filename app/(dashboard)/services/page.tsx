"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Layers, 
  Search, 
  Clock, 
  Star, 
  X, 
  Edit3, 
  Power, 
  Sparkles, 
  Loader2, 
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  FolderTree,
  ShieldAlert,
  SlidersHorizontal,
  ChevronRight,
  PauseCircle,
  PlayCircle
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CaseDrawer } from '@/components/ui/CaseDrawer';
import { queryClient } from '@/lib/query-client';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  placement?: string;
  displayOrder?: number;
  _count?: {
    Service: number;
    subCategories: number;
  };
}

interface SubCategory {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  displayOrder?: number;
  category?: {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
  };
  _count?: {
    services: number;
  };
}

interface ServiceItem {
  id: string;
  categoryId: string;
  subCategoryId?: string | null;
  title: string;
  description: string;
  price: number;
  discountPrice: number | null;
  rating: number;
  reviewCount: number;
  duration: string;
  image: string | null;
  features: string[];
  isActive: boolean;
  isPopular: boolean;
  tag: string | null;
  Category?: {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
  };
  subCategory?: {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
  } | null;
}

const getCategoriesCacheKey = () => 'catalog:categories:all';
const getSubCategoriesCacheKey = (catId: string) => `catalog:subcategories:${catId}`;
const getServicesCacheKey = (catId: string, subCatId: string, search: string) =>
  `catalog:services:${catId}:${subCatId}:${search.trim().toLowerCase()}`;

export default function ServicesPage() {
  // Filters & Navigation state
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DISABLED'>('ALL');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Cache-First Initializations
  const [categories, setCategories] = useState<Category[]>(() => {
    const cached = queryClient.getQueryData<Category[]>(getCategoriesCacheKey());
    return Array.isArray(cached) ? cached : [];
  });

  const [subCategories, setSubCategories] = useState<SubCategory[]>(() => {
    const cached = queryClient.getQueryData<SubCategory[]>(getSubCategoriesCacheKey('ALL'));
    return Array.isArray(cached) ? cached : [];
  });

  const [services, setServices] = useState<ServiceItem[]>(() => {
    const cached = queryClient.getQueryData<ServiceItem[]>(getServicesCacheKey('ALL', 'ALL', ''));
    return Array.isArray(cached) ? cached : [];
  });

  const [loading, setLoading] = useState<boolean>(() => {
    const hasCats = Boolean(queryClient.getQueryData(getCategoriesCacheKey()));
    const hasServs = Boolean(queryClient.getQueryData(getServicesCacheKey('ALL', 'ALL', '')));
    return !(hasCats && hasServs);
  });

  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Status Toggling indicators
  const [togglingCategory, setTogglingCategory] = useState<string | null>(null);
  const [togglingSubCategory, setTogglingSubCategory] = useState<string | null>(null);
  const [togglingService, setTogglingService] = useState<string | null>(null);

  // Toast feedback
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Drawer Editing
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editDiscountPrice, setEditDiscountPrice] = useState<string>('');
  const [editDuration, setEditDuration] = useState('');
  const [editIsPopular, setEditIsPopular] = useState(false);
  const [editIsActive, setEditIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // When changing category, reset subcategory selection to ALL
  const handleSelectCategory = (catId: string) => {
    setSelectedCategory(catId);
    setSelectedSubCategory('ALL');
  };

  // Primary Data Fetcher adhering to Cache-First SWR
  const loadData = useCallback(async (options: { silent?: boolean; forceRefresh?: boolean; signal?: AbortSignal } = {}) => {
    const { silent = false, forceRefresh = false, signal } = options;

    const catKey = getCategoriesCacheKey();
    const subCatKey = getSubCategoriesCacheKey(selectedCategory);
    const servKey = getServicesCacheKey(selectedCategory, selectedSubCategory, search);

    const hasCats = !!queryClient.getQueryData(catKey);
    const hasServs = !!queryClient.getQueryData(servKey);

    if (!silent && (!hasCats || !hasServs)) {
      setLoading(true);
    }
    setRefreshing(true);
    setError(null);

    try {
      // 1. Fetch Categories
      const categoriesPromise = queryClient.fetchQuery<Category[]>(
        catKey,
        async (sig) => {
          const res = await fetch('/api/categories', { signal: sig });
          if (!res.ok) throw new Error('Failed to fetch categories');
          const data = await res.json().catch(() => []);
          return Array.isArray(data) ? data : [];
        },
        { staleTime: 45000, forceRefresh, signal }
      );

      // 2. Fetch Subcategories (for selected category or all)
      const subCategoriesPromise = queryClient.fetchQuery<SubCategory[]>(
        subCatKey,
        async (sig) => {
          const url = selectedCategory !== 'ALL'
            ? `/api/subcategories?categoryId=${encodeURIComponent(selectedCategory)}`
            : '/api/subcategories';
          const res = await fetch(url, { signal: sig });
          if (!res.ok) return [];
          const data = await res.json().catch(() => []);
          return Array.isArray(data) ? data : [];
        },
        { staleTime: 45000, forceRefresh, signal }
      );

      // 3. Fetch Services with pagination limit 100
      const servicesPromise = queryClient.fetchQuery<ServiceItem[]>(
        servKey,
        async (sig) => {
          const params = new URLSearchParams();
          if (selectedCategory !== 'ALL') params.set('categoryId', selectedCategory);
          if (selectedSubCategory !== 'ALL') params.set('subCategoryId', selectedSubCategory);
          if (search.trim()) params.set('search', search.trim());
          params.set('page', '1');
          params.set('limit', '100');

          const res = await fetch(`/api/services?${params.toString()}`, { signal: sig });
          if (!res.ok) throw new Error('Failed to fetch services');
          const data = await res.json().catch(() => []);
          return Array.isArray(data) ? data : [];
        },
        { staleTime: 30000, forceRefresh, signal }
      );

      // Parallel execution of independent queries
      const [fetchedCats, fetchedSubCats, fetchedServices] = await Promise.all([
        categoriesPromise,
        subCategoriesPromise,
        servicesPromise,
      ]);

      setCategories(fetchedCats);
      setSubCategories(fetchedSubCats);
      setServices(fetchedServices);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      console.error('Error fetching catalog data:', err);
      setError(err?.message || 'Failed to load catalog offerings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, selectedSubCategory, search]);

  // Subscribe to changes & handle cleanup
  useEffect(() => {
    const controller = new AbortController();
    loadData({ signal: controller.signal });
    return () => {
      controller.abort();
    };
  }, [loadData]);

  // Handle Search input submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleSearchClear = () => {
    setSearchInput('');
    setSearch('');
  };

  // ==========================================
  // SUPER ADMIN CONTROLS: CATEGORY
  // ==========================================
  const handleToggleCategory = async (category: Category) => {
    if (togglingCategory === category.id) return;
    const newStatus = !(category.isActive !== false);
    setTogglingCategory(category.id);

    // Optimistic UI update
    setCategories(prev =>
      prev.map(c => (c.id === category.id ? { ...c, isActive: newStatus } : c))
    );

    try {
      const res = await fetch(`/api/categories/${category.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Rollback
        setCategories(prev =>
          prev.map(c => (c.id === category.id ? { ...c, isActive: category.isActive } : c))
        );
        setToast({
          type: 'error',
          message: data?.message || `Failed to update status for category "${category.name}"`,
        });
      } else {
        queryClient.invalidateQueriesByPrefix('catalog:');
        setToast({
          type: 'success',
          message: `Category "${category.name}" is now ${newStatus ? 'ACTIVE (Live in marketplace)' : 'PAUSED (Hidden from customers)'}.`,
        });
      }
    } catch (err: any) {
      setCategories(prev =>
        prev.map(c => (c.id === category.id ? { ...c, isActive: category.isActive } : c))
      );
      setToast({
        type: 'error',
        message: err?.message || `Failed to update category status`,
      });
    } finally {
      setTogglingCategory(null);
    }
  };

  // ==========================================
  // SUPER ADMIN CONTROLS: SUBCATEGORY
  // ==========================================
  const handleToggleSubCategory = async (subCategory: SubCategory) => {
    if (togglingSubCategory === subCategory.id) return;
    const newStatus = !(subCategory.isActive !== false);
    setTogglingSubCategory(subCategory.id);

    // Optimistic update
    setSubCategories(prev =>
      prev.map(s => (s.id === subCategory.id ? { ...s, isActive: newStatus } : s))
    );

    try {
      const res = await fetch(`/api/subcategories/${subCategory.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Rollback
        setSubCategories(prev =>
          prev.map(s => (s.id === subCategory.id ? { ...s, isActive: subCategory.isActive } : s))
        );
        setToast({
          type: 'error',
          message: data?.message || `Failed to update subcategory "${subCategory.name}"`,
        });
      } else {
        queryClient.invalidateQueriesByPrefix('catalog:');
        setToast({
          type: 'success',
          message: `Subcategory "${subCategory.name}" is now ${newStatus ? 'ACTIVE (Live)' : 'PAUSED (Hidden)'}.`,
        });
      }
    } catch (err: any) {
      setSubCategories(prev =>
        prev.map(s => (s.id === subCategory.id ? { ...s, isActive: subCategory.isActive } : s))
      );
      setToast({
        type: 'error',
        message: err?.message || `Failed to update subcategory status`,
      });
    } finally {
      setTogglingSubCategory(null);
    }
  };

  // ==========================================
  // SUPER ADMIN CONTROLS: INDIVIDUAL SERVICE
  // ==========================================
  const handleToggleService = async (service: ServiceItem) => {
    if (togglingService === service.id) return;
    const newStatus = !service.isActive;
    setTogglingService(service.id);

    // Optimistic update
    setServices(prev =>
      prev.map(s => (s.id === service.id ? { ...s, isActive: newStatus } : s))
    );

    try {
      const res = await fetch(`/api/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Rollback
        setServices(prev =>
          prev.map(s => (s.id === service.id ? { ...s, isActive: service.isActive } : s))
        );
        setToast({
          type: 'error',
          message: data?.message || `Failed to update status for "${service.title}"`,
        });
      } else {
        queryClient.invalidateQueriesByPrefix('catalog:services:');
        setToast({
          type: 'success',
          message: `"${service.title}" is now ${newStatus ? 'enabled & live' : 'disabled & paused'}.`,
        });
      }
    } catch (err: any) {
      setServices(prev =>
        prev.map(s => (s.id === service.id ? { ...s, isActive: service.isActive } : s))
      );
      setToast({
        type: 'error',
        message: err?.message || `Failed to update service status`,
      });
    } finally {
      setTogglingService(null);
    }
  };

  // Drawer Modal Editing
  const openEditDrawer = (service: ServiceItem) => {
    setEditingService(service);
    setEditPrice(service.price);
    setEditDiscountPrice(service.discountPrice ? service.discountPrice.toString() : '');
    setEditDuration(service.duration);
    setEditIsPopular(service.isPopular);
    setEditIsActive(service.isActive);
  };

  const handleSaveEdit = async () => {
    if (!editingService) return;
    try {
      setSaving(true);
      const res = await fetch(`/api/services/${editingService.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: Number(editPrice),
          discountPrice: editDiscountPrice ? Number(editDiscountPrice) : null,
          duration: editDuration,
          isPopular: editIsPopular,
          isActive: editIsActive,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        const updated = data?.service || data?.data;
        if (updated) {
          setServices(prev =>
            prev.map(s => (s.id === editingService.id ? { ...s, ...updated } : s))
          );
        }
        queryClient.invalidateQueriesByPrefix('catalog:services:');
        setEditingService(null);
        setToast({
          type: 'success',
          message: `Service SKU "${editingService.title}" successfully updated.`,
        });
      } else {
        setToast({
          type: 'error',
          message: data?.message || 'Failed to update service SKU details',
        });
      }
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err?.message || 'Failed to update service',
      });
    } finally {
      setSaving(false);
    }
  };

  // Computations
  const safeCategories = useMemo(() => Array.isArray(categories) ? categories : [], [categories]);
  const safeSubCategories = useMemo(() => Array.isArray(subCategories) ? subCategories : [], [subCategories]);
  const safeServices = useMemo(() => Array.isArray(services) ? services : [], [services]);

  const activeCategoryObj = useMemo(() => {
    if (selectedCategory === 'ALL') return null;
    return safeCategories.find(c => c.id === selectedCategory) || null;
  }, [safeCategories, selectedCategory]);

  const activeSubCategoryObj = useMemo(() => {
    if (selectedSubCategory === 'ALL') return null;
    return safeSubCategories.find(s => s.id === selectedSubCategory) || null;
  }, [safeSubCategories, selectedSubCategory]);

  const totalMasterServices = safeServices.length;
  const activeMasterServices = safeServices.filter(s => s.isActive).length;
  const disabledMasterServices = totalMasterServices - activeMasterServices;

  const displayedServices = useMemo(() => {
    return safeServices.filter(s => {
      if (statusFilter === 'ACTIVE') return s.isActive;
      if (statusFilter === 'DISABLED') return !s.isActive;
      return true;
    });
  }, [safeServices, statusFilter]);

  // Find the Cleaning Services category for special badge/counter
  const cleaningCategory = useMemo(() => {
    return safeCategories.find(c => c.name.toLowerCase().includes('clean'));
  }, [safeCategories]);

  return (
    <div className="space-y-4 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Catalog & Service Offerings</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              {totalMasterServices} SKUs Loaded ({activeMasterServices} Live)
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Super Admin Control Enabled
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time catalog orchestration. Super Admins can pause or resume entire categories, subcategories, or individual service SKUs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData({ forceRefresh: true })}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors shadow-xs cursor-pointer text-xs font-medium"
            title="Revalidate & Refresh from backend"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-500' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Sync Catalog'}</span>
          </button>
        </div>
      </div>

      {/* Toast Notification Banner */}
      {toast && (
        <div
          className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
          <button
            onClick={() => setToast(null)}
            className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded cursor-pointer transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-center justify-between text-xs text-rose-700 dark:text-rose-400">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => loadData({ forceRefresh: true })}
            className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-medium text-[11px] transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Category Pills Bar with Active State Indicators */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <span>Service Categories ({safeCategories.length})</span>
          {activeCategoryObj && (
            <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-mono normal-case">
              Active Selection: {activeCategoryObj.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 custom-scrollbar text-xs">
          <button
            onClick={() => handleSelectCategory('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
              selectedCategory === 'ALL'
                ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                : 'bg-white dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            All Domains ({safeCategories.reduce((acc, c) => acc + (c._count?.Service || 0), 0)})
          </button>

          {safeCategories.map((cat) => {
            const isCatActive = cat.isActive !== false;
            const isSelected = selectedCategory === cat.id;
            const isCleaning = cat.id === cleaningCategory?.id;

            return (
              <div key={cat.id} className="relative flex items-center group">
                <button
                  onClick={() => handleSelectCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border flex items-center gap-2 ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                      : isCatActive
                      ? 'bg-white dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                      : 'bg-rose-50/70 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-300/40 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isCatActive ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'
                    }`}
                    title={isCatActive ? 'Category Active' : 'Category Paused / Stopped'}
                  />
                  <span>{cat.name}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : isCleaning
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {cat._count?.Service ?? 0}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Category Control Banner (Super Admin Pause / Resume Category) */}
      {activeCategoryObj && (
        <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs transition-all ${
          activeCategoryObj.isActive !== false
            ? 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
            : 'bg-rose-50/90 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900/60'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              activeCategoryObj.isActive !== false
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
            }`}>
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {activeCategoryObj.name}
                </h2>
                <StatusBadge status={activeCategoryObj.isActive !== false ? 'ACTIVE' : 'SUSPENDED'} size="sm" />
                {activeCategoryObj.id === cleaningCategory?.id && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    Cleaning Catalog Master
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {activeCategoryObj.isActive !== false
                  ? `Category is live. Contains ${activeCategoryObj._count?.subCategories || safeSubCategories.length} subcategories and ${activeCategoryObj._count?.Service || 0} catalog SKUs.`
                  : '⚠️ Category is PAUSED by Super Admin. All services under this domain are hidden from customers on the app.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* Super Admin Stop / Start Category Button */}
            <button
              onClick={() => handleToggleCategory(activeCategoryObj)}
              disabled={togglingCategory === activeCategoryObj.id}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border disabled:opacity-50 disabled:cursor-not-allowed shadow-xs ${
                activeCategoryObj.isActive !== false
                  ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-700'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
              }`}
            >
              {togglingCategory === activeCategoryObj.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : activeCategoryObj.isActive !== false ? (
                <PauseCircle className="w-3.5 h-3.5" />
              ) : (
                <PlayCircle className="w-3.5 h-3.5" />
              )}
              <span>
                {togglingCategory === activeCategoryObj.id
                  ? 'Updating...'
                  : activeCategoryObj.isActive !== false
                  ? 'Stop / Pause Category'
                  : 'Resume / Activate Category'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Subcategories Bar (Crucial for Cleaning Services with 18 subcategories!) */}
      {safeSubCategories.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold">
              <FolderTree className="w-3.5 h-3.5 text-blue-500" />
              <span>
                Subcategories for {activeCategoryObj ? activeCategoryObj.name : 'All Domains'} ({safeSubCategories.length})
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Super Admin can stop any subcategory using the toggle switch
            </span>
          </div>

          {/* Subcategories Pills & Actions */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs">
            <button
              onClick={() => setSelectedSubCategory('ALL')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                selectedSubCategory === 'ALL'
                  ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 border-slate-700'
                  : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              All Subcategories ({safeSubCategories.reduce((acc, s) => acc + (s._count?.services || 0), 0)})
            </button>

            {safeSubCategories.map((sub) => {
              const isSubActive = sub.isActive !== false;
              const isSelected = selectedSubCategory === sub.id;

              return (
                <div
                  key={sub.id}
                  className={`flex items-center rounded-lg border text-xs whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 shadow-2xs'
                      : isSubActive
                      ? 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      : 'bg-rose-50 dark:bg-rose-950/20 border-rose-300/60 dark:border-rose-900/40 text-rose-700 dark:text-rose-400'
                  }`}
                >
                  <button
                    onClick={() => setSelectedSubCategory(sub.id)}
                    className="px-2.5 py-1.5 flex items-center gap-1.5 cursor-pointer font-medium"
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSubActive ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                    <span>{sub.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ({sub._count?.services ?? 0})
                    </span>
                  </button>

                  {/* Super Admin Inline Subcategory Pause/Start Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSubCategory(sub);
                    }}
                    disabled={togglingSubCategory === sub.id}
                    title={isSubActive ? `Stop subcategory: ${sub.name}` : `Activate subcategory: ${sub.name}`}
                    className={`px-1.5 py-1 mr-1 rounded text-[10px] font-bold cursor-pointer transition-colors border ${
                      isSubActive
                        ? 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20'
                    }`}
                  >
                    {togglingSubCategory === sub.id ? (
                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                    ) : isSubActive ? (
                      'Stop'
                    ) : (
                      'Resume'
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search and Quick Filters Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search service title or description... (Press Enter)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md pl-9 pr-8 py-1.5 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          {searchInput && (
            <button
              type="button"
              onClick={handleSearchClear}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        <div className="flex items-center gap-2 flex-wrap justify-between md:justify-end">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px]">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              All ({totalMasterServices})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'ACTIVE'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Live ({activeMasterServices})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('DISABLED')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'DISABLED'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-2xs'
                  : 'text-slate-500 hover:text-rose-600 dark:hover:text-rose-400'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Stopped / Disabled ({disabledMasterServices})
            </button>
          </div>
        </div>
      </div>

      {/* Services Grid (Cache-first: Previous data kept during background revalidation!) */}
      {loading && displayedServices.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-16 flex flex-col items-center justify-center gap-3 shadow-xs">
          <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
          <span className="text-xs text-slate-500">Loading catalog offerings...</span>
        </div>
      ) : displayedServices.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-16 text-center shadow-xs">
          <Layers className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-2 opacity-50" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {statusFilter === 'ALL'
              ? 'No Catalog Services Found'
              : statusFilter === 'ACTIVE'
              ? 'No Active Services Found'
              : 'No Disabled Services Found'}
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Try adjusting your search terms or selecting a different status/category/subcategory filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayedServices.map((service) => {
            const isServiceLive = service.isActive;
            const categoryActive = service.Category?.isActive !== false;
            const subCategoryActive = service.subCategory ? service.subCategory.isActive !== false : true;

            return (
              <div
                key={service.id}
                className={`bg-white dark:bg-slate-900 rounded-xl border transition-all p-3.5 flex flex-col justify-between shadow-xs ${
                  isServiceLive && categoryActive && subCategoryActive
                    ? 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    : 'border-rose-200/60 dark:border-rose-900/40 bg-slate-50/50 dark:bg-slate-950/40 opacity-75'
                }`}
              >
                <div>
                  {/* Header Tag Bar */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {service.Category?.name || 'General'}
                      </span>
                      {service.subCategory && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          {service.subCategory.name}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {service.isPopular && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <Sparkles className="w-2.5 h-2.5 text-amber-500 dark:text-amber-400" />
                          Popular
                        </span>
                      )}
                      <StatusBadge status={isServiceLive ? 'ACTIVE' : 'SUSPENDED'} />
                    </div>
                  </div>

                  {/* Warning if parent Category or Subcategory is paused */}
                  {(!categoryActive || !subCategoryActive) && (
                    <div className="mb-2 p-1.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] flex items-center gap-1 font-medium">
                      <ShieldAlert className="w-3 h-3 shrink-0" />
                      <span>
                        Parent {!categoryActive ? 'Category' : 'Subcategory'} is stopped by Super Admin.
                      </span>
                    </div>
                  )}

                  {/* Title and Description */}
                  <h3 className="font-bold text-slate-900 dark:text-white text-xs leading-snug">
                    {service.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-1 line-clamp-2 leading-relaxed">
                    {service.description}
                  </p>

                  {/* Duration & Rating */}
                  <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                      <span>{service.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-500 dark:text-amber-400 fill-amber-500 dark:fill-amber-400" />
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {service.rating ? service.rating.toFixed(1) : '4.8'}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                        ({service.reviewCount || 0})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pricing & Management Controls */}
                <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline gap-1.5 font-mono">
                      <span className="text-base font-bold text-slate-900 dark:text-white">
                        ₹{service.discountPrice || service.price}
                      </span>
                      {service.discountPrice && (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 line-through">
                          ₹{service.price}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Edit Pricing Button */}
                    <button
                      onClick={() => openEditDrawer(service)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-xs"
                      title="Edit Pricing & Duration"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>

                    {/* Super Admin Stop / Start Service Toggle Switch */}
                    <button
                      onClick={() => handleToggleService(service)}
                      disabled={togglingService === service.id}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer border disabled:opacity-50 disabled:cursor-not-allowed ${
                        service.isActive
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border-rose-500/30'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30'
                      }`}
                      title={service.isActive ? 'Super Admin: Click to disable service' : 'Super Admin: Click to enable service'}
                    >
                      {togglingService === service.id ? (
                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                      ) : (
                        <Power className="w-2.5 h-2.5" />
                      )}
                      {togglingService === service.id
                        ? 'Updating...'
                        : service.isActive
                        ? 'Disable'
                        : 'Enable'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Service CaseDrawer */}
      <CaseDrawer
        isOpen={Boolean(editingService)}
        onClose={() => setEditingService(null)}
        title="Configure Service SKU"
        subtitle={editingService?.title || ''}
        badge={editingService && <StatusBadge status={editIsActive ? 'ACTIVE' : 'SUSPENDED'} size="sm" />}
        actions={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              onClick={() => setEditingService(null)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg"
            >
              Cancel
            </button>
            <button
              disabled={saving}
              onClick={handleSaveEdit}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Changes
            </button>
          </div>
        }
      >
        {editingService && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-1">
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Category Domain</span>
              <p className="font-bold text-slate-900 dark:text-slate-200">
                {editingService.Category?.name || 'General Service'}
                {editingService.subCategory && ` / ${editingService.subCategory.name}`}
              </p>
            </div>

            {/* Availability / Status Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block text-xs">Marketplace Availability</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {editIsActive ? 'Service is live and visible to customers' : 'Service is disabled and hidden from marketplace'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditIsActive(!editIsActive)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                  editIsActive
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                }`}
              >
                <Power className="w-3 h-3" />
                {editIsActive ? 'Active' : 'Disabled'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Base Price (₹) *
                </label>
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Discount Price (₹)
                </label>
                <input
                  type="number"
                  placeholder="Optional"
                  value={editDiscountPrice}
                  onChange={(e) => setEditDiscountPrice(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Estimated Turnaround Duration
              </label>
              <input
                type="text"
                value={editDuration}
                onChange={(e) => setEditDuration(e.target.value)}
                placeholder="e.g. 45 mins, 2 hours"
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={editIsPopular}
                  onChange={(e) => setEditIsPopular(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-0"
                />
                <span>Highlight as "Featured / Popular" on customer marketplace</span>
              </label>
            </div>
          </div>
        )}
      </CaseDrawer>
    </div>
  );
}
