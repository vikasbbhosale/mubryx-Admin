"use client";

import { useState, useEffect } from 'react';
import { 
  Layers, 
  Search, 
  Filter, 
  Clock, 
  Star, 
  Tag, 
  Check, 
  X, 
  Edit3, 
  Power, 
  Sparkles, 
  Loader2, 
  Plus,
  ArrowUpRight,
  TrendingUp,
  SlidersHorizontal,
  RefreshCw,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CaseDrawer } from '@/components/ui/CaseDrawer';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count?: {
    Service: number;
  };
}

interface ServiceItem {
  id: string;
  categoryId: string;
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
  };
}

export default function ServicesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DISABLED'>('ALL');
  const [search, setSearch] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);
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
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setRefreshing(true);
      setError(null);
      const [catsRes, servicesRes] = await Promise.all([
        fetch('/api/categories'),
        fetch(`/api/services?categoryId=${selectedCategory}&search=${encodeURIComponent(search)}`),
      ]);

      if (catsRes.ok) {
        const rawCats = await catsRes.json();
        const cats = Array.isArray(rawCats)
          ? rawCats
          : Array.isArray(rawCats?.data)
          ? rawCats.data
          : Array.isArray(rawCats?.items)
          ? rawCats.items
          : [];
        setCategories(cats);
      }
      if (servicesRes.ok) {
        const rawServices = await servicesRes.json();
        const servs = Array.isArray(rawServices)
          ? rawServices
          : Array.isArray(rawServices?.data)
          ? rawServices.data
          : Array.isArray(rawServices?.items)
          ? rawServices.items
          : [];
        setServices(servs);
      } else {
        throw new Error('Failed to load services catalog');
      }
    } catch (err: any) {
      console.error('Failed to load services data:', err);
      setError(err?.message || 'Failed to connect to catalog service');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleToggleActive = async (service: ServiceItem) => {
    if (togglingId === service.id) return;
    const newStatus = !service.isActive;
    setTogglingId(service.id);
    // Optimistic update
    setServices(prev => prev.map(s => s.id === service.id ? { ...s, isActive: newStatus } : s));

    try {
      const res = await fetch(`/api/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Rollback
        setServices(prev => prev.map(s => s.id === service.id ? { ...s, isActive: service.isActive } : s));
        setToast({
          type: 'error',
          message: data?.message || `Failed to ${newStatus ? 'enable' : 'disable'} "${service.title}"`,
        });
      } else {
        const updated = data?.service || data?.data;
        if (updated && typeof updated.isActive === 'boolean') {
          setServices(prev => prev.map(s => s.id === service.id ? { ...s, ...updated } : s));
        }
        setToast({
          type: 'success',
          message: `"${service.title}" is now ${newStatus ? 'enabled and live' : 'disabled and paused'}.`,
        });
      }
    } catch (error: any) {
      console.error('Failed to toggle status', error);
      setServices(prev => prev.map(s => s.id === service.id ? { ...s, isActive: service.isActive } : s));
      setToast({
        type: 'error',
        message: error?.message || `Failed to ${newStatus ? 'enable' : 'disable'} "${service.title}"`,
      });
    } finally {
      setTogglingId(null);
    }
  };

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
        })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        const updated = data?.service || data?.data;
        if (updated) {
          setServices(prev => prev.map(s => s.id === editingService.id ? { ...s, ...updated } : s));
        }
        setEditingService(null);
        setToast({
          type: 'success',
          message: `Service "${editingService.title}" updated successfully.`,
        });
        await fetchData(true);
      } else {
        setToast({
          type: 'error',
          message: data?.message || 'Failed to update service details',
        });
      }
    } catch (error: any) {
      console.error('Failed to save edit', error);
      setToast({
        type: 'error',
        message: error?.message || 'Failed to update service',
      });
    } finally {
      setSaving(false);
    }
  };

  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeServices = Array.isArray(services) ? services : [];
  const totalServices = safeServices.length;
  const activeServices = safeServices.filter(s => s.isActive).length;

  const displayedServices = safeServices.filter(s => {
    if (statusFilter === 'ACTIVE') return s.isActive;
    if (statusFilter === 'DISABLED') return !s.isActive;
    return true;
  });

  return (
    <div className="space-y-4 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Catalog & Service Offerings</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              {totalServices} Master SKUs ({activeServices} Live)
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure service pricing matrices, execution turnaround times, and marketplace availability.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData()}
            disabled={refreshing}
            className="p-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg border border-slate-200 dark:border-slate-800 transition-colors shadow-xs cursor-pointer"
            title="Refresh Catalog"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-500' : ''}`} />
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
            onClick={() => fetchData()}
            className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-medium text-[11px] transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Category Pills Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
            selectedCategory === 'ALL'
              ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
              : 'bg-white dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          All Domains ({safeCategories.reduce((acc, c) => acc + (c._count?.Service || 0), 0)})
        </button>

        {safeCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
              selectedCategory === cat.id
                ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                : 'bg-white dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {cat.name} ({cat._count?.Service || 0})
          </button>
        ))}
      </div>

      {/* Search and Quick Metric Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search service title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md pl-9 pr-4 py-1.5 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
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
              All ({totalServices})
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
              Live ({activeServices})
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
              Disabled ({totalServices - activeServices})
            </button>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-16 flex items-center justify-center shadow-xs">
          <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
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
            Try adjusting your search terms or selecting a different status/category filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayedServices.map((service) => (
            <div
              key={service.id}
              className={`bg-white dark:bg-slate-900 rounded-xl border transition-all p-3.5 flex flex-col justify-between shadow-xs ${
                service.isActive ? 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700' : 'border-slate-200/60 dark:border-slate-800/40 opacity-60 bg-slate-50 dark:bg-slate-950/40'
              }`}
            >
              <div>
                {/* Header Tag Bar */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {service.Category?.name || 'General'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {service.isPopular && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        <Sparkles className="w-2.5 h-2.5 text-amber-500 dark:text-amber-400" />
                        Popular
                      </span>
                    )}
                    <StatusBadge status={service.isActive ? 'ACTIVE' : 'SUSPENDED'} />
                  </div>
                </div>

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
                    <span className="font-bold text-slate-800 dark:text-slate-200">{service.rating.toFixed(1)}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">({service.reviewCount})</span>
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

                  {/* Toggle Active Switch */}
                  <button
                    onClick={() => handleToggleActive(service)}
                    disabled={togglingId === service.id}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer border disabled:opacity-50 disabled:cursor-not-allowed ${
                      service.isActive
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border-rose-500/30'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30'
                    }`}
                    title={service.isActive ? 'Click to disable service' : 'Click to enable service'}
                  >
                    {togglingId === service.id ? (
                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                    ) : (
                      <Power className="w-2.5 h-2.5" />
                    )}
                    {togglingId === service.id
                      ? 'Updating...'
                      : service.isActive
                      ? 'Disable'
                      : 'Enable'}
                  </button>
                </div>
              </div>
            </div>
          ))}
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
              <p className="font-bold text-slate-900 dark:text-slate-200">{editingService.Category?.name || 'General Service'}</p>
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
