'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { registerTenant } from '@/app/actions/tenant';
import { toast, Toaster } from 'react-hot-toast';
import { Store, Globe, ArrowRight, Loader2, ChevronLeft } from 'lucide-react';
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
      // Direct client-side check which has access to session
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/admin/login');
        return;
      }

      // Check profile directly on client
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

    setSubmitting(true);
    
    // Get auth user on client to pass ID to server action (bypasses cookie issue)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Session expired. Please login again.');
      router.push('/admin/login');
      return;
    }

    const result = await registerTenant(formData.name, formData.slug.toLowerCase(), user.id);
    setSubmitting(false);

    if (result.success) {
      toast.success('Registry request transmitted!');
      // After registration, redirect to the pending screen
      setTimeout(() => {
        window.location.href = '/admin/onboarding/pending';
      }, 1500);
    } else {
      toast.error(result.error || 'Registration failed');
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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 relative">
      <Toaster />
      
      {/* Back to Dashboard Button */}
      <div className="absolute top-8 left-8">
        <Link 
          href="/admin/dashboard" 
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-red-500 transition-colors border border-gray-100 shadow-sm"
        >
          <ChevronLeft size={14} />
          Command Center
        </Link>
      </div>
      
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center mb-8">
            <img src="/logo.png" alt="Diney" className="h-20 w-auto" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2 uppercase italic">Launch Infrastructure</h1>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">The sub-second portal to your digital storefront.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[40px] shadow-2xl shadow-gray-200 space-y-6 border border-gray-100">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Shop Name</label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Mamas Pizza"
                className="w-full h-14 bg-gray-50 rounded-2xl px-5 border-2 border-transparent focus:border-[#025E43] focus:bg-white outline-none transition-all font-medium"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Your Subdomain</label>
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="mamas"
                className="w-full h-14 bg-gray-50 rounded-2xl pl-5 pr-32 border-2 border-transparent focus:border-[#025E43] focus:bg-white outline-none transition-all font-bold lowercase"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.replace(/[^a-zA-Z0-9-]/g, '') })}
              />
              <div className="absolute right-5 text-gray-400 font-bold text-sm">.qrsaas.com</div>
            </div>
            <p className="text-[10px] text-gray-400 mt-2 ml-1 uppercase tracking-widest font-bold">Only letters, numbers, and hyphens</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-16 bg-[#025E43] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-2 hover:bg-[#1A1A1A] transition-all active:scale-95 shadow-xl shadow-[#025E43]/20 disabled:opacity-50 disabled:scale-100"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                Create My Store <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[10px] font-black uppercase tracking-widest text-[#025E43] mt-8 cursor-pointer hover:opacity-70">
            <Link href="/admin/dashboard">Go to Command Center</Link>
        </p>
      </div>
    </div>
  );
}
