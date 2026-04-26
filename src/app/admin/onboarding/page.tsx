'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { registerTenant } from '@/app/actions/tenant';
import { toast, Toaster } from 'react-hot-toast';
import { Store, Globe, ArrowRight, Loader2, ChevronLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';

import { getProfile } from '@/app/actions/profile';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: ''
  });

  useEffect(() => {
    async function checkAuth() {
       
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/admin/login');
        return;
      }

       
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone_number')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.phone_number) {
        router.push('/admin/onboarding/identity');
        return;
      }
      setLoading(false);
    }
    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.slug) {
      toast.error('Please fill in all fields');
      return;
    }

    console.log('Submitting store registration:', formData);
    setSubmitting(true);
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Auth check failed:', authError);
        toast.error('Session expired. Please login again.');
        router.push('/admin/login');
        return;
      }

      console.log('Calling registerTenant...');
      const result = await registerTenant(formData.name, formData.slug.toLowerCase(), user.id);
      console.log('registerTenant result:', result);
      
      if (result.success) {
        toast.success('Registry request transmitted!');
        setTimeout(() => {
          window.location.href = '/admin/onboarding/pending';
        }, 1500);
      } else {
        toast.error(result.error || 'Registration failed');
      }
    } catch (err: any) {
      console.error('Fatal error in handleSubmit:', err);
      toast.error('An unexpected error occurred. Check browser console.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
     return (
       <div className="min-h-screen bg-[#FCFAF7] flex flex-col items-center justify-center">
         <Loader2 className="w-8 h-8 text-[#025E43] animate-spin" />
       </div>
     );
  }

  return (
    <div className="min-h-screen bg-[#FCFAF7] flex flex-col items-center justify-center p-6 relative selection:bg-emerald-500/30">
      <Toaster />
      
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 -right-1/4 w-1/2 h-1/2 bg-emerald-500/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/3 -left-1/4 w-1/2 h-1/2 bg-emerald-500/5 blur-[120px] rounded-full animate-pulse delay-1000" />
      </div>
      
      <div className="absolute top-8 left-8 z-20">
        <Link 
          href="/admin/dashboard" 
          className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md rounded-xl text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-[#025E43] transition-all border border-gray-100 shadow-sm active:scale-95"
        >
          <ChevronLeft size={14} />
          Command Center
        </Link>
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
            className="flex items-center justify-center mb-8"
          >
            <img src="/logo.png" alt="Diney" className="h-20 w-auto drop-shadow-sm" />
          </motion.div>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2 uppercase italic">Launch <span className="text-[#025E43]">Infrastructure</span></h1>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">The sub-second portal to your digital storefront.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-xl p-10 rounded-[3rem] shadow-2xl shadow-emerald-900/5 space-y-8 border border-white/20">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Shop Name</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Mamas Pizza"
                  className="w-full h-16 bg-gray-50/50 rounded-2xl px-6 border-2 border-transparent focus:border-[#025E43] focus:bg-white outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Your Subdomain</label>
              <div className="relative flex items-center group">
                <div className="absolute left-6 text-gray-300 group-focus-within:text-[#025E43] transition-colors">
                  <Globe size={18} />
                </div>
                <input
                  type="text"
                  placeholder="mamas"
                  className="w-full h-16 bg-gray-50/50 rounded-2xl pl-14 pr-32 border-2 border-transparent focus:border-[#025E43] focus:bg-white outline-none transition-all font-bold text-gray-900 lowercase placeholder:text-gray-300"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.replace(/[^a-zA-Z0-9-]/g, '') })}
                />
                <div className="absolute right-6 text-gray-400 font-bold text-xs uppercase tracking-tighter">.diney.tech</div>
              </div>
              <p className="text-[9px] text-gray-400 mt-2 ml-1 uppercase tracking-widest font-bold flex items-center gap-1">
                <Sparkles size={10} className="text-emerald-500" />
                Only letters, numbers, and hyphens
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || loading}
            className="w-full h-16 bg-gradient-to-r from-[#025E43] to-[#014230] text-white rounded-2xl font-bold uppercase tracking-[0.1em] text-[13px] flex items-center justify-center gap-3 hover:from-[#014230] hover:to-[#025E43] transition-all duration-500 active:scale-[0.98] shadow-2xl shadow-emerald-900/40 disabled:opacity-50 disabled:scale-100 group overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            {submitting ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <>
                Create My Store <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform duration-300" />
              </>
            )}
          </button>
        </form>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-10"
        >
          <Link 
            href="/admin/dashboard"
            className="text-[10px] font-bold uppercase tracking-widest text-[#025E43] hover:opacity-70 transition-opacity flex items-center justify-center gap-2"
          >
            Go to Command Center
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
