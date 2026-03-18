"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

export default function LegalLayout({ children, title }: { children: React.ReactNode, title: string }) {
   return (
      <div className="min-h-screen bg-[#FCFAF7] text-black font-sans selection:bg-[#025E43] selection:text-white">
         <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-8 flex justify-center">
            <div className="w-full max-w-5xl flex justify-between items-center glass-morphism px-8 py-4 rounded-full border border-black/[0.03]">
               <Link href="/" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-black/50 hover:text-black transition-all">
                  <ArrowLeft size={14} />
                  <span>Back to Sovereign</span>
               </Link>
               <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#025E43]">Legal / {title}</span>
            </div>
         </nav>

         <main className="pt-48 pb-32 px-6">
            <div className="max-w-4xl mx-auto space-y-20">
               <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1 }}
               >
                  <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-8">{title}</h1>
                  <div className="w-24 h-1 bg-[#025E43]" />
               </motion.div>

               <div className="prose prose-xl prose-stone max-w-none">
                  {children}
               </div>
            </div>
         </main>
      </div>
   );
}
