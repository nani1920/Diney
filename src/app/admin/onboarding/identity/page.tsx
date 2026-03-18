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
      // Force canonical domain (lvh.me) in local dev
      const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'localhost:3000';
      const protocol = process.env.NEXT_PUBLIC_PROTOCOL || 'http';
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost' && baseDomain.includes('lvh.me')) {
        window.location.href = `${protocol}://${baseDomain}${window.location.pathname}${window.location.search}${window.location.hash}`;
        return;
      }

      // Direct client-side check which has access to session
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Construct login URL with returnTo if present
        const loginUrl = returnTo 
          ? `/admin/login?returnTo=${encodeURIComponent(returnTo)}`
          : `/admin/login`;
        router.push(loginUrl);
        return;
      }

      // Fetch profile directly from client for the initial check
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
    
    // Simple structural validation (Regex for numbers)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      toast.error('Please enter a valid international mobile number');
      return;
    }

    setSubmitting(true);
    
    // Get user again to ensure fresh session
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      toast.error('Session expired. Please login again.');
      const loginUrl = returnTo 
        ? `/admin/login?returnTo=${encodeURIComponent(returnTo)}`
        : `/admin/login`;
      router.push(loginUrl);
      return;
    }

    // Direct client update
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
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 selection:bg-red-500/30">
      <Toaster />
      
      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-red-600/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-red-600/5 blur-[120px] rounded-full animate-pulse delay-700" />
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
            className="inline-flex items-center justify-center w-20 h-20 bg-red-600 rounded-[2rem] shadow-2xl shadow-red-600/40 mb-8 relative"
          >
            <ShieldCheck size={36} className="text-white" />
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-2 border border-red-600/20 rounded-[2.5rem] border-dashed"
            />
          </motion.div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-3 uppercase italic">
            Identity <span className="text-red-600">Calibration</span>
          </h1>
          <p className="text-neutral-500 font-bold uppercase tracking-[0.2em] text-[10px]">
            Finalizing merchant registry credentials
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-neutral-900/50 backdrop-blur-3xl p-10 rounded-[3rem] border border-white/5 shadow-2xl space-y-8">
          <div className="space-y-4">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1 text-center">Authenticated As</p>
              <p className="text-sm font-bold text-white text-center truncate">{user?.email || 'Authenticated User'}</p>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">
                Business Contact Number
              </label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-red-500 transition-colors">
                  <Smartphone size={20} />
                </div>
                <input
                  type="tel"
                  placeholder="+91 XXXXX XXXXX"
                  required
                  className="w-full h-16 bg-black/40 rounded-2xl pl-14 pr-8 text-white font-bold placeholder:text-neutral-700 border border-white/5 focus:border-red-600/50 outline-none transition-all"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
              <p className="text-[9px] text-neutral-600 font-bold leading-relaxed ml-1">
                Used for platform authority communications and manual registry verification.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-18 bg-red-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-red-500 transition-all active:scale-95 shadow-2xl shadow-red-600/20 disabled:opacity-50 disabled:scale-100 group"
          >
            {submitting ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <>
                Commit & Continue <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[10px] text-neutral-600 font-bold uppercase tracking-widest mt-10 flex items-center justify-center gap-2">
          <Sparkles size={12} className="text-red-600" />
          End-to-End Encrypted Registry
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
