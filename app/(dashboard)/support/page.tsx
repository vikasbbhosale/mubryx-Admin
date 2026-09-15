"use client";

import { useState } from 'react';
import { 
  LifeBuoy, 
  Search, 
  Filter, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  User, 
  Phone, 
  MapPin, 
  Send, 
  ShieldAlert, 
  Receipt, 
  Calendar, 
  Tag, 
  MessageSquare, 
  ArrowRight,
  RefreshCw,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  category: 'SERVICE_QUALITY' | 'TECHNICIAN_NO_SHOW' | 'BILLING_DISPUTE' | 'CANCELLATION' | 'SAFETY_ESCALATION';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'IN_INVESTIGATION' | 'ESCALATED' | 'RESOLVED';
  slaMinutesRemaining: number;
  createdAt: string;
  customer: {
    name: string;
    phone: string;
    email: string;
    totalBookings: number;
    rating: number;
  };
  booking: {
    id: string;
    serviceTitle: string;
    amount: number;
    scheduledAt: string;
    status: string;
    address: string;
  };
  technician?: {
    name: string;
    phone: string;
    rating: number;
    completedJobs: number;
  };
  timeline: Array<{
    id: string;
    sender: 'CUSTOMER' | 'AGENT' | 'SYSTEM' | 'TECHNICIAN';
    senderName: string;
    message: string;
    timestamp: string;
  }>;
}

const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: 'tk_01',
    ticketNumber: 'TK-8291',
    subject: 'Technician has not arrived for AC Deep Clean',
    category: 'TECHNICIAN_NO_SHOW',
    priority: 'CRITICAL',
    status: 'OPEN',
    slaMinutesRemaining: -14, // Breached
    createdAt: new Date(Date.now() - 42 * 60000).toISOString(),
    customer: {
      name: 'Rahul Shah',
      phone: '+91 98250 12345',
      email: 'rahul.shah@gmail.com',
      totalBookings: 14,
      rating: 4.9
    },
    booking: {
      id: 'BK-1029',
      serviceTitle: 'Split AC Deep Clean & Gas Refill',
      amount: 1499,
      scheduledAt: 'Today, 4:30 PM',
      status: 'ASSIGNED',
      address: 'A-402, Samruddhi Elegance, Vastrapur, Ahmedabad'
    },
    technician: {
      name: 'Amit Patel',
      phone: '+91 98980 67890',
      rating: 4.82,
      completedJobs: 320
    },
    timeline: [
      {
        id: 'm1',
        sender: 'SYSTEM',
        senderName: 'Dispatch Engine',
        message: 'Booking created and assigned to Amit Patel for 4:30 PM slot.',
        timestamp: '3:05 PM'
      },
      {
        id: 'm2',
        sender: 'CUSTOMER',
        senderName: 'Rahul Shah',
        message: 'It is 4:45 PM already and the technician phone is ringing with no response. Please check immediately.',
        timestamp: '4:46 PM'
      },
      {
        id: 'm3',
        sender: 'AGENT',
        senderName: 'Ops Desk (Ronak)',
        message: 'Checking GPS telemetry. Contacting technician and standby backup provider in Vastrapur area.',
        timestamp: '4:50 PM'
      }
    ]
  },
  {
    id: 'tk_02',
    ticketNumber: 'TK-8292',
    subject: 'Customer disputes water damage during bathroom pressure wash',
    category: 'SERVICE_QUALITY',
    priority: 'HIGH',
    status: 'IN_INVESTIGATION',
    slaMinutesRemaining: 24,
    createdAt: new Date(Date.now() - 95 * 60000).toISOString(),
    customer: {
      name: 'Neha Verma',
      phone: '+91 97123 44556',
      email: 'neha.v@hotmail.com',
      totalBookings: 6,
      rating: 4.8
    },
    booking: {
      id: 'BK-1030',
      serviceTitle: 'Intense Bathroom Tile & Grout Wash',
      amount: 999,
      scheduledAt: 'Today, 2:00 PM',
      status: 'IN_PROGRESS',
      address: 'Flat 101, Shivalik Residency, Satellite, Ahmedabad'
    },
    technician: {
      name: 'Priya Sharma',
      phone: '+91 94260 88990',
      rating: 4.75,
      completedJobs: 184
    },
    timeline: [
      {
        id: 'm1',
        sender: 'CUSTOMER',
        senderName: 'Neha Verma',
        message: 'Water seeped into bedroom parquet flooring during pressure washing. Need supervisor inspection and compensation.',
        timestamp: '3:15 PM'
      },
      {
        id: 'm2',
        sender: 'TECHNICIAN',
        senderName: 'Priya Sharma',
        message: 'I followed standard masking protocol. The bathroom floor drain was clogged prior to service.',
        timestamp: '3:30 PM'
      }
    ]
  },
  {
    id: 'tk_03',
    ticketNumber: 'TK-8293',
    subject: 'Double charge on UPI gateway during checkout',
    category: 'BILLING_DISPUTE',
    priority: 'MEDIUM',
    status: 'OPEN',
    slaMinutesRemaining: 65,
    createdAt: new Date(Date.now() - 150 * 60000).toISOString(),
    customer: {
      name: 'Jayesh Patel',
      phone: '+91 98790 55112',
      email: 'jayesh.p@yahoo.co.in',
      totalBookings: 2,
      rating: 5.0
    },
    booking: {
      id: 'BK-1031',
      serviceTitle: 'Microwave Oven Circuit Board Repair',
      amount: 1299,
      scheduledAt: 'Tomorrow, 10:00 AM',
      status: 'PENDING_ACCEPTANCE',
      address: 'B-12, Green Acres, Bodakdev, Ahmedabad'
    },
    timeline: [
      {
        id: 'm1',
        sender: 'CUSTOMER',
        senderName: 'Jayesh Patel',
        message: '₹1,299 deducted twice from my HDFC UPI app. Bank reference ref_9829381. Kindly refund one transaction.',
        timestamp: '1:45 PM'
      }
    ]
  }
];

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);
  const [selectedTicketId, setSelectedTicketId] = useState<string>(INITIAL_TICKETS[0].id);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);

  const selectedTicket = tickets.find(t => t.id === selectedTicketId) || tickets[0];

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    const newMessage = {
      id: `msg_${Date.now()}`,
      sender: isInternalNote ? ('SYSTEM' as const) : ('AGENT' as const),
      senderName: isInternalNote ? 'Internal Ops Note' : 'Support Desk',
      message: replyText.trim(),
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    };

    setTickets(prev => prev.map(t => {
      if (t.id === selectedTicket.id) {
        return {
          ...t,
          timeline: [...t.timeline, newMessage],
          status: t.status === 'OPEN' ? 'IN_INVESTIGATION' : t.status
        };
      }
      return t;
    }));

    setReplyText('');
  };

  const handleStatusChange = (newStatus: SupportTicket['status']) => {
    if (!selectedTicket) return;
    setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, status: newStatus } : t));
  };

  const filteredTickets = tickets.filter(t => {
    const matchesCategory = filterCategory === 'ALL' || t.category === filterCategory;
    const matchesStatus = filterStatus === 'ALL' || t.status === filterStatus;
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      t.ticketNumber.toLowerCase().includes(searchLower) ||
      t.subject.toLowerCase().includes(searchLower) ||
      t.customer.name.toLowerCase().includes(searchLower) ||
      t.customer.phone.includes(search) ||
      t.booking.id.toLowerCase().includes(searchLower);

    return matchesCategory && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-3 pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-white">Customer Experience & Dispute Triage</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              3-Column Resolution Console
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Live incident resolution workspace linking customer claims, technician telemetry, and booking financial context.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>1 SLA Breach</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>2 Active Cases</span>
          </div>
        </div>
      </div>

      {/* 3-Column Operations Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-[calc(100vh-175px)] min-h-[600px]">
        
        {/* COLUMN 1: Ticket Queue (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900/60 border border-slate-800 rounded-lg flex flex-col overflow-hidden">
          {/* Queue Header & Filters */}
          <div className="p-3 border-b border-slate-800 space-y-2 bg-slate-950/40">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search ticket #, customer, order..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
              {['ALL', 'OPEN', 'IN_INVESTIGATION', 'RESOLVED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-2 py-0.5 rounded whitespace-nowrap transition-colors cursor-pointer ${
                    filterStatus === st
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Ticket List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 custom-scrollbar">
            {filteredTickets.map((t) => {
              const isSelected = selectedTicket?.id === t.id;
              const isBreached = t.slaMinutesRemaining <= 0;

              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTicketId(t.id)}
                  className={`w-full text-left p-3 transition-colors cursor-pointer block ${
                    isSelected
                      ? 'bg-blue-600/10 border-l-2 border-blue-500'
                      : 'hover:bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <span className="font-mono text-[11px] font-bold text-white">
                      {t.ticketNumber}
                    </span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold ${
                      isBreached 
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {isBreached ? `BREACHED (${Math.abs(t.slaMinutesRemaining)}m)` : `SLA: ${t.slaMinutesRemaining}m`}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-200 line-clamp-1 mb-1">
                    {t.subject}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{t.customer.name}</span>
                    <span className="font-mono text-slate-500">{t.booking.id}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* COLUMN 2: Conversation & Event Timeline (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800 rounded-lg flex flex-col overflow-hidden">
          {/* Conversation Header */}
          <div className="p-3 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-white text-xs">{selectedTicket.ticketNumber}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 text-slate-300">
                  {selectedTicket.category.replace(/_/g, ' ')}
                </span>
                <StatusBadge status={selectedTicket.status} />
              </div>
              <h2 className="text-xs font-semibold text-slate-200 mt-1 line-clamp-1">
                {selectedTicket.subject}
              </h2>
            </div>

            {/* Quick Status Dropdown */}
            <select
              value={selectedTicket.status}
              onChange={(e) => handleStatusChange(e.target.value as SupportTicket['status'])}
              className="bg-slate-950 border border-slate-800 text-[11px] text-slate-200 rounded px-2 py-1 focus:outline-none cursor-pointer"
            >
              <option value="OPEN">Mark OPEN</option>
              <option value="IN_INVESTIGATION">Under Investigation</option>
              <option value="ESCALATED">Escalate Case</option>
              <option value="RESOLVED">Mark Resolved</option>
            </select>
          </div>

          {/* Timeline Feed */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 custom-scrollbar text-xs">
            {selectedTicket.timeline.map((msg) => {
              const isCustomer = msg.sender === 'CUSTOMER';
              const isAgent = msg.sender === 'AGENT';
              const isSystem = msg.sender === 'SYSTEM';

              return (
                <div
                  key={msg.id}
                  className={`p-3 rounded-lg border ${
                    isCustomer
                      ? 'bg-slate-950/80 border-slate-800 ml-0 mr-6'
                      : isAgent
                      ? 'bg-blue-950/30 border-blue-900/40 ml-6 mr-0'
                      : 'bg-amber-950/20 border-amber-900/30 font-mono text-[11px]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span className="font-semibold text-slate-200">{msg.senderName}</span>
                    <span>{msg.timestamp}</span>
                  </div>
                  <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                </div>
              );
            })}
          </div>

          {/* Reply Box */}
          <form onSubmit={handleSendReply} className="p-3 border-t border-slate-800 bg-slate-950/60 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="replyMode"
                    checked={!isInternalNote}
                    onChange={() => setIsInternalNote(false)}
                    className="text-blue-600 focus:ring-0"
                  />
                  <span>Reply to Customer (SMS/In-App)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-amber-400">
                  <input
                    type="radio"
                    name="replyMode"
                    checked={isInternalNote}
                    onChange={() => setIsInternalNote(true)}
                    className="text-amber-500 focus:ring-0"
                  />
                  <span>Internal Staff Note</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={isInternalNote ? "Log private notes for supervisors..." : "Compose empathetic reply to customer..."}
                className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </div>
          </form>
        </div>

        {/* COLUMN 3: Context Panel (Customer, Booking, Provider) (3 cols) */}
        <div className="lg:col-span-3 bg-slate-900/60 border border-slate-800 rounded-lg flex flex-col overflow-y-auto custom-scrollbar p-3.5 space-y-4 text-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800">
            Case Context Dossier
          </div>

          {/* Customer Context */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-1.5">
            <div className="text-[10px] font-semibold text-slate-500 uppercase flex items-center gap-1">
              <User className="w-3 h-3 text-blue-400" /> Customer Account
            </div>
            <div className="font-semibold text-slate-100">{selectedTicket.customer.name}</div>
            <div className="text-[11px] font-mono text-slate-400">{selectedTicket.customer.phone}</div>
            <div className="text-[11px] text-slate-500">{selectedTicket.customer.email}</div>
            <div className="flex justify-between text-[11px] pt-1 border-t border-slate-900">
              <span className="text-slate-500">Order History:</span>
              <span className="text-slate-300 font-bold">{selectedTicket.customer.totalBookings} orders</span>
            </div>
          </div>

          {/* Booking Context */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-1.5">
            <div className="text-[10px] font-semibold text-slate-500 uppercase flex items-center gap-1">
              <Receipt className="w-3 h-3 text-emerald-400" /> Linked Order
            </div>
            <div className="font-mono font-bold text-white text-xs">{selectedTicket.booking.id}</div>
            <div className="font-medium text-slate-200 text-[11px]">{selectedTicket.booking.serviceTitle}</div>
            <div className="text-emerald-400 font-mono font-bold">₹{selectedTicket.booking.amount}</div>
            <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-900 flex items-start gap-1">
              <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0 mt-0.5" />
              <span>{selectedTicket.booking.address}</span>
            </div>
          </div>

          {/* Technician Context */}
          {selectedTicket.technician ? (
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-1.5">
              <div className="text-[10px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                <User className="w-3 h-3 text-amber-400" /> Assigned Provider
              </div>
              <div className="font-semibold text-slate-100">{selectedTicket.technician.name}</div>
              <div className="text-[11px] font-mono text-slate-400">{selectedTicket.technician.phone}</div>
              <div className="flex justify-between text-[11px] pt-1 border-t border-slate-900">
                <span className="text-slate-500">Reputation:</span>
                <span className="text-amber-400 font-bold">⭐ {selectedTicket.technician.rating} ({selectedTicket.technician.completedJobs} jobs)</span>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-950 border border-dashed border-slate-800 rounded-lg text-slate-500 text-center">
              No technician assigned to this booking yet
            </div>
          )}

          {/* Quick Resolution Actions */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Fast-Path Actions
            </div>
            <button
              onClick={() => alert(`Redirecting to finance refund workflow for ${selectedTicket.booking.id}`)}
              className="w-full px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded border border-slate-700 transition-colors flex items-center justify-between cursor-pointer"
            >
              <span>Issue Customer Refund</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <button
              onClick={() => alert(`Opening dispatch reassignment console for ${selectedTicket.booking.id}`)}
              className="w-full px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded border border-slate-700 transition-colors flex items-center justify-between cursor-pointer"
            >
              <span>Reassign Emergency Tech</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
