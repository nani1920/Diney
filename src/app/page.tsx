"use client";

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
   Loader2,
   ArrowRight,
   Monitor,
   CheckCircle2,
   Smartphone,
   ShieldCheck,
   Zap,
   Globe,
   QrCode,
   MousePointer2,
   Cpu
} from 'lucide-react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

export default function SovereignLanding() {
   const router = useRouter();
   const [isChecking, setIsChecking] = useState(true);

   const { scrollYProgress } = useScroll();
   const smoothProgress = useSpring(scrollYProgress, { stiffness: 50, damping: 20, restDelta: 0.001 });
   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    
   const heroOpacity = useTransform(smoothProgress, [0, 0.15], [1, 0]);
   const heroScale = useTransform(smoothProgress, [0, 0.2], [1, 0.9]);
   const heroY = useTransform(smoothProgress, [0, 0.2], [0, -50]);

    
   const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
   useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
         setMousePos({ x: e.clientX, y: e.clientY });
      };
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
   }, []);

   useEffect(() => {
      const checkUser = async () => {
         const { data: { user } } = await supabase.auth.getUser();
         if (user) {
            router.push('/admin/onboarding/identity');
         } else {
            setIsChecking(false);
         }
      };
      checkUser();
   }, [router]);

   if (isChecking) {
      return (
         <div className="min-h-screen bg-[#FCFAF7] flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-[#025E43] animate-spin" />
         </div>
      );
   }

   return (
      <div className="min-h-screen bg-[#FCFAF7] text-black selection:bg-[#025E43] selection:text-white font-sans mesh-gradient-aura">

         { }
         <motion.div 
            className="fixed inset-0 pointer-events-none z-[9999]"
            animate={{
               background: `radial-gradient(1000px circle at ${mousePos.x}px ${mousePos.y}px, rgba(2, 94, 67, 0.03), transparent 80%)`
            }}
         />

         { }
         <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/p6.png')]" />
         <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#025E43]/[0.03] blur-[150px] rounded-full pointer-events-none" />

         { }
         <div className="fixed top-4 md:top-8 left-0 right-0 z-[100] px-4 md:px-12 flex justify-center">
            <motion.nav
               initial={{ y: -100, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
               className="w-full max-w-[1100px] glass-morphism py-3 md:py-4 px-6 md:px-10 flex items-center justify-between rounded-[1.5rem] md:rounded-[2.5rem] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.1)] border border-white/50 backdrop-blur-2xl"
            >
               <div className="flex items-center">
                  <img src="/logo.png" alt="Diney" className="h-8 md:h-10 w-auto hover:opacity-80 transition-all cursor-pointer transform scale-[1.2] md:scale-[1.5] origin-left ml-2" />
               </div>

               <div className="hidden md:flex items-center gap-12">
                  {['Features', 'Market', 'Pricing'].map(item => (
                     <a key={item} href={`#${item.toLowerCase()}`} className="relative group text-[11px] font-black uppercase tracking-[0.3em] text-black/50 hover:text-black transition-all">
                        <span>{item}</span>
                        <span className="absolute -bottom-1 left-0 w-0 h-[1.5px] bg-[#025E43] group-hover:w-full transition-all duration-500" />
                     </a>
                  ))}
                  <Link href="/admin/login" className="ml-4 px-8 py-3 bg-[#1A1A1A] text-white rounded-full text-[10px] font-black uppercase tracking-[0.25em] hover:bg-[#025E43] transition-all hover:scale-105 active:scale-95 shadow-lg shadow-black/10">
                     Join Sovereign
                  </Link>
               </div>

               { }
               <div className="md:hidden flex items-center gap-4">
                  <button 
                     onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                     className="w-10 h-10 rounded-full bg-black/5 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:bg-black/10 transition-colors z-[101]"
                  >
                     <motion.div 
                        animate={mobileMenuOpen ? { rotate: 45, y: 3.5 } : { rotate: 0, y: 0 }}
                        className="w-5 h-[1.5px] bg-black origin-center" 
                     />
                     <motion.div 
                        animate={mobileMenuOpen ? { opacity: 0 } : { opacity: 1 }}
                        className="w-5 h-[1.5px] bg-black" 
                     />
                     <motion.div 
                        animate={mobileMenuOpen ? { rotate: -45, y: -3.5 } : { rotate: 0, y: 0 }}
                        className="w-5 h-[1.5px] bg-black origin-center" 
                     />
                  </button>
               </div>
            </motion.nav>

            { }
            <motion.div
               initial={false}
               animate={mobileMenuOpen ? { opacity: 1, y: 0, pointerEvents: 'auto' } : { opacity: 0, y: -20, pointerEvents: 'none' }}
               className="absolute top-20 left-4 right-4 bg-white/95 backdrop-blur-3xl rounded-[2rem] p-8 shadow-2xl border border-black/5 z-[99] md:hidden"
            >
               <div className="flex flex-col gap-8">
                  {['Features', 'Market', 'Pricing'].map((item, idx) => (
                     <motion.a 
                        key={item} 
                        href={`#${item.toLowerCase()}`} 
                        onClick={() => setMobileMenuOpen(false)}
                        initial={{ opacity: 0, x: -20 }}
                        animate={mobileMenuOpen ? { opacity: 1, x: 0 } : {}}
                        transition={{ delay: idx * 0.1 }}
                        className="text-2xl font-black uppercase tracking-tighter text-black/40 hover:text-[#025E43] transition-colors"
                     >
                        {item}
                     </motion.a>
                  ))}
                  <div className="h-[1px] bg-black/5 w-full" />
                  <Link 
                     href="/admin/login" 
                     className="w-full py-5 bg-[#1A1A1A] text-white rounded-2xl flex items-center justify-center font-black uppercase tracking-[0.2em] text-sm"
                     onClick={() => setMobileMenuOpen(false)}
                  >
                     Initialize Node
                  </Link>
               </div>
            </motion.div>
         </div>

         <main>
            { }
            <section className="relative min-h-screen flex flex-col items-center justify-center pt-44 md:pt-32 pb-20 px-6 md:px-12">
               <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{
                     hidden: { opacity: 0 },
                     visible: {
                        opacity: 1,
                        transition: {
                           staggerChildren: 0.15,
                           delayChildren: 0.2
                        }
                     }
                  }}
                  className="w-full max-w-[1400px] text-center space-y-16 relative z-10"
               >

                  { }
                  <motion.div
                     variants={{
                        hidden: { opacity: 0, y: 40 },
                        visible: { opacity: 1, y: 0, transition: { duration: 1.5, ease: [0.16, 1, 0.3, 1] } }
                     }}
                     className="space-y-4 text-center"
                  >
                     <h1 className="text-[3.5rem] md:text-[8.5rem] font-black leading-[0.9] md:leading-[0.85] tracking-[-0.08em] holographic-text will-change-transform">
                        Boost Profits with <br />
                        <span className="font-serif-lux italic font-normal text-gradient-emerald">QR Ordering.</span>
                     </h1>
                  </motion.div>

                  { }
                  <motion.p
                     variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0, transition: { duration: 1.5, ease: [0.16, 1, 0.3, 1] } }
                     }}
                     className="text-[1.1rem] md:text-[1.3rem] text-black/40 max-w-4xl mx-auto font-medium leading-relaxed tracking-tight text-center"
                  >
                     Diney is your all-in-one solution to simplify and elevate the dining experience. Let your customers effortlessly discover your restaurant, browse the menu, place orders, and pay — all seamlessly from their phones.  </motion.p>

                  { }
                  <motion.div
                     variants={{
                        hidden: { opacity: 0, scale: 0.95 },
                        visible: { opacity: 1, scale: 1, transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } }
                     }}
                     className="flex flex-col sm:flex-row gap-6 md:gap-8 justify-center pt-20 md:pt-12"
                  >
                   <Link href="/admin/login" className="group relative flex items-center gap-6 px-14 py-6 bg-[#1A1A1A] text-white rounded-full font-black text-[12px] uppercase tracking-[0.2em] transition-all hover:bg-[#025E43] hover:-translate-y-2 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)] overflow-hidden border border-white/10">
                     <span className="relative z-20">Initialize Account</span>
                     <ArrowRight size={16} className="relative z-20 group-hover:translate-x-2 transition-transform duration-700 ease-[0.16, 1, 0.3, 1]" />
                     
                     { }
                     <motion.div 
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[1.5s] ease-[0.16, 1, 0.3, 1] z-10"
                     />
                     
                     { }
                     <div className="absolute inset-0 bg-[#025E43] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-700 ease-[0.16, 1, 0.3, 1]" />
                  </Link>
                  <Link href="/legal/contact" className="px-14 py-6 border border-black/10 bg-white/5 backdrop-blur-md text-black rounded-full font-black text-[12px] uppercase tracking-[0.2em] transition-all hover:bg-black/5 hover:-translate-y-2 hover:border-black/30 flex items-center justify-center">
                     Request demo
                  </Link>
                  </motion.div>
               </motion.div>

             { }
               <motion.div 
                  initial={{ opacity: 0, y: 120 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 2, ease: [0.16, 1, 0.3, 1], delay: 0.8 }}
                  className="mt-10 md:mt-32 w-full max-w-[1400px] relative px-4 md:px-10 group perspective-3000"
               >
               { }
               <motion.div 
                  whileHover={{ rotateX: 3, rotateY: -3, scale: 1.03 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="relative z-10 aspect-[3/4] md:aspect-[16/9] bg-white rounded-[1.5rem] md:rounded-[4.5rem] p-1.5 md:p-4 border border-white/20 shadow-[0_100px_200px_-50px_rgba(0,0,0,0.15)] overflow-hidden transform-style-3d cursor-crosshair"
               >
                 <img 
                    src="/dashboard.jpg" 
                    alt="Diney Sovereign Dashboard" 
                    className="w-full h-full object-cover rounded-[1.2rem] md:rounded-[3.8rem] brightness-[1.01] contrast-[1.02]"
                 />
                 
                 { }
                 <div className="hidden md:block absolute top-[45%] left-1/2 -translate-x-1/2 pointer-events-none z-30">
                    <motion.div 
                       animate={{ y: [0, -10, 0] }}
                       transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                       className="px-8 py-3 bg-black/40 backdrop-blur-3xl border border-white/20 rounded-full shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)]"
                    >
                       <span className="text-[11px] font-black text-white uppercase tracking-[0.5em] drop-shadow-2xl">CORE VELOCITY HUB</span>
                    </motion.div>
                 </div>

                 { }
                 <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none" />
                 <div className="absolute inset-0 bg-[radial-gradient(100%_100%_at_50%_0%,rgba(255,255,255,0.1)_0%,transparent_100%)] pointer-events-none" />
              </motion.div>

              { }
              <motion.div 
                 initial={{ x: 100, opacity: 0 }}
                 whileInView={{ x: 0, opacity: 1 }}
                 transition={{ delay: 1.2, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                 className="hidden md:block absolute -top-12 -right-6 z-20 w-80 glass-morphism p-8 rounded-[2.5rem] shadow-2xl border border-white/50 backdrop-blur-3xl"
              >
                 <div className="space-y-6">
                    <div className="flex justify-between items-end">
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#025E43] mb-1">Elite Performance</p>
                          <p className="text-3xl font-bold tracking-tighter text-[#1A1A1A]">+₹12.8L</p>
                       </div>
                       <div className="flex gap-1 h-12 items-end">
                          {[0.4, 0.7, 0.5, 0.9, 0.6].map((h, i) => (
                             <motion.div 
                                key={i}
                                initial={{ height: 0 }}
                                animate={{ height: `${h * 100}%` }}
                                transition={{ delay: 2 + (i * 0.1), duration: 1 }}
                                className="w-2 bg-[#025E43] rounded-t-sm"
                             />
                          ))}
                       </div>
                    </div>
                    <div className="h-[1px] bg-black/5 w-full" />
                    <div className="flex items-center gap-3">
                       <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                       <p className="text-[10px] font-bold uppercase tracking-widest text-black/30">Live Pulse Active</p>
                    </div>
                 </div>
              </motion.div>

              { }
              <motion.div 
                 initial={{ x: -100, opacity: 0 }}
                 whileInView={{ x: 0, opacity: 1 }}
                 transition={{ delay: 1.4, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                 className="hidden md:block absolute -bottom-12 -left-8 z-20 w-72 bg-black/[0.92] backdrop-blur-2xl p-8 rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white/10"
              >
                 <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                    <div className="w-14 h-14 bg-[#025E43] rounded-2xl flex items-center justify-center shadow-lg shadow-[#025E43]/20">
                       <Zap className="text-white" size={24} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Instant Settle</p>
                       <p className="text-xl font-bold text-white tracking-tight">Real-time Node</p>
                    </div>
                 </div>
              </motion.div>

              { }
              <motion.div 
                 initial={{ y: -50, opacity: 0 }}
                 whileInView={{ y: 0, opacity: 1 }}
                 transition={{ delay: 1.6, duration: 1 }}
                 className="absolute top-10 -left-12 z-0 hidden xl:block"
              >
                 <div className="p-8 bg-white/40 backdrop-blur-md rounded-[3rem] border border-white/20 shadow-xl flex flex-col items-center gap-2">
                    <Smartphone size={24} className="text-[#025E43]/40" />
                    <span className="text-2xl font-black text-black/10">MOBILE-FIRST</span>
                 </div>
              </motion.div>

              { }
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-radial from-[#025E43]/[0.05] to-transparent pointer-events-none -z-10 blur-[100px]" />
           </motion.div>
            </section>

            { }
            <section id="features" className="pt-40 md:pt-24 pb-48 bg-white relative overflow-hidden mesh-gradient-aura scroll-mt-32 md:scroll-mt-32">
               { }
               <div className="absolute top-[10%] left-[-10%] w-[60%] h-[60%] bg-[#025E43]/[0.05] blur-[180px] rounded-full pointer-events-none animate-pulse-slow" />
               <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] bg-[#025E43]/[0.03] blur-[150px] rounded-full pointer-events-none" />

               <div className="w-full max-w-[1440px] mx-auto px-12 relative z-10">
                  <motion.div 
                     initial={{ opacity: 0, y: 40 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                     viewport={{ once: true }}
                     className="text-center mb-40"
                  >
                     <h2 className="text-[4rem] md:text-[7.5rem] font-black tracking-[-0.08em] leading-[0.85] mb-12 holographic-text">
                        The Art of <br />
                        <span className="font-serif-lux italic font-normal text-gradient-emerald">Frictionless Flow.</span>
                     </h2>
                     <p className="text-xl text-black/40 font-medium leading-relaxed max-w-2xl mx-auto">
                        We removed the barriers between your food and your customers. Diney provides the ultimate digital interface for elite restaurants.
                     </p>
                  </motion.div>

                  <div className="grid md:grid-cols-3 gap-10">
                     <SovereignFeature 
                        icon={<Zap size={32} />}
                        title="Instant Velocity"
                        desc="Synchronized real-time ordering engine for high-output kitchens."
                     />
                     <SovereignFeature 
                        icon={<ShieldCheck size={32} />}
                        title="Sovereign Security"
                        desc="Direct bank-grade settlement protocols with end-to-end encryption."
                     />
                     <SovereignFeature 
                        icon={<Monitor size={32} />}
                        title="Command Center"
                        desc="Unified control over all restaurant locations from a single dashboard."
                     />
                  </div>
               </div>
            </section>

            <ProtocolReveal />
            <PricingSection />

            <section className="py-32 md:py-72 px-6 md:px-12 relative overflow-hidden bg-white">
               <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
                  viewport={{ once: true }}
                  className="w-full max-w-[1400px] mx-auto bg-[#1A1A1A] rounded-[5rem] py-40 px-12 md:px-32 text-center relative overflow-hidden group shadow-[0_120px_200px_-50px_rgba(0,0,0,0.5)]"
               >
                  { }
                  <div className="absolute inset-0 bg-gradient-to-br from-[#025E43]/30 via-transparent to-transparent opacity-50 transition-opacity duration-1000 group-hover:opacity-70" />
                  <div className="absolute top-[-30%] right-[-10%] w-[60%] h-[60%] bg-[#025E43]/[0.1] blur-[150px] rounded-full pointer-events-none" />
                  <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#025E43]/[0.05] blur-[120px] rounded-full pointer-events-none" />

                  <div className="relative z-10 space-y-20">
                     <motion.h2 
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 1.5 }}
                        className="text-[4.5rem] md:text-[9.5rem] font-black text-white tracking-[-0.1em] leading-[0.8] holographic-text"
                     >
                        Ready to <br />
                        <span className="font-serif-lux italic font-normal text-white/90">Take Control?</span>
                     </motion.h2>
                     <p className="text-xl md:text-2xl text-white/40 max-w-2xl mx-auto font-medium leading-relaxed">
                        Join the elite tier of restaurant owners who leverage Diney to scale their profitability and service quality.
                     </p>
                     <div className="flex flex-col sm:flex-row gap-10 justify-center pt-12 items-center">
                        <Link href="/admin/login" className="group relative px-10 md:px-16 py-4 md:py-8 bg-white text-black rounded-full font-bold text-lg md:text-2xl transition-all hover:scale-105 active:scale-95 shadow-2xl">
                           <span className="relative z-20">Initialize Account</span>
                           <div className="absolute inset-[2px] bg-[#025E43] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 rounded-full z-10" />
                           <span className="absolute inset-0 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-30">Initialize Account</span>
                        </Link>
                        <Link href="/legal/contact" className="px-10 md:px-16 py-4 md:py-8 border border-white/10 text-black rounded-full font-bold text-lg md:text-2xl hover:bg-black/5 transition-all hover:border-black/30 backdrop-blur-sm flex items-center justify-center text-center">
                           Book Consultant
                        </Link>
                     </div>
                  </div>
               </motion.div>
            </section>

         </main>

         { }
          <footer className="pt-24 md:pt-32 pb-12 px-6 md:px-12 bg-[#0A0A0A] relative overflow-hidden border-t border-white/5 text-center md:text-left">
             { }
             <div className="absolute top-0 left-1/4 w-[50%] h-[50%] bg-[#025E43]/[0.05] blur-[150px] rounded-full pointer-events-none" />
             <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#025E43]/[0.02] blur-[120px] rounded-full pointer-events-none" />

             <div className="w-full max-w-[1440px] mx-auto relative z-10 flex flex-col gap-12">
                <div className="flex flex-col lg:flex-row justify-between gap-12">
                   <div className="space-y-8">
                      <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                         <img src="/logo.png" alt="Diney" className="h-12 w-auto" />
                         <span className="text-4xl md:text-5xl font-serif-lux text-white tracking-tighter">Diney</span>
                         <div className="px-4 py-1.5 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
                            <span className="text-[10px] font-black text-[#025E43] uppercase tracking-[0.3em]">Sovereign v2.4</span>
                         </div>
                      </div>
                      <p className="text-lg md:text-xl text-white/30 font-medium max-w-sm mx-auto md:mx-0 leading-relaxed tracking-tight">
                         The infrastructure layer for elite hospitality. Defining the future of sovereign restaurant operations.
                      </p>
                      
                      { }
                      <div className="pt-4">
                         <div className="flex items-center gap-4 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl w-fit mx-auto md:mx-0 backdrop-blur-xl">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-slow shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">All Systems Nominal</span>
                         </div>
                      </div>
                   </div>
                   <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
                      <div className="lg:col-span-3">
                         <FooterList 
                            title="Index" 
                            links={[
                               { label: 'Features', href: '#features' },
                               { label: 'Market', href: '#market' },
                               { label: 'Pricing', href: '#pricing' }
                            ]} 
                         />
                      </div>
                      <div className="lg:col-span-3">
                         <FooterList 
                            title="Legal" 
                            links={[
                               { label: 'Terms & Conditions', href: '/legal/terms' },
                               { label: 'Privacy Policy', href: '/legal/privacy' },
                               { label: 'Refund Policy', href: '/legal/refund' },
                               { label: 'Pricing & Shipping', href: '/legal/shipping' }
                            ]} 
                         />
                      </div>
                      <div className="lg:col-span-2">
                         <FooterList 
                            title="Support" 
                            links={[
                               { label: 'Contact Us', href: '/legal/contact' }
                            ]} 
                         />
                      </div>
                      
                      { }
                      <div className="lg:col-span-4 space-y-8 md:space-y-10 border-t border-white/5 pt-12 lg:pt-0 lg:border-t-0">
                         <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#025E43]">Join Our Newsletter</p>
                         <div className="space-y-6">
                            <p className="text-xl font-bold text-white/40 leading-relaxed">Efficiency is on the Menu.</p>
                            <div className="space-y-4">
                               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Executive Correspondence</p>
                               <div className="relative group">
                                  <input 
                                     type="email" 
                                     placeholder="Enter your email" 
                                     className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white placeholder:text-white/20 focus:outline-none focus:border-[#025E43] transition-all text-[11px] font-black uppercase tracking-widest"
                                  />
                                  <button className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-[#025E43] rounded-xl flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-[#025E43]/20">
                                     <ArrowRight size={18} className="text-white" />
                                  </button>
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="pt-8 border-t border-white/5 flex flex-col lg:flex-row justify-between items-center gap-10 lg:gap-8 text-[10px] md:text-[11px] font-black uppercase tracking-[0.5em] text-white/20">
                   <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-16 text-center lg:text-left">
                      <p>© 2026 DINEY / MATKACAFE OPERATIONS</p>
                      <div className="flex gap-10">
                         <Link href="/legal/privacy" className="hover:text-white cursor-pointer transition-colors duration-500">GDPR Compliant</Link>
                         <Link href="/legal/security" className="hover:text-white cursor-pointer transition-colors duration-500">Secure Node</Link>
                      </div>
                   </div>
                   <div className="flex gap-12 items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#025E43]" />
                      <span className="text-white/40">Razorpay Verified Ecosystem</span>
                   </div>
                </div>
             </div>
          </footer>

      </div>
   );
}

function PricingSection() {
   const tiers = [
      {
         name: "Starter",
         badge: "Essential",
         price: "₹599",
         period: "/month",
         features: [
            "1 store / restaurant",
            "Up to 100 items",
            "Up to 10,000 orders / month",
            "QR menu + ordering",
            "Basic analytics"
         ],
         accent: false
      },
      {
         name: "Pro",
         badge: "Elite Growth",
         price: "₹1,699",
         period: "/month",
         features: [
            "Up to 3 stores",
            "Up to 500 items total",
            "Up to 50,000 orders / month",
            "Custom branding on QR",
            "Analytics dashboard",
            "Order notifications (SMS/Email)"
         ],
         accent: true
      },
      {
         name: "Premium",
         badge: "Sovereign Ultimate",
         price: "₹2,999",
         period: "/month",
         features: [
            "Unlimited stores",
            "Unlimited items",
            "Unlimited orders",
            "Payment integration",
            "Priority support",
            "Advanced analytics & reports"
         ],
         accent: false
      }
   ];

   const addOns = [
      { name: "Extra 1,000 orders", price: "₹399" },
      { name: "Extra Store", price: "₹799" },
      { name: "SMS order notifications", price: "₹399" },
      { name: "Custom QR design / branding", price: "₹499" }
   ];

   return (
      <section id="pricing" className="pt-40 md:py-48 pb-32 bg-white relative overflow-hidden scroll-mt-32 md:scroll-mt-32">
         <div className="w-full max-w-[1440px] mx-auto px-6 md:px-24">
            <motion.div 
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               transition={{ duration: 1.5 }}
               viewport={{ once: true }}
               className="text-center mb-32"
            >
               <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#025E43] mb-8">Financial Protocol</p>
               <h2 className="text-[4rem] md:text-[7.5rem] font-black tracking-[-0.08em] leading-[0.85] holographic-text">
                  Precision <br />
                  <span className="font-serif-lux italic font-normal text-gradient-emerald">Economics.</span>
               </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-10">
               {tiers.map((tier, idx) => (
                  <motion.div 
                     key={idx}
                     initial={{ opacity: 0, y: 40 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     transition={{ delay: idx * 0.15, duration: 1 }}
                     viewport={{ once: true }}
                     className={`relative group p-8 md:p-12 rounded-[2.5rem] md:rounded-[4rem] border transition-all duration-700 ${tier.accent ? 'bg-[#1A1A1A] border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)]' : 'bg-[#FCFAF7] border-black/[0.03] hover:shadow-2xl'}`}
                  >
                     {tier.accent && (
                        <div className="absolute top-0 right-0 w-full h-full bg-[#025E43]/[0.1] blur-[100px] pointer-events-none -z-10" />
                     )}
                     
                     <div className="space-y-10">
                        <div className="space-y-4">
                           <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${tier.accent ? 'text-[#025E43]' : 'text-black/20'}`}>{tier.badge}</span>
                           <h3 className={`text-4xl font-bold tracking-tight ${tier.accent ? 'text-white' : 'text-black'}`}>{tier.name}</h3>
                        </div>

                        <div className="flex items-baseline gap-2">
                           <span className={`text-5xl md:text-6xl font-black tracking-tighter ${tier.accent ? 'text-white' : 'text-black'}`}>{tier.price}</span>
                           <span className={`text-lg font-medium ${tier.accent ? 'text-white/40' : 'text-black/30'}`}>{tier.period}</span>
                        </div>

                        <div className="h-[1px] bg-black/5 w-full" />

                        <ul className="space-y-6">
                           {tier.features.map((feature, fidx) => (
                              <li key={fidx} className="flex items-start gap-4">
                                 <CheckCircle2 size={18} className={`shrink-0 mt-1 ${tier.accent ? 'text-[#025E43]' : 'text-black/20'}`} />
                                 <span className={`text-md font-medium leading-relaxed ${tier.accent ? 'text-white/60' : 'text-black/50'}`}>{feature}</span>
                              </li>
                           ))}
                        </ul>

                        <Link href="/admin/login" className={`w-full py-6 rounded-3xl font-black text-[12px] uppercase tracking-[0.2em] transition-all duration-500 hover:scale-[1.03] active:scale-95 flex items-center justify-center ${tier.accent ? 'bg-[#025E43] text-white shadow-lg shadow-[#025E43]/30' : 'bg-black text-white hover:bg-[#025E43]'}`}>
                           Initialize {tier.name}
                        </Link>
                     </div>
                  </motion.div>
               ))}
            </div>

            { }
            <motion.div 
               initial={{ opacity: 0, y: 40 }}
               whileInView={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.5, duration: 1.5 }}
               viewport={{ once: true }}
               className="mt-16 pt-16 border-t border-black/[0.03]"
            >
               <div className="text-center mb-16">
                  <h4 className="text-2xl font-bold uppercase tracking-widest text-black/20 italic">Sovereign Expansion Hub</h4>
                  <p className="text-black/40 font-medium mt-2">Granular service enhancements for scaling nodes.</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {addOns.map((item, idx) => (
                     <div key={idx} className="p-8 bg-[#FCFAF7] border border-black/[0.03] rounded-[2.5rem] flex flex-col justify-between hover:border-[#025E43]/30 transition-all group">
                        <p className="text-sm font-bold text-black/60 group-hover:text-black transition-colors">{item.name}</p>
                        <p className="text-2xl font-black text-[#025E43] mt-4">{item.price}</p>
                     </div>
                  ))}
               </div>
            </motion.div>
         </div>
      </section>
   );
}

function SovereignFeature({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
   return (
      <motion.div 
         initial={{ opacity: 0, y: 30 }}
         whileInView={{ opacity: 1, y: 0 }}
         viewport={{ once: true }}
         transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
         className="relative group p-12 bg-[#FCFAF7] border border-black/[0.03] rounded-[3.5rem] shadow-sm hover:shadow-2xl hover:shadow-[#025E43]/5 transition-all duration-700 hover:-translate-y-2 overflow-hidden"
      >
         { }
         <div className="absolute top-0 right-0 w-32 h-32 bg-[#025E43]/[0.03] blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-[#025E43]/[0.1] transition-colors duration-700" />
         
         <div className="relative z-10 space-y-8">
            <div className="w-16 h-16 bg-white border border-black/[0.03] rounded-2xl flex items-center justify-center shadow-sm text-[#025E43] group-hover:bg-[#025E43] group-hover:text-white transition-all duration-500 group-hover:rotate-6">
               {icon}
            </div>
            <div>
               <h4 className="text-3xl font-bold tracking-tight mb-4">{title}</h4>
               <p className="text-xl text-black/40 font-medium leading-relaxed">{desc}</p>
            </div>
         </div>
      </motion.div>
   );
}

function ProtocolReveal() {
   const containerRef = useRef(null);
   const { scrollYProgress } = useScroll({
      target: containerRef,
      offset: ["start start", "end end"]
   });

   const steps = [
      {
         number: "01",
         icon: <QrCode size={64} />,
         title: "Digital Sovereignty",
         desc: "Instant node activation via high-fidelity QR generation. We empower you to take full ownership of your digital storefront within seconds, ensuring your brand stands alone in an over-crowded market."
      },
      {
         number: "02",
         icon: <MousePointer2 size={64} />,
         title: "Curated Selection",
         desc: "Frictionless menu curation for high-value guests. Every interaction is designed for the elite palate, transforming a simple order into a curated hospitality journey."
      },
      {
         number: "03",
         icon: <Cpu size={64} />,
         title: "Sovereign Sync",
         desc: "Real-time kitchen orchestration with sub-millisecond lag. Our proprietary engine synchronizes every operational pulse, ensuring your kitchen operates at the speed of thought."
      },
      {
         number: "04",
         icon: <CheckCircle2 size={64} />,
         title: "Elite Settlement",
         desc: "One-tap digital settlement directly to your treasury. Capital moves without friction, ensuring your restaurant's financial heartbeat remains steady and strong."
      }
   ];

   return (
      <section id="market" ref={containerRef} className="relative h-[450vh] bg-[#FCFAF7] scroll-mt-32 md:scroll-mt-32">
         <div className="sticky top-0 h-screen w-full flex overflow-hidden relative">
            { }
            <div className="hidden lg:flex w-1/2 h-full flex-col justify-center px-24 border-r border-black/[0.03] bg-white">
               <motion.div 
                  initial={{ opacity: 0, x: -40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                  viewport={{ once: true }}
               >
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#025E43] mb-8">The Procedure</p>
                  <h2 className="text-[5rem] xl:text-[7rem] font-bold tracking-[-0.08em] leading-[0.85]">
                     How Excellence <br />
                     <span className="font-serif-lux italic font-normal text-gradient-emerald">Manifests.</span>
                  </h2>
               </motion.div>
            </div>

            { }
            <div className="w-full lg:w-1/2 h-full relative">
               { }
               <div className="lg:hidden absolute top-24 left-0 right-0 px-8 z-30 text-center">
                  <h2 className="text-[3rem] font-bold tracking-tight">The Protocol</h2>
               </div>

               {steps.map((step, index) => (
                  <RevealLayer 
                     key={index}
                     step={step}
                     index={index}
                     scrollYProgress={scrollYProgress}
                  />
               ))}
            </div>
         </div>
      </section>
   );
}

function RevealLayer({ step, index, scrollYProgress }: { step: any, index: number, scrollYProgress: any }) {
   const start = index * 0.25;
   const end = (index + 1) * 0.25;
   
   const opacity = useTransform(scrollYProgress, [start, start + 0.1, end - 0.1, end], [0, 1, 1, 0]);
   const x = useTransform(scrollYProgress, [start, start + 0.1, end], [100, 0, -50]);
   const scale = useTransform(scrollYProgress, [start, start + 0.1], [0.95, 1]);

   return (
      <motion.div 
         style={{ opacity, x, scale }}
         className="absolute inset-0 flex flex-col justify-center px-6 md:px-24 bg-white/5 backdrop-blur-3xl z-10"
      >
         <div className="space-y-12">
            <div className="w-24 h-24 bg-white border border-black/[0.03] rounded-3xl flex items-center justify-center text-[#025E43] shadow-2xl">
               {step.icon}
            </div>
            <div className="space-y-6">
               <div className="flex items-center gap-4">
                  <span className="text-[12px] font-black text-[#025E43] tracking-[0.4em] uppercase">Stage {step.number}</span>
                  <div className="h-[1px] w-12 bg-[#025E43]/20" />
               </div>
               <h4 className="text-[2.8rem] md:text-[5rem] font-bold tracking-[-0.05em] leading-[0.9]">{step.title}</h4>
               <p className="text-lg md:text-2xl text-black/40 font-medium leading-relaxed max-w-xl">
                  {step.desc}
               </p>
            </div>
            <div className="pt-12">
               <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#025E43] animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#025E43]/40">System Synchronized</span>
               </div>
            </div>
         </div>
      </motion.div>
   );
}

function FooterList({ title, items, links }: { title: string, items?: string[], links?: { label: string, href: string }[] }) {
   return (
      <div className="space-y-8">
         <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#025E43]">{title}</p>
         <ul className="space-y-5">
            {items && items.map(item => (
               <li key={item}>
                  <a href="#" className="text-sm font-bold text-white/20 hover:text-white transition-all duration-500 flex items-center gap-3 group tracking-tight">
                     <div className="w-1.5 h-1.5 rounded-full bg-[#025E43] scale-0 group-hover:scale-100 transition-transform opacity-60" />
                     {item}
                  </a>
               </li>
            ))}
            {links && links.map(link => (
               <li key={link.label}>
                  <Link href={link.href} className="text-sm font-bold text-white/20 hover:text-white transition-all duration-500 flex items-center gap-3 group tracking-tight">
                     <div className="w-1.5 h-1.5 rounded-full bg-[#025E43] scale-0 group-hover:scale-100 transition-transform opacity-60" />
                     {link.label}
                  </Link>
               </li>
            ))}
         </ul>
      </div>
   );
}
