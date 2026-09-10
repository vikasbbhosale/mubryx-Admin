"use client";

import { useState, useEffect } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  Receipt, 
  ArrowUpRight, 
  ArrowDownLeft, 
  DollarSign, 
  Clock, 
  ShieldCheck, 
  Loader2,
  Calendar,
  CreditCard
} from 'lucide-react';

interface WalletTransaction {
  id: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceId: string | null;
  description: string | null;
  createdAt: string;
}

interface WalletData {
  id: string;
  availableBalance: number;
  currency: string;
  totalCommission: number;
  totalGstCollected: number;
  updatedAt: string;
  admin_wallet_transactions: WalletTransaction[];
}

export default function FinancePage() {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [metrics, setMetrics] = useState({ grossVolume: 0, gstCollected: 0, completedOrdersCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/finance')
      .then((res) => res.json())
      .then((data) => {
        if (data?.wallet) setWalletData(data.wallet);
        if (data?.metrics) setMetrics(data.metrics);
      })
      .catch((err) => console.error('Failed to load finance data', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const transactions = walletData?.admin_wallet_transactions || [];

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Financials & Commission</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live Ledger
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Real-time platform fee tracking, GST collections, gross transaction volume, and payout reconciliations.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Balance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Available Balance</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            ₹{(walletData?.availableBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Updated {new Date(walletData?.updatedAt || Date.now()).toLocaleDateString('en-IN')}
          </div>
        </div>

        {/* Lifetime Commission */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Platform Commission</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">
            ₹{(walletData?.totalCommission || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">
            10-15% margin captured per completed job
          </div>
        </div>

        {/* GST Collected */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Total GST Collected</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-600 mt-2">
            ₹{(walletData?.totalGstCollected || metrics.gstCollected || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Government statutory 18% GST ledger
          </div>
        </div>

        {/* Gross Volume */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Gross Order Volume</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            ₹{metrics.grossVolume.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Across {metrics.completedOrdersCount} paid/completed orders
          </div>
        </div>
      </div>

      {/* Transaction Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Platform Wallet Ledger</h3>
            <p className="text-xs text-slate-500 mt-0.5">Chronological log of fee deductions, payouts, and adjustments</p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
            {transactions.length} Transactions
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-800">No Transactions Yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Wallet transaction rows will automatically populate here as technicians complete jobs and commissions are captured.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Transaction ID</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Balance (Before / After)</th>
                  <th className="px-5 py-3.5">Description & Reference</th>
                  <th className="px-5 py-3.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-slate-900">
                      {tx.id.substring(0, 14)}...
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                        {tx.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900">
                      ₹{tx.amount.toFixed(2)}
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      ₹{tx.balanceBefore.toFixed(2)} → ₹{tx.balanceAfter.toFixed(2)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-slate-800 font-medium">{tx.description || 'System transaction'}</div>
                      {tx.referenceId && (
                        <div className="text-[11px] font-mono text-slate-400">Ref: {tx.referenceId}</div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-400 whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
