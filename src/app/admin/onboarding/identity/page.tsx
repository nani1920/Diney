'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast, Toaster } from 'react-hot-toast';
import { ShieldCheck, Smartphone, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

function IdentityForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function checkIdentity() {
       
      const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'localhost:3000';
      const protocol = process.env.NEXT_PUBLIC_PROTOCOL || 'http';
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost' && baseDomain.includes('lvh.me')) {
        window.location.href = `${protocol}://${baseDomain}${window.location.pathname}${window.location.search}${window.location.hash}`;
        return;
      }

       
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
         
        const loginUrl = returnTo 
          ? `/admin/login?returnTo=${encodeURIComponent(returnTo)}`
          : `/admin/login`;
        router.push(loginUrl);
        return;
      }

       
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.phone_number) {
        if (returnTo) {
          router.push(returnTo);
        } else {
          router.push('/admin/dashboard');
        }
        return;
      }

      setUser({ ...profile, email: user.email });
      setLoading(false);
    }
    checkIdentity();
  }, [router, returnTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
     
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      toast.error('Please enter a valid international mobile number');
      return;
    }

    setSubmitting(true);
    
     
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      toast.error('Session expired. Please login again.');
      const loginUrl = returnTo 
        ? `/admin/login?returnTo=${encodeURIComponent(returnTo)}`
        : `/admin/login`;
      router.push(loginUrl);
      return;
    }

     
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: authUser.id,
        email: authUser.email,
        phone_number: phoneNumber,
        full_name: authUser.user_metadata?.full_name || 'Merchant Owner'
      });

    setSubmitting(false);

    if (!error) {
      toast.success('Identity calibrated successfully');
      if (returnTo) {
        router.push(returnTo);
      } else {
        router.push('/admin/dashboard');
      }
    } else {
      toast.error(error.message || 'Calibration failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCFAF7] flex flex-col items-center justify-center p-6 selection:bg-emerald-500/30">
      <Toaster />
      
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-emerald-500/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-emerald-500/5 blur-[120px] rounded-full animate-pulse delay-700" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center mb-8"
          >
            <img src="/logo.png" alt="Diney" className="h-20 w-auto drop-shadow-sm" />
          </motion.div>
          
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-3 uppercase italic">
            Secure <span className="text-[#025E43]">Registry</span>
          </h1>
          <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px]">
            Calibrating your merchant credentials
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-xl p-10 rounded-[3rem] border border-white/20 shadow-2xl shadow-emerald-900/5 space-y-8">
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
              <p className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-widest mb-1 text-center">Authenticated As</p>
              <p className="text-sm font-bold text-gray-900 text-center truncate">{user?.email || 'Authenticated User'}</p>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">
                Business Contact Number
              </label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#025E43] transition-colors">
                  <Smartphone size={20} />
                </div>
                <input
                  type="tel"
                  placeholder="+91 XXXXX XXXXX"
                  required
                  className="w-full h-16 bg-gray-50 rounded-2xl pl-14 pr-8 text-gray-900 font-bold placeholder:text-gray-300 border-2 border-transparent focus:border-[#025E43] focus:bg-white outline-none transition-all shadow-sm"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
              <div className="flex items-start gap-2 ml-1">
                <ShieldCheck size={14} className="text-emerald-500 mt-0.5" />
                <p className="text-[10px] text-gray-400 font-bold leading-relaxed">
                  Required for automated payouts and platform security verification.
                </p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-16 bg-gradient-to-r from-[#025E43] to-[#014230] text-white rounded-2xl font-bold uppercase tracking-[0.1em] text-[13px] flex items-center justify-center gap-3 hover:from-[#014230] hover:to-[#025E43] transition-all duration-500 active:scale-[0.98] shadow-2xl shadow-emerald-900/40 disabled:opacity-50 disabled:scale-100 group overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            {submitting ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <>
                Confirm Identity <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform duration-300" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-10 flex items-center justify-center gap-2">
          <Sparkles size={12} className="text-[#025E43]" />
          Bank-Grade Encrypted Session
        </p>
      </motion.div>
    </div>
  );
}

export default function IdentityCalibrationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
      </div>
    }>
      <IdentityForm />
    </Suspense>
  );
}
