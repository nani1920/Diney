"use client";

import React from 'react';
import LegalLayout from '../../legal-layout';

export default function TermsPage() {
   return (
      <LegalLayout title="Terms & Conditions">
         <div className="space-y-12 text-black/80">
            <p className="text-xl font-medium leading-relaxed">
               Welcome to Diney. These Terms & Conditions govern your use of the Diney QR-SaaS platform and any associated Sovereign Nodes. By activating an account, you agree to these terms in full.
            </p>

            <section className="space-y-6">
               <h2 className="text-2xl font-bold uppercase tracking-tight">1. Definitions</h2>
               <div className="space-y-4">
                  <p className="leading-relaxed"><strong>"Service"</strong> refers to the cloud-based infrastructure, dashboard, and QR storefronts provided by Diney.</p>
                  <p className="leading-relaxed"><strong>"Merchant"</strong> refers to the business entity utilizing Diney for restaurant operations.</p>
                  <p className="leading-relaxed"><strong>"Sovereign Nodes"</strong> refers to the specific digital instances of the Service activated for a Merchant location.</p>
               </div>
            </section>

            <section className="space-y-6">
               <h2 className="text-2xl font-bold uppercase tracking-tight">2. Service Usage & Eligibility</h2>
               <p className="leading-relaxed">
                  The Service is designed for legitimate restaurant and hospitality businesses. Merchants must be at least 18 years of age and possess the legal authority to enter into these terms. Access to Sovereign Nodes is granted contingent upon successful KYC verification (where applicable) and payment of service fees.
               </p>
            </section>

            <section className="space-y-6">
               <h2 className="text-2xl font-bold uppercase tracking-tight">3. Operational Responsibilities</h2>
               <p className="leading-relaxed">
                  Merchants are solely responsible for all activities occurring under their sovereign credentials. This includes:
               </p>
               <ul className="list-disc pl-6 space-y-2">
                  <li>Maintaining the accuracy of menu data and pricing.</li>
                  <li>Ensuring the quality and safety of food products.</li>
                  <li>Fulfilling orders tracked through the Sovereign Sync protocol.</li>
                  <li>Compliance with all local culinary and business regulations.</li>
               </ul>
            </section>

            <section className="space-y-6">
               <h2 className="text-2xl font-bold uppercase tracking-tight">4. Payments & Billing</h2>
               <p className="leading-relaxed">
                  Subscription fees are billed on a recurring cycle as specified during node activation. Diney uses authorized third-party collectors (such as Razorpay) for transaction processing. All fees are exclusive of statutory taxes.
               </p>
            </section>

            <section className="space-y-6">
               <h2 className="text-2xl font-bold uppercase tracking-tight">5. Intellectual Property</h2>
               <p className="leading-relaxed">
                  Diney Core Group retains all rights, title, and interest in and to the Service, including the holographic interface design, sub-millisecond sync algorithms, and the Diney brand. Merchants are granted a non-exclusive license to use the Service during their subscription period.
               </p>
            </section>

            <section className="space-y-6">
               <h2 className="text-2xl font-bold uppercase tracking-tight">6. Limitation of Liability</h2>
               <p className="leading-relaxed">
                  Diney Core Group shall not be liable for any indirect, incidental, or consequential damages resulting from your use of the Service. We provide technical infrastructure and are not responsible for physical storefront operations or culinary disputes.
               </p>
            </section>

            <section className="space-y-6">
               <h2 className="text-2xl font-bold uppercase tracking-tight">7. Indemnification</h2>
               <p className="leading-relaxed">
                  You agree to indemnify and hold harmless Diney Core Group from any claims, damages, or losses arising from your breach of these terms or your violation of any third-party rights through the use of the Service.
               </p>
            </section>

            <section className="space-y-6">
               <h2 className="text-2xl font-bold uppercase tracking-tight">8. Account Termination</h2>
               <p className="leading-relaxed">
                  We reserve the right to suspend or terminate your access to the Service for any violation of these terms or for conduct we deem harmful to the integrity of the Sovereign network.
               </p>
            </section>

            <section className="space-y-6">
               <h2 className="text-2xl font-bold uppercase tracking-tight">9. Modifications to Service</h2>
               <p className="leading-relaxed">
                  Diney reserves the right to modify or discontinue features of the Service at any time. We will provide reasonable notice for significant changes that impact your operational workflow.
               </p>
            </section>

            <section className="space-y-6">
               <h2 className="text-2xl font-bold uppercase tracking-tight">10. Governing Law</h2>
               <p className="leading-relaxed">
                  These terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Diney Core Group is registered, without regard to its conflict of law principles.
               </p>
            </section>

            <div className="pt-12 border-t border-black/5 italic text-black/40">
               Effective Date: March 17, 2026
            </div>
         </div>
      </LegalLayout>
   );
}
