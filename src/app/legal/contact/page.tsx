"use client";

import React from 'react';
import LegalLayout from '../../legal-layout';
import { Mail, Phone, MapPin, Building } from 'lucide-react';

export default function ContactPage() {
   return (
      <LegalLayout title="Contact Us">
         <div className="space-y-12 text-black/80">
            <p className="text-xl font-medium leading-relaxed">
               For support inquiries, legal notices, or partnership proposals, please reach out via our verified communication nodes.
            </p>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-8">
               <div className="space-y-4 p-10 bg-white border border-black/[0.03] rounded-[2.5rem] shadow-sm">
                  <div className="w-12 h-12 bg-[#025E43]/5 rounded-xl flex items-center justify-center text-[#025E43]">
                     <Building size={24} />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-black/20">Business Name</h3>
                  <p className="text-3xl font-bold tracking-tight">Diney</p>
                  <p className="text-black/40 font-medium">Sovereign QR-SaaS Operations</p>
               </div>

               <div className="space-y-4 p-10 bg-white border border-black/[0.03] rounded-[2.5rem] shadow-sm">
                  <div className="w-12 h-12 bg-[#025E43]/5 rounded-xl flex items-center justify-center text-[#025E43]">
                     <Mail size={24} />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-black/20">Support Email</h3>
                  <p className="text-2xl font-bold tracking-tight">mr.luckymano2005@gmail.com</p>
                  <p className="text-black/40 font-medium">Direct Executive Response</p>
               </div>

               <div className="space-y-4 p-10 bg-white border border-black/[0.03] rounded-[2.5rem] shadow-sm">
                  <div className="w-12 h-12 bg-[#025E43]/5 rounded-xl flex items-center justify-center text-[#025E43]">
                     <Phone size={24} />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-black/20">Operational Line</h3>
                  <p className="text-3xl font-bold tracking-tight">+91 7569964480</p>
                  <p className="text-black/40 font-medium">Available during business hours</p>
               </div>

               <div className="space-y-4 p-10 bg-white border border-black/[0.03] rounded-[2.5rem] shadow-sm">
                  <div className="w-12 h-12 bg-[#025E43]/5 rounded-xl flex items-center justify-center text-[#025E43]">
                     <MapPin size={24} />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-black/20">Physical Node</h3>
                  <p className="text-3xl font-bold tracking-tight">KNL, Andhra Pradesh</p>
                  <p className="text-black/40 font-medium">India / Operational Hub</p>
               </div>
            </section>

            <div className="pt-12 border-t border-black/5 italic text-black/40">
               Official Correspondence Node active since March 2026.
            </div>
         </div>
      </LegalLayout>
   );
}
