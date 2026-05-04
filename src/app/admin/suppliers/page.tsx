'use client';

import { useState, useEffect } from 'react';
import {
    Loader2, Truck, Building2, CheckCircle2, XCircle,
    ChevronDown, ChevronUp, Mail, Globe, Phone, Tag,
    Clock, Search,
} from 'lucide-react';
import { collection, query, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, string> = {
    pending:  'bg-amber-500/10 border-amber-500/20 text-amber-400',
    approved: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    rejected: 'bg-red-500/10 border-red-500/20 text-red-400',
};

export default function AdminSuppliersPage() {
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchApplications = async () => {
            setLoading(true);
            const snap = await getDocs(query(collection(db, 'supplier_applications'), orderBy('submittedAt', 'desc')));
            setApplications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        };
        fetchApplications();
    }, []);

    const handleDecision = async (app: any, decision: 'approved' | 'rejected') => {
        setActionLoading(app.id);
        try {
            await updateDoc(doc(db, 'supplier_applications', app.id), {
                status: decision,
                reviewedAt: new Date(),
            });
            await updateDoc(doc(db, 'users', app.userId), {
                supplierStatus: decision,
            });
            toast.success(decision === 'approved' ? 'Supplier approved.' : 'Application rejected.');
            setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: decision } : a));
            setExpandedId(null);
        } catch (err) {
            console.error(err);
            toast.error('Action failed. Please try again.');
        } finally {
            setActionLoading(null);
        }
    };

    const filtered = applications.filter(a => {
        const matchFilter = filter === 'all' || a.status === filter;
        const matchSearch = !search ||
            a.companyName?.toLowerCase().includes(search.toLowerCase()) ||
            a.email?.toLowerCase().includes(search.toLowerCase());
        return matchFilter && matchSearch;
    });

    const counts = {
        all: applications.length,
        pending:  applications.filter(a => a.status === 'pending').length,
        approved: applications.filter(a => a.status === 'approved').length,
        rejected: applications.filter(a => a.status === 'rejected').length,
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-semibold text-white">Supplier Applications</h1>
                <p className="text-sm text-zinc-500 mt-0.5">Review and verify supplier applications before granting access.</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="flex gap-1 p-1 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                    {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all',
                                filter === f ? 'bg-white/[0.08] text-white' : 'text-zinc-500 hover:text-zinc-300'
                            )}
                        >
                            {f} {counts[f] > 0 && <span className="ml-1 opacity-60">{counts[f]}</span>}
                        </button>
                    ))}
                </div>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search company or email..."
                        className="w-full h-9 pl-9 pr-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/40 transition-all"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                    <Truck className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                    <p className="text-sm text-zinc-500">No applications found</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map(app => {
                        const isExpanded = expandedId === app.id;
                        const isPending = app.status === 'pending';
                        return (
                            <div key={app.id} className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden transition-all">
                                <button
                                    onClick={() => setExpandedId(isExpanded ? null : app.id)}
                                    className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
                                >
                                    <div className="w-9 h-9 bg-white/[0.04] border border-white/[0.05] rounded-lg flex items-center justify-center shrink-0">
                                        <Building2 className="w-4 h-4 text-zinc-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-white truncate">
                                            {app.companyName || 'Unnamed Company'}
                                        </p>
                                        <p className="text-xs text-zinc-500 mt-0.5 truncate">{app.email}</p>
                                    </div>
                                    <div className="hidden sm:flex items-center gap-2 shrink-0">
                                        <span className="text-xs text-zinc-500">{app.businessType}</span>
                                        <span className="text-zinc-700">·</span>
                                        <span className="text-xs text-zinc-500">{app.country}</span>
                                    </div>
                                    <span className={cn(
                                        'px-2 py-0.5 text-[10px] font-semibold border rounded-full capitalize shrink-0',
                                        STATUS_STYLES[app.status] || STATUS_STYLES.pending
                                    )}>
                                        {app.status || 'pending'}
                                    </span>
                                    {isExpanded
                                        ? <ChevronUp className="w-4 h-4 text-zinc-500 shrink-0" />
                                        : <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
                                    }
                                </button>

                                {isExpanded && (
                                    <div className="border-t border-white/[0.06] px-5 pb-5 pt-4 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {[
                                                { icon: Mail,      label: 'Email',     value: app.email },
                                                { icon: Phone,     label: 'Phone',     value: app.phone || '—' },
                                                { icon: Building2, label: 'Type',      value: app.businessType },
                                                { icon: Globe,     label: 'Country',   value: app.country },
                                                { icon: Globe,     label: 'Website',   value: app.website || '—' },
                                                { icon: Clock,     label: 'Submitted', value: app.submittedAt?.toDate ? app.submittedAt.toDate().toLocaleDateString() : 'N/A' },
                                            ].map((item, i) => (
                                                <div key={i} className="flex items-start gap-3 p-3 bg-white/[0.02] border border-white/[0.04] rounded-lg">
                                                    <item.icon className="w-3.5 h-3.5 text-zinc-500 mt-0.5 shrink-0" />
                                                    <div>
                                                        <p className="text-[10px] text-zinc-600 uppercase tracking-wider">{item.label}</p>
                                                        <p className="text-xs text-white mt-0.5">{item.value}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {app.categories?.length > 0 && (
                                            <div>
                                                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                    <Tag className="w-3 h-3" /> Product Categories
                                                </p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {app.categories.map((c: string) => (
                                                        <span key={c} className="px-2 py-1 text-xs bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg">{c}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {app.description && (
                                            <div>
                                                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5">About</p>
                                                <p className="text-sm text-zinc-300 leading-relaxed bg-white/[0.02] border border-white/[0.04] rounded-lg p-3">
                                                    {app.description}
                                                </p>
                                            </div>
                                        )}

                                        {isPending ? (
                                            <div className="flex gap-3 pt-2">
                                                <button
                                                    onClick={() => handleDecision(app, 'approved')}
                                                    disabled={actionLoading === app.id}
                                                    className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                                                >
                                                    {actionLoading === app.id
                                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                                        : <><CheckCircle2 className="w-4 h-4" /> Approve Supplier</>
                                                    }
                                                </button>
                                                <button
                                                    onClick={() => handleDecision(app, 'rejected')}
                                                    disabled={actionLoading === app.id}
                                                    className="flex-1 h-10 border border-red-500/25 text-red-400 hover:bg-red-500/10 text-sm font-medium rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                                                >
                                                    <XCircle className="w-4 h-4" /> Reject
                                                </button>
                                            </div>
                                        ) : (
                                            <div className={cn(
                                                'flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium',
                                                STATUS_STYLES[app.status]
                                            )}>
                                                {app.status === 'approved'
                                                    ? <><CheckCircle2 className="w-4 h-4" /> This supplier has been approved</>
                                                    : <><XCircle className="w-4 h-4" /> This application was rejected</>
                                                }
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
