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
  Plus
} from 'lucide-react';

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
        setCategories(await catsRes.json());
      }
      if (servicesRes.ok) {
        setServices(await servicesRes.json());
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
    try {
      const newStatus = !service.isActive;
      // Optimistic update
      setServices(prev => prev.map(s => s.id === service.id ? { ...s, isActive: newStatus } : s));

      const res = await fetch(`/api/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus })
      });

      if (!res.ok) {
        // Revert on error
        setServices(prev => prev.map(s => s.id === service.id ? { ...s, isActive: service.isActive } : s));
      }
    } catch (error) {
      console.error('Failed to toggle status', error);
      fetchData();
    }
  };

  const openEditModal = (service: ServiceItem) => {
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

  const totalServices = services.length;
  const activeServices = services.filter(s => s.isActive).length;

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Services & Catalog</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {totalServices} Available
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Configure master service catalog, pricing tiers, durations, and category placements.
          </p>
        </div>
      </div>

      {/* Categories Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
            selectedCategory === 'ALL'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          All Categories ({categories.reduce((acc, c) => acc + (c._count?.Service || 0), 0)})
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
              selectedCategory === cat.id
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {cat.name} ({cat._count?.Service || 0})
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex justify-between items-center gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-sm flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search service title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-xs font-medium rounded-xl pl-9 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); fetchData(); }}
              className="absolute right-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        <div className="text-xs font-semibold text-slate-500">
          Showing <span className="text-slate-900 font-bold">{services.length}</span> services ({activeServices} active)
        </div>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : services.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Services Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Try adjusting your search terms or selecting a different category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((service) => (
            <div
              key={service.id}
              className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between shadow-xs hover:shadow-md ${
                service.isActive ? 'border-slate-200/90' : 'border-slate-200 opacity-60 bg-slate-50/50'
              }`}
            >
              <div>
                {/* Badges Bar */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-[10px] tracking-wide uppercase">
                    {service.Category?.name || 'General'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {service.isPopular && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        Popular
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      service.isActive 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {service.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                </div>

                {/* Title and Description */}
                <h3 className="font-bold text-slate-900 text-sm leading-snug">
                  {service.title}
                </h3>
                <p className="text-slate-500 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                  {service.description}
                </p>

                {/* Details Bar */}
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{service.duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="font-bold text-slate-800">{service.rating.toFixed(1)}</span>
                    <span className="text-[11px] text-slate-400">({service.reviewCount})</span>
                  </div>
                </div>
              </div>

              {/* Bottom Price & Controls */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-extrabold text-slate-900">
                      ₹{service.discountPrice || service.price}
                    </span>
                    {service.discountPrice && (
                      <span className="text-xs text-slate-400 line-through">
                        ₹{service.price}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Edit Button */}
                  <button
                    onClick={() => openEditModal(service)}
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer border border-slate-200"
                    title="Edit Pricing & Settings"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {/* Active Toggle */}
                  <button
                    onClick={() => handleToggleActive(service)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                      service.isActive
                        ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                    }`}
                  >
                    <Power className="w-3 h-3" />
                    {service.isActive ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Service Modal */}
      {editingService && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Catalog Service</h3>
                <p className="text-xs text-slate-500 mt-0.5">{editingService.title}</p>
              </div>
              <button
                onClick={() => setEditingService(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Price Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Standard Price (₹)
                  </label>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Discounted Price (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="Optional"
                    value={editDiscountPrice}
                    onChange={(e) => setEditDiscountPrice(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Duration Field */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Estimated Duration
                </label>
                <input
                  type="text"
                  value={editDuration}
                  onChange={(e) => setEditDuration(e.target.value)}
                  placeholder="e.g. 45 mins, 1 hour"
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Is Popular Checkbox */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isPopularCheck"
                  checked={editIsPopular}
                  onChange={(e) => setEditIsPopular(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="isPopularCheck" className="text-xs font-semibold text-slate-800 cursor-pointer">
                  Feature as "Popular Service" on customer app
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditingService(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={saving}
                onClick={handleSaveEdit}
                className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
