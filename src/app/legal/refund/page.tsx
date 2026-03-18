"use client";

import React from 'react';
import LegalLayout from '../../legal-layout';

export default function RefundPage() {
   return (
      <LegalLayout title="Refund & Cancellation">
         <div className="space-y-12 text-black/80">
            <p className="text-xl font-medium leading-relaxed">
               Diney provides high-performance digital infrastructure. This policy outlines the refund and cancellation protocols for our SaaS subscriptions and Merchant operations.
            </p>

            <section className="space-y-6">
               <h2 className="text-2xl font-bold uppercase tracking-tight">1. SaaS Subscription Refunds</h2>
               <p className="leading-relaxed">
                  Subscriptions to Diney are billed in advance. Due to the immediate allocation of Sovereign Nodes and infrastructure overhead, we maintain a <strong>No Refund</strong> policy for all SaaS subscription fees once activation is complete.
               </p>
            </section>

            <section className="space-y-6">
               <h2 className="text-2xl font-bold uppercase tracking-tight">2. Subscription Cancellation</h2>
               <p className="leading-relaxed">
                  Merchants may cancel their subscription at any time through the Diney Admin Center. Cancellation will prevent future billing cycles but does not entitle the user to a pro-rata refund for the remaining duration of the current cycle.
               </p>
            </section>

            <section className="space-y-6">
               <h2 className="text-2xl font-bold uppercase tracking-tight">3. Food Order Refunds</h2>
               <p className="leading-relaxed">
                  Diney is a technology platform provider and does not manage food preparation or handling. For all disputes related to:
               </p>
               <ul className="list-disc pl-6 space-y-2 leading-relaxed">
                  <li>Incorrect food items or order quality.</li>
                  <li>Delays in restaurant service.</li>
                  <li>Direct customer refunds for physical transactions.</li>
               </ul>
               <p className="leading-relaxed">
                  Customers must reach out to the <strong>Merchant (Restaurant Manager)</strong> directly. Diney cannot authorize or execute refunds on behalf of the Merchant.
               </p>
            </section>

            <section className="space-y-6">
               <h2 className="text-2xl font-bold uppercase tracking-tight">4. Service Disruption</h2>
               <p className="leading-relaxed">
                  In the rare event of a prolonged technical failure on the Diney infrastructure side (exceeding 72 consecutive hours of downtime), we may, at our sole discretion, issue service credits for the next billing cycle.
               </p>
            </section>

            <section className="space-y-6">
               <h2 className="text-2xl font-bold uppercase tracking-tight">5. Contact for Disputes</h2>
               <p className="leading-relaxed">
                  For subscription-related inquiries, please contact our billing department at <strong>mr.luckymano2005@gmail.com</strong>. Include your Merchant ID and transaction reference.
               </p>
            </section>

            <div className="pt-12 border-t border-black/5 italic text-black/40">
               Policy Version: 2.4.1 (Effective March 17, 2026)
            </div>
         </div>
      </LegalLayout>
   );
}
