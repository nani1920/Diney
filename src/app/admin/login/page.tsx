'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast, Toaster } from 'react-hot-toast';
import { Chrome, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        if (returnTo) {
          router.push(returnTo);
        } else {
          router.push('/admin/onboarding/identity');
        }
      }
    };
    checkUser();
  }, [router, returnTo]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    const nextUrl = returnTo 
      ? `/admin/onboarding/identity?returnTo=${encodeURIComponent(returnTo)}`
      : `/admin/onboarding/identity`;

    const protocol = process.env.NEXT_PUBLIC_PROTOCOL || 'http';
    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'localhost:3000';
    const origin = `${protocol}://${baseDomain}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}${nextUrl}`
      }
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    
    const nextUrl = returnTo 
      ? `/admin/onboarding/identity?returnTo=${encodeURIComponent(returnTo)}`
      : `/admin/onboarding/identity`;

    const protocol = process.env.NEXT_PUBLIC_PROTOCOL || 'http';
    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'localhost:3000';
    const origin = `${protocol}://${baseDomain}`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}${nextUrl}`
      }
    });

    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Magic link sent to your email.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFAF7] mesh-gradient-aura flex flex-col items-center justify-center p-6 selection:bg-[#025E43]/20">
      <Toaster />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <div className="flex items-center justify-center mb-8">
            <img src="/logo.png" alt="Diney" className="h-20 w-auto transform scale-110" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-black mb-2">
            Merchant Login
          </h1>
          <p className="text-sm text-black/40 font-medium">
            Access your restaurant dashboard
          </p>
        </div>

        <div className="bg-white border border-black/[0.03] rounded-3xl p-8 shadow-xl space-y-6">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full h-14 bg-[#1A1A1A] text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-[#025E43] transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <Chrome size={18} />
            Continue with Google
          </button>

          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-black/[0.05]" />
            <span className="text-[10px] font-bold text-black/20 uppercase tracking-widest">or email</span>
            <div className="h-px flex-1 bg-black/[0.05]" />
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20" size={18} />
              <input
                type="email"
                placeholder="Email address"
                className="w-full h-14 bg-[#FCFAF7] rounded-2xl pl-12 pr-4 text-black font-medium border border-black/[0.05] focus:border-[#025E43]/30 outline-none transition-all text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full h-14 bg-white text-black border border-black/10 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-black/5 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin text-[#025E43]" /> : (
                <>
                  Send Magic Link <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-black/30 font-bold uppercase tracking-widest mt-10">
          SECURE ENCRYPTED ACCESS
        </p>
      </motion.div>
    </div>
  );
}

export default function MerchantLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FCFAF7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#025E43] animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
