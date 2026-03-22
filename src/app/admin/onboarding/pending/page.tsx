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
        const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'localhost:3000';
        const protocol = process.env.NEXT_PUBLIC_PROTOCOL || 'http';
        
        // Always jump to subdomain in production
        if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
          window.location.href = `${protocol}://${tenant.slug}.${baseDomain}/admin`;
          return;
        }
        
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
    <div className="min-h-screen bg-[#FCFAF7] flex flex-col items-center justify-center p-6 selection:bg-emerald-500/30">
      
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(52,211,153,0.03)_0%,transparent_70%)]" />
      </div>

      <div className="w-full max-w-2xl relative z-10 text-center">
        {/* Animated Calibration Visual */}
        <div className="relative inline-block mb-16">
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.05, 1],
            }}
            transition={{ 
              rotate: { duration: 15, repeat: Infinity, ease: "linear" },
              scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
            }}
            className="w-48 h-48 border border-emerald-600/20 rounded-full flex items-center justify-center relative"
          >
            <motion.div 
               animate={{ opacity: [0.2, 1, 0.2] }}
               transition={{ duration: 2, repeat: Infinity }}
               className="absolute inset-0 border-t-2 border-[#025E43] rounded-full"
            />
            <Target size={64} className="text-[#025E43] drop-shadow-[0_0_15px_rgba(2,94,67,0.4)]" />
          </motion.div>
          
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
            <div className="px-6 py-2 bg-gradient-to-r from-[#025E43] to-[#014230] text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full shadow-2xl shadow-emerald-900/20 whitespace-nowrap">
              Registry Transmitted
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 tracking-tighter italic uppercase leading-tight">
            Calibration <span className="text-gray-300">In</span> <br />
            <span className="text-[#025E43]">Progress</span>
          </h1>
          
          <p className="text-gray-500 font-bold text-lg max-w-lg mx-auto leading-relaxed">
            Our platform authorities are currently calibrating your merchant registry record. Your infrastructure will be provisioned shortly.
          </p>
        </motion.div>

        {/* Status Indicators */}
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

        <div className="mt-16 pt-12 border-t border-gray-100">
          <div className="flex flex-col md:flex-row items-center justify-center gap-10 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
             <div className="flex items-center gap-2">
                <Mail size={14} className="text-gray-400" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Verification Email Sent</span>
             </div>
             <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-[#025E43]" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ETA: ~24 Hours</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusChip({ icon: Icon, label, status, active }: any) {
  return (
    <div className={`p-8 rounded-[2.5rem] border transition-all duration-500 ${
      active 
        ? "bg-emerald-50 border-emerald-100 shadow-[0_0_30px_rgba(2,94,67,0.05)]" 
        : "bg-gray-50/50 border-gray-100"
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
          active ? "bg-[#025E43] text-white shadow-lg shadow-emerald-900/20" : "bg-gray-200/50 text-gray-400"
        }`}>
          <Icon size={24} />
        </div>
        {active && (
          <div className="w-2 h-2 bg-[#025E43] rounded-full animate-ping" />
        )}
      </div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-sm font-black italic uppercase ${active ? "text-[#025E43]" : "text-gray-400"}`}>{status}</p>
    </div>
  );
}
