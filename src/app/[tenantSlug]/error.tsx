'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Runtime Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mb-8 shadow-sm">
        <AlertCircle className="w-10 h-10 text-red-500" />
      </div>

      <div className="space-y-3 mb-10">
        <h1 className="text-[24px] font-black text-neutral-900 tracking-tight uppercase italic">
          Oops! Something <span className="text-red-500">Went Wrong</span>
        </h1>
        <p className="text-[14px] text-neutral-500 font-medium max-w-[280px] mx-auto leading-relaxed">
          We encountered an unexpected error. Don't worry, your cart is safe.
        </p>
      </div>

      <div className="w-full max-w-xs space-y-3">
        <button
          onClick={() => reset()}
          className="w-full h-14 bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
        >
          <RefreshCw size={18} />
          Try Again
        </button>

        <Link href="/" className="block">
          <button className="w-full h-14 bg-white text-neutral-900 border border-neutral-200 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all">
            <Home size={18} />
            Back to Home
          </button>
        </Link>
      </div>

      <p className="mt-8 text-[11px] text-neutral-300 font-bold uppercase tracking-widest">
        Official Merchant Pipeline • Secure Error Recovery
      </p>
    </div>
  );
}
