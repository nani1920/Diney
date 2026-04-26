'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Store, 
  Plus, 
  ChevronRight, 
  ShieldCheck, 
  Clock, 
  ShieldAlert, 
  Loader2,
  LayoutDashboard,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MerchantDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/admin/login');
        return;
      }
      setUser(user);

      const { data: stores } = await supabase
        .from('tenants')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (!stores || stores.length === 0) {
        router.push('/admin/onboarding');
        return;
      }

      setTenants(stores);
      setLoading(false);
    }
    loadData();
  }, [router]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error.message);
    }
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 selection:bg-red-500/30">
      { }
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#025E43]/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#025E43]/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <img src="/logo.png" alt="Diney" className="h-10 w-auto" />
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#025E43] rounded-lg shadow-lg shadow-[#025E43]/20">
                  <LayoutDashboard size={20} className="text-white" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#025E43]">Merchant Registry</span>
              </div>
            </div>
            <h1 className="text-5xl font-bold italic uppercase tracking-tighter mb-2">
              Command <span className="text-neutral-700">Center</span>
            </h1>
            <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Logged In As: {user?.email}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-6 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-white/10 transition-all active:scale-95"
            >
              <LogOut size={16} />
              Sign Out
            </button>
            <button
              onClick={() => router.push('/admin/onboarding')}
              className="group flex items-center gap-3 px-8 py-4 bg-white text-black rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-neutral-200 transition-all active:scale-95 shadow-xl shadow-white/5"
            >
              <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
              Register New Store
            </button>
          </div>
        </header>

        {tenants.length === 0 ? (
          <EmptyState onAction={() => router.push('/admin/onboarding')} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode='popLayout'>
              {tenants.map((tenant, idx) => (
                <StoreCard 
                  key={tenant.id} 
                  tenant={tenant} 
                  index={idx}
                  onSelect={(slug: string) => {
                    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'localhost:3000';
                    const protocol = process.env.NEXT_PUBLIC_PROTOCOL || 'http';
                    
                     
                    const targetUrl = `${protocol}://${slug}.${baseDomain}/admin`;
                    
                    window.location.href = targetUrl;
                  }}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>


      <footer className="max-w-6xl mx-auto mt-20 pt-8 border-t border-white/5 flex justify-between items-center opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-[#025E43]" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Authorized Merchant Portal</span>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest">© 2026 QRSAAS INFRASTRUCTURE</p>
      </footer>
    </div>
  );
}

function StoreCard({ tenant, index, onSelect }: { tenant: any, index: number, onSelect: any }) {
  const isPending = tenant.status === 'pending';
  const isBlocked = tenant.status === 'suspended' || tenant.status === 'rejected';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={() => !isBlocked && onSelect(tenant.slug)}
      className={`group relative p-8 rounded-[2.5rem] border transition-all duration-500 cursor-pointer ${
        isBlocked 
          ? "bg-red-950/20 border-red-900/30 opacity-60 pointer-events-none" 
          : "bg-neutral-900/40 border-white/5 hover:border-red-600/30 hover:bg-neutral-900/80 shadow-2xl"
      }`}
    >
      <div className="flex items-start justify-between mb-8">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
          isBlocked ? "bg-red-900/20 text-red-500" : isPending ? "bg-neutral-800 text-neutral-500" : "bg-[#025E43] text-white shadow-xl shadow-[#025E43]/20"
        }`}>
          <Store size={28} />
        </div>
        
        <StatusBadge status={tenant.status} />
      </div>

      <div>
        <h3 className="text-2xl font-bold italic uppercase tracking-tight mb-1 group-hover:text-[#025E43] transition-colors">
          {tenant.name}
        </h3>
        <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
          {tenant.slug}.{process.env.NEXT_PUBLIC_BASE_DOMAIN || 'diney.in'}
        </p>
      </div>

      <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
        <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest italic group-hover:text-neutral-400">
          Access Protocol: {tenant.status === 'active' ? 'Full Authority' : 'Restricted'}
        </span>
        <ChevronRight size={16} className="text-neutral-700 group-hover:text-[#025E43] group-hover:translate-x-1 transition-all" />
      </div>

      { }
      <div className="absolute inset-0 rounded-[2.5rem] bg-[#025E43] blur-[80px] opacity-0 group-hover:opacity-[0.03] transition-opacity pointer-events-none" />
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    active: { bg: 'bg-green-500/10', text: 'text-green-500', icon: ShieldCheck, label: 'Verified' },
    pending: { bg: 'bg-amber-500/10', text: 'text-amber-500', icon: Clock, label: 'Auditing' },
    suspended: { bg: 'bg-red-500/10', text: 'text-red-500', icon: ShieldAlert, label: 'Suspended' },
    rejected: { bg: 'bg-red-500/10', text: 'text-red-500', icon: ShieldAlert, label: 'Rejected' },
  };

  const current = styles[status] || styles.pending;
  const Icon = current.icon;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${current.bg} ${current.text} border border-current/10`}>
      <Icon size={12} />
      <span className="text-[9px] font-bold uppercase tracking-[0.15em]">{current.label}</span>
    </div>
  );
}

function EmptyState({ onAction }: { onAction: any }) {
  return (
    <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-neutral-900/10">
      <div className="w-20 h-20 bg-neutral-800 rounded-3xl flex items-center justify-center mx-auto mb-8 text-neutral-500">
        <Store size={40} />
      </div>
      <h2 className="text-3xl font-bold italic uppercase tracking-tighter mb-4">No Active Records</h2>
      <p className="text-neutral-500 font-bold max-w-sm mx-auto mb-10 text-sm leading-relaxed uppercase tracking-widest opacity-60">
        Your merchant credentials haven't been linked to any store infrastructure yet.
      </p>
      <button
        onClick={onAction}
        className="px-10 py-5 bg-[#025E43] text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-[#1A1A1A] transition-all active:scale-95 shadow-2xl shadow-[#025E43]/20"
      >
        Launch First Store
      </button>
    </div>
  );
}
