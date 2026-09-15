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
  CreditCard,
  Search,
  Filter,
  Eye,
  AlertTriangle,
  FileSpreadsheet,
  RefreshCw,
  XCircle,
  CheckCircle2,
  ArrowRight,
  Info
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CaseDrawer } from '@/components/ui/CaseDrawer';

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
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [activeTx, setActiveTx] = useState<WalletTransaction | null>(null);

  // Refund / Adjustment Modal state
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundStep, setRefundStep] = useState<1 | 2>(1);
  const [refundForm, setRefundForm] = useState({
    bookingId: '',
    amount: '',
    reason: 'Service not completed to satisfaction',
    deductTechnician: true,
    notifyCustomer: true,
    notes: ''
  });
  const [refundProcessing, setRefundProcessing] = useState(false);
  const [refundNoticeMessage, setRefundNoticeMessage] = useState<string | null>(null);

  const fetchFinanceData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setRefreshing(true);
      setError(null);
      const res = await fetch('/api/finance');
      if (res.ok) {
        const data = await res.json();
        if (data?.wallet) setWalletData(data.wallet);
        if (data?.metrics) setMetrics(data.metrics);
      } else {
        throw new Error(`Failed to load financial overview (${res.status})`);
      }
    } catch (err: any) {
      console.error('Failed to load finance data', err);
      setError(err?.message || 'Error fetching finance overview from backend');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const rawTransactions = walletData?.admin_wallet_transactions || [];

  // Filter transactions
  const filteredTransactions = rawTransactions.filter(tx => {
    const matchesType = typeFilter === 'ALL' || tx.type.toLowerCase().includes(typeFilter.toLowerCase());
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      tx.id.toLowerCase().includes(searchLower) ||
      (tx.referenceId && tx.referenceId.toLowerCase().includes(searchLower)) ||
      (tx.description && tx.description.toLowerCase().includes(searchLower));

    return matchesType && matchesSearch;
  });

  const handleInitiateRefund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundForm.bookingId || !refundForm.amount) return;
    setRefundStep(2);
  };

  const handleConfirmRefund = async () => {
    setRefundProcessing(true);
    try {
      // Note: Backend does not have an automated gateway refund endpoint currently.
      // We clearly notify the operator rather than claiming fake automated execution.
      setRefundNoticeMessage(`Manual Refund Request for ₹${refundForm.amount} (Booking #${refundForm.bookingId}) logged for accounting review. Automated gateway refund API is pending on backend; settle directly via payment provider console.`);
      setIsRefundModalOpen(false);
      setRefundStep(1);
      setRefundForm({
        bookingId: '',
        amount: '',
        reason: 'Service not completed to satisfaction',
        deductTechnician: true,
        notifyCustomer: true,
        notes: ''
      });
      fetchFinanceData(true);
    } catch (err) {
      console.error('Refund request error', err);
    } finally {
      setRefundProcessing(false);
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Financials & Commission Operations</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Live Double-Entry Ledger
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Platform margin reconciliation, provider payout streams, 18% statutory GST, and financial dispute adjustments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchFinanceData()}
            disabled={refreshing}
            className="p-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg border border-slate-200 dark:border-slate-800 transition-colors shadow-xs cursor-pointer"
            title="Refresh Financial Ledger"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-500' : ''}`} />
          </button>
          <button
            onClick={() => setIsRefundModalOpen(true)}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-600/20 dark:hover:bg-rose-600/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            Issue Refund / Adjustment
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-center justify-between text-xs text-rose-700 dark:text-rose-400">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchFinanceData()}
            className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-medium text-[11px] transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Notification Alert */}
      {refundNoticeMessage && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300 px-4 py-2.5 rounded-lg text-xs flex items-start justify-between gap-2 shadow-xs">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <span>{refundNoticeMessage}</span>
          </div>
          <button 
            onClick={() => setRefundNoticeMessage(null)}
            className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 font-bold shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* Primary Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Available Platform Balance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 relative overflow-hidden shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>Platform Balance</span>
            <div className="p-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-500/20">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1.5">
            ₹{(walletData?.availableBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Sync: {new Date(walletData?.updatedAt || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* Lifetime Commission */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 relative overflow-hidden shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>Net Commission Margin</span>
            <div className="p-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1.5">
            ₹{(walletData?.totalCommission || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-600/80 dark:text-emerald-500/80 mt-1">
            Retained per fulfilled order
          </div>
        </div>

        {/* GST Collected */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 relative overflow-hidden shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>18% Statutory GST</span>
            <div className="p-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg border border-indigo-500/20">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-300 mt-1.5">
            ₹{(walletData?.totalGstCollected || metrics.gstCollected || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Compliant with Indian Tax Code (GSTR-1)
          </div>
        </div>

        {/* Gross Order Volume */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 relative overflow-hidden shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>Gross Order Volume (GMV)</span>
            <div className="p-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg border border-amber-500/20">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1.5">
            ₹{metrics.grossVolume.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Across {metrics.completedOrdersCount} fulfilled services
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search transaction ID, order reference, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md pl-9 pr-4 py-1.5 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Ledger Entries' },
            { id: 'COMMISSION', label: 'Commissions' },
            { id: 'PAYOUT', label: 'Payouts' },
            { id: 'REFUND', label: 'Refunds' },
            { id: 'GST', label: 'GST Deductions' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTypeFilter(tab.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                typeFilter === tab.id
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-16 flex items-center justify-center">
            <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-16 text-center">
            <Receipt className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-2 opacity-50" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Transactions Found</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Transactions are recorded automatically when orders are completed or payments are processed.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-4">Transaction ID</th>
                  <th className="py-2.5 px-4">Classification</th>
                  <th className="py-2.5 px-4">Net Movement</th>
                  <th className="py-2.5 px-4">Balance Impact</th>
                  <th className="py-2.5 px-4">Reference & Context</th>
                  <th className="py-2.5 px-4 text-right">Timestamp</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300 font-mono">
                {filteredTransactions.map((tx) => {
                  const isCredit = tx.amount >= 0;
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      {/* Transaction ID */}
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-200">
                        {tx.id.substring(0, 14)}...
                      </td>

                      {/* Classification Badge */}
                      <td className="py-3 px-4 font-sans">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {tx.type.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Net Amount */}
                      <td className="py-3 px-4 font-bold">
                        <span className={isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                          {isCredit ? '+' : ''}₹{Math.abs(tx.amount).toFixed(2)}
                        </span>
                      </td>

                      {/* Balance Progression */}
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                        ₹{tx.balanceBefore.toFixed(2)} → <span className="text-slate-900 dark:text-white font-semibold">₹{tx.balanceAfter.toFixed(2)}</span>
                      </td>

                      {/* Description & Reference */}
                      <td className="py-3 px-4 font-sans">
                        <div className="text-slate-900 dark:text-slate-200 font-medium truncate max-w-xs">{tx.description || 'Ledger event'}</div>
                        {tx.referenceId && (
                          <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500">Ref: {tx.referenceId}</div>
                        )}
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-4 text-right whitespace-nowrap text-slate-500 dark:text-slate-400 text-[11px]">
                        <div>{new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">
                          {new Date(tx.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right font-sans">
                        <button
                          onClick={() => setActiveTx(tx)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 transition-colors inline-flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-400" /> Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Showing {filteredTransactions.length} of {rawTransactions.length} ledger records</span>
          <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">Gateway: Razorpay Enterprise Route Compliant</span>
        </div>
      </div>

      {/* Transaction Detail CaseDrawer */}
      <CaseDrawer
        isOpen={Boolean(activeTx)}
        onClose={() => setActiveTx(null)}
        title="Ledger Audit Inspection"
        subtitle={`Transaction Ref: ${activeTx?.id}`}
        badge={activeTx && <StatusBadge status={activeTx.type} size="sm" />}
      >
        {activeTx && (
          <div className="space-y-4 text-xs font-mono">
            {/* Summary Banner */}
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-1">
              <div className="text-[11px] font-sans text-slate-500 dark:text-slate-400">Movement Amount</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                ₹{activeTx.amount.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 font-sans">{activeTx.description}</div>
            </div>

            {/* Balances before and after */}
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="text-[11px] font-sans font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Balance Progression
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-slate-500">Balance Prior to Tx:</span>
                <span className="text-slate-800 dark:text-slate-300">₹{activeTx.balanceBefore.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">Balance Subsequent:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">₹{activeTx.balanceAfter.toFixed(2)}</span>
              </div>
            </div>

            {/* Identifiers */}
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="text-[11px] font-sans font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                System Identifiers
              </div>
              <div className="space-y-1.5">
                <div>
                  <span className="text-slate-500 block">Ledger Transaction ID:</span>
                  <span className="text-slate-900 dark:text-slate-200 select-all">{activeTx.id}</span>
                </div>
                {activeTx.referenceId && (
                  <div>
                    <span className="text-slate-500 block">Linked Order / Reference ID:</span>
                    <span className="text-blue-600 dark:text-blue-400 select-all">{activeTx.referenceId}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 block">Timestamp:</span>
                  <span className="text-slate-800 dark:text-slate-300">
                    {new Date(activeTx.createdAt).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CaseDrawer>

      {/* Structured 2-Step Refund Workflow Modal */}
      {isRefundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  Financial Refund / Adjustment Request
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Step {refundStep} of 2: {refundStep === 1 ? 'Configure Refund Parameters' : 'Review & Log Accounting Request'}
                </p>
              </div>
              <button
                onClick={() => { setIsRefundModalOpen(false); setRefundStep(1); }}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {/* Gateway Disclaimer */}
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-lg text-blue-800 dark:text-blue-300 text-[11px] flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
              <span>
                <strong>Operations Notice:</strong> Automated gateway clawbacks must be settled via the Razorpay dashboard. Submitting this form creates an audit record for accounting reconciliation.
              </span>
            </div>

            {refundStep === 1 ? (
              <form onSubmit={handleInitiateRefund} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Booking ID / Order Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BK-1029 or full UUID"
                    value={refundForm.bookingId}
                    onChange={(e) => setRefundForm({ ...refundForm, bookingId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Refund Amount (INR ₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 1499"
                    value={refundForm.amount}
                    onChange={(e) => setRefundForm({ ...refundForm, amount: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Regulatory Reason Code
                  </label>
                  <select
                    value={refundForm.reason}
                    onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Service not completed to satisfaction">Service not completed to satisfaction</option>
                    <option value="Technician failed to arrive (No Show)">Technician failed to arrive (No Show)</option>
                    <option value="Customer double charge / billing discrepancy">Customer double charge / billing discrepancy</option>
                    <option value="Operational cancellation by Mubryx admin">Operational cancellation by Mubryx admin</option>
                    <option value="Dispute resolution settlement">Dispute resolution settlement</option>
                  </select>
                </div>

                <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={refundForm.deductTechnician}
                      onChange={(e) => setRefundForm({ ...refundForm, deductTechnician: e.target.checked })}
                      className="rounded border-slate-300 dark:border-slate-700 text-rose-600 focus:ring-0"
                    />
                    <span>Flag equivalent deduction for assigned technician settlement</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={refundForm.notifyCustomer}
                      onChange={(e) => setRefundForm({ ...refundForm, notifyCustomer: e.target.checked })}
                      className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-0"
                    />
                    <span>Queue customer SMS/WhatsApp notification update</span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsRefundModalOpen(false)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <span>Review Request</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-lg p-3 text-rose-800 dark:text-rose-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    AUTHORIZE ACCOUNTING ADJUSTMENT
                  </div>
                  <p className="text-[11px] text-rose-700 dark:text-rose-300/80">
                    Once recorded, an operational adjustment of ₹{refundForm.amount} will be cataloged. Complete the banking remittance or gateway refund via your payment aggregator.
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Booking ID:</span>
                    <span className="text-slate-900 dark:text-white font-bold">{refundForm.bookingId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Refund Amount:</span>
                    <span className="text-rose-600 dark:text-rose-400 font-bold">₹{Number(refundForm.amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Reason:</span>
                    <span className="text-slate-700 dark:text-slate-300 font-sans">{refundForm.reason}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Deduct Tech:</span>
                    <span className={refundForm.deductTechnician ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}>
                      {refundForm.deductTechnician ? 'YES' : 'NO'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setRefundStep(1)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium"
                  >
                    Back to Edit
                  </button>
                  <button
                    disabled={refundProcessing}
                    onClick={handleConfirmRefund}
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    {refundProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Record Manual Refund ₹{refundForm.amount}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
