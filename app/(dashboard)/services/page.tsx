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
  RefreshCw
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
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [search, setSearch] = useState('');
  
  // Drawer Editing
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editDiscountPrice, setEditDiscountPrice] = useState<string>('');
  const [editDuration, setEditDuration] = useState('');
  const [editIsPopular, setEditIsPopular] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
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
      }
    } catch (error) {
      console.error('Failed to load services data:', error);
    } finally {
      setLoading(false);
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
    const newStatus = !service.isActive;
    // Optimistic update
    setServices(prev => prev.map(s => s.id === service.id ? { ...s, isActive: newStatus } : s));

    try {
      const res = await fetch(`/api/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus })
      });

      if (!res.ok) {
        setServices(prev => prev.map(s => s.id === service.id ? { ...s, isActive: service.isActive } : s));
      }
    } catch (error) {
      console.error('Failed to toggle status', error);
      fetchData();
    }
  };

  const openEditDrawer = (service: ServiceItem) => {
    setEditingService(service);
    setEditPrice(service.price);
    setEditDiscountPrice(service.discountPrice ? service.discountPrice.toString() : '');
    setEditDuration(service.duration);
    setEditIsPopular(service.isPopular);
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
        })
      });

      if (res.ok) {
        setEditingService(null);
        await fetchData();
      } else {
        alert('Failed to update service');
      }
    } catch (error) {
      console.error('Failed to save edit', error);
    } finally {
      setSaving(false);
    }
  };

  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeServices = Array.isArray(services) ? services : [];
  const totalServices = safeServices.length;
  const activeServices = safeServices.filter(s => s.isActive).length;

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-white">Catalog & Service Offerings</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {totalServices} Master SKUs ({activeServices} Live)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure service pricing matrices, execution turnaround times, and marketplace availability.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded border border-slate-800 transition-colors"
            title="Refresh Catalog"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
            selectedCategory === 'ALL'
              ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
              : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          All Domains ({safeCategories.reduce((acc, c) => acc + (c._count?.Service || 0), 0)})
        </button>

        {safeCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
              selectedCategory === cat.id
                ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            {cat.name} ({cat._count?.Service || 0})
          </button>
        ))}
      </div>

      {/* Search and Quick Metric Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search service title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-md pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700"
          />
        </form>

        <div className="text-xs text-slate-400 font-mono">
          Live SKUs: <span className="text-emerald-400 font-bold">{activeServices}</span> | Paused: <span className="text-slate-500 font-bold">{totalServices - activeServices}</span>
        </div>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-16 flex items-center justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
        </div>
      ) : safeServices.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-16 text-center">
          <Layers className="w-10 h-10 text-slate-600 mx-auto mb-2 opacity-50" />
          <h3 className="text-sm font-semibold text-slate-300">No Catalog Services Found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search terms or selecting a different category domain.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {safeServices.map((service) => (
            <div
              key={service.id}
              className={`bg-slate-900/60 rounded-lg border transition-all p-3.5 flex flex-col justify-between ${
                service.isActive ? 'border-slate-800 hover:border-slate-700' : 'border-slate-800/40 opacity-50 bg-slate-950/40'
              }`}
            >
              <div>
                {/* Header Tag Bar */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                    {service.Category?.name || 'General'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {service.isPopular && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                        Popular
                      </span>
                    )}
                    <StatusBadge status={service.isActive ? 'ACTIVE' : 'SUSPENDED'} />
                  </div>
                </div>

                {/* Title and Description */}
                <h3 className="font-bold text-white text-xs leading-snug">
                  {service.title}
                </h3>
                <p className="text-slate-400 text-[11px] mt-1 line-clamp-2 leading-relaxed">
                  {service.description}
                </p>

                {/* Duration & Rating */}
                <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{service.duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="font-bold text-slate-200">{service.rating.toFixed(1)}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({service.reviewCount})</span>
                  </div>
                </div>
              </div>

              {/* Pricing & Management Controls */}
              <div className="mt-3.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-1.5 font-mono">
                    <span className="text-base font-bold text-white">
                      ₹{service.discountPrice || service.price}
                    </span>
                    {service.discountPrice && (
                      <span className="text-[11px] text-slate-500 line-through">
                        ₹{service.price}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Edit Pricing Button */}
                  <button
                    onClick={() => openEditDrawer(service)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors cursor-pointer"
                    title="Edit Pricing & Duration"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>

                  {/* Toggle Active Switch */}
                  <button
                    onClick={() => handleToggleActive(service)}
                    className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer border ${
                      service.isActive
                        ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border-rose-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30'
                    }`}
                  >
                    <Power className="w-2.5 h-2.5" />
                    {service.isActive ? 'Disable' : 'Enable'}
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
        status={editingService?.isActive ? 'ACTIVE' : 'SUSPENDED'}
        actions={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              onClick={() => setEditingService(null)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded"
            >
              Cancel
            </button>
            <button
              disabled={saving}
              onClick={handleSaveEdit}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Changes
            </button>
          </div>
        }
      >
        {editingService && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-900 border border-slate-800 rounded p-3 space-y-1">
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Category Domain</span>
              <p className="font-bold text-slate-200">{editingService.Category?.name || 'General Service'}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Base Price (₹) *
                </label>
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono focus:outline-none focus:border-slate-700"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Discount Price (₹)
                </label>
                <input
                  type="number"
                  placeholder="Optional"
                  value={editDiscountPrice}
                  onChange={(e) => setEditDiscountPrice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono focus:outline-none focus:border-slate-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Estimated Turnaround Duration
              </label>
              <input
                type="text"
                value={editDuration}
                onChange={(e) => setEditDuration(e.target.value)}
                placeholder="e.g. 45 mins, 2 hours"
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-slate-700"
              />
            </div>

            <div className="pt-2 border-t border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={editIsPopular}
                  onChange={(e) => setEditIsPopular(e.target.checked)}
                  className="rounded border-slate-700 text-blue-600 focus:ring-0"
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
