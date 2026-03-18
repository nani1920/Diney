'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Target, ShieldAlert, Clock, Smartphone, Mail, Sparkles, Loader2 } from 'lucide-react';

export default function PendingCalibrationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
       
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/admin/login');
        return;
      }

       
      const { data: tenant } = await supabase
        .from('tenants')
        .select('slug, status')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })  
        .limit(1)
        .maybeSingle();

       
      if (tenant?.status === 'active') {
        router.push(`/${tenant.slug}/admin`);
        return;
      }

      setLoading(false);
    };

    checkStatus();
    
     
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 selection:bg-red-500/30">
      
      { }
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.03)_0%,transparent_70%)]" />
      </div>

      <div className="w-full max-w-2xl relative z-10 text-center">
        { }
        <div className="relative inline-block mb-16">
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.05, 1],
            }}
            transition={{ 
              rotate: { duration: 10, repeat: Infinity, ease: "linear" },
              scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
            }}
            className="w-48 h-48 border border-red-600/20 rounded-full flex items-center justify-center relative"
          >
            <motion.div 
               animate={{ opacity: [0.2, 1, 0.2] }}
               transition={{ duration: 2, repeat: Infinity }}
               className="absolute inset-0 border-t-2 border-red-600 rounded-full"
            />
            <Target size={64} className="text-red-600 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]" />
          </motion.div>
          
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
            <div className="px-4 py-1.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full shadow-2xl">
              Registry Transmitted
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter italic uppercase leading-tight">
            Calibration <span className="text-neutral-700">In</span> <br />
            <span className="text-red-600">Progress</span>
          </h1>
          
          <p className="text-neutral-500 font-bold text-lg max-w-lg mx-auto leading-relaxed">
            Our platform authorities are currently calibrating your merchant registry record. Your infrastructure will be provisioned shortly.
          </p>
        </motion.div>

        { }
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-3xl mx-auto">
          <StatusChip 
            icon={ShieldAlert} 
            label="ID Verified" 
            status="Complete" 
            active={false}
          />
          <StatusChip 
            icon={Smartphone} 
            label="Contact Sync" 
            status="Complete" 
            active={false}
          />
          <StatusChip 
            icon={Clock} 
            label="System Audit" 
            status="Processing" 
            active={true}
          />
        </div>

        <div className="mt-16 pt-12 border-t border-white/[0.03]">
          <div className="flex flex-col md:flex-row items-center justify-center gap-10 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
             <div className="flex items-center gap-2">
                <Mail size={14} className="text-neutral-500" />
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest text-[10px]">Verification Email Sent</span>
             </div>
             <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-red-600" />
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest text-[10px]">ETA: ~24 Hours</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusChip({ icon: Icon, label, status, active }: any) {
  return (
    <div className={`p-6 rounded-[2rem] border transition-all duration-500 ${
      active 
        ? "bg-red-600/5 border-red-600/30 shadow-[0_0_30px_rgba(239,68,68,0.05)]" 
        : "bg-neutral-900/40 border-white/[0.03]"
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          active ? "bg-red-600 text-white animate-pulse" : "bg-neutral-800 text-neutral-500"
        }`}>
          <Icon size={20} />
        </div>
        {active && (
          <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping" />
        )}
      </div>
      <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-sm font-bold ${active ? "text-white" : "text-neutral-400"}`}>{status}</p>
    </div>
  );
}
