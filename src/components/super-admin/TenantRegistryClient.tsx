'use client';

import { useState } from 'react';
import { Search, ExternalLink, ShieldCheck } from 'lucide-react';
import { updateTenantStatus } from '@/app/actions/super-admin';
import TenantStatusToggle from '@/components/super-admin/TenantStatusToggle';
import LoginAsMerchantButton from '@/components/super-admin/LoginAsMerchantButton';
import TenantTierSelect from '@/components/super-admin/TenantTierSelect';

export default function TenantRegistryClient({ initialTenants }: { initialTenants: any[] }) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredTenants = initialTenants.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="relative group max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within:text-red-500 transition-colors" />
                <input 
                    type="text"
                    placeholder="Search by merchant name, slug, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-white/[0.03] rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-red-500/30 focus:border-red-500/20 transition-all shadow-2xl"
                />
            </div>

            <div className="bg-[#0a0a0a] border border-white/[0.03] rounded-[2rem] overflow-hidden shadow-2xl">
                <div className="px-8 py-6 border-b border-white/[0.03] flex justify-between items-center bg-white/[0.01]">
                    <div>
                        <h2 className="text-lg font-bold tracking-tight text-white uppercase">Merchant Base</h2>
                        <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mt-0.5">Live Node Directory</p>
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 px-4 py-1.5 bg-neutral-900 rounded-lg border border-white/[0.05]">
                        <span className="text-red-500">{filteredTenants.length}</span> Results
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-neutral-900/40 text-white/90 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-white/[0.03]">
                                <th className="px-8 py-5">Identity</th>
                                <th className="px-8 py-5 hidden lg:table-cell">EntryPoint</th>
                                <th className="px-8 py-5">Network Status</th>
                                <th className="px-8 py-5">Service Tier</th>
                                <th className="px-8 py-5 text-right">Directives</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {filteredTenants.map((t: any) => (
                                <tr key={t.id} className="hover:bg-white/[0.01] transition-all group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-white/[0.05] flex items-center justify-center font-bold text-neutral-500 group-hover:bg-red-600/10 group-hover:text-red-500 transition-all duration-500 scale-95 group-hover:scale-100 uppercase">
                                                {t.name.charAt(0)}
                                            </div>
                                            <div className="space-y-0">
                                                <span className="text-[14px] font-bold text-white tracking-tight block group-hover:translate-x-1 transition-transform">{t.name}</span>
                                                <span className="text-[8px] text-neutral-600 font-bold uppercase tracking-widest">
                                                    Joined: {new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 hidden lg:table-cell">
                                        <div className="inline-flex items-center px-3 py-1.5 bg-neutral-900 border border-white/[0.03] rounded-lg group-hover:border-red-500/20 transition-colors">
                                            <code className="text-red-400/70 text-[11px] font-mono tracking-tighter">
                                                {t.slug}.qrsaas.com
                                            </code>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col gap-1">
                                            <TenantStatusToggle 
                                                tenantId={t.id} 
                                                initialStatus={t.status || 'pending'} 
                                            />
                                            {t.status === 'pending' && (
                                                <div className="flex items-center gap-2 mt-2">
                                                    <button 
                                                        onClick={async () => {
                                                            const res = await updateTenantStatus(t.id, 'active');
                                                            if (res.success) window.location.reload();
                                                            else alert(res.error || 'Failed to approve');
                                                        }}
                                                        className="px-2 py-1 bg-green-600 text-[9px] font-bold uppercase tracking-widest text-white rounded hover:bg-green-500 transition-colors"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button 
                                                        onClick={async () => {
                                                            if (confirm('Permanently reject this infrastructure request?')) {
                                                                const res = await updateTenantStatus(t.id, 'rejected');
                                                                if (res.success) window.location.reload();
                                                                else alert(res.error || 'Failed to reject');
                                                            }
                                                        }}
                                                        className="px-2 py-1 bg-neutral-800 text-[9px] font-bold uppercase tracking-widest text-neutral-400 rounded hover:bg-red-600 hover:text-white transition-all"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="space-y-1">
                                            <div className="scale-90 origin-left">
                                                <TenantTierSelect 
                                                    tenantId={t.id} 
                                                    currentTier={t.tier || 'free'} 
                                                />
                                            </div>
                                            {t.owner && (
                                                <div className="pt-2 border-t border-white/5 mt-2">
                                                    <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest leading-none mb-1">Owner Ident</p>
                                                    <p className="text-[10px] font-bold text-neutral-300 truncate max-w-[120px]">{t.owner.phone_number || 'No Phone'}</p>
                                                    <p className="text-[8px] font-medium text-neutral-600 truncate max-w-[120px]">{t.owner.email}</p>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <LoginAsMerchantButton tenantSlug={t.slug} />
                                            <div className="h-4 w-[1px] bg-white/5" />
                                            <a 
                                                href={`${process.env.NEXT_PUBLIC_PROTOCOL || 'http'}://${t.slug}.${process.env.NEXT_PUBLIC_BASE_DOMAIN || 'localhost:3000'}`} 
                                                target="_blank"
                                                className="w-9 h-9 rounded-lg bg-neutral-900 border border-white/[0.03] flex items-center justify-center text-neutral-600 hover:text-white hover:bg-neutral-800 transition-all active:scale-90"
                                                title="Open External URL"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredTenants.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-14 h-14 bg-neutral-900 rounded-2xl border border-white/[0.05] flex items-center justify-center">
                                                <ShieldCheck className="w-7 h-7 text-neutral-700" />
                                            </div>
                                            <p className="text-neutral-600 italic font-medium text-sm">No merchants match your search.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
