"use client";

import React from 'react';
import LegalLayout from '../../legal-layout';

export default function PrivacyPage() {
   return (
      <LegalLayout title="Privacy Policy">
         <div className="space-y-12 text-black/80">
            <p className="text-xl font-medium leading-relaxed">
               At Diney, we are committed to protecting your privacy. This Privacy Policy outlines how we collect, use, disclose, and safeguard your information when you use our services. By accessing or using our services, you agree to the terms of this Privacy Policy.
            </p>

            <section className="space-y-6">
               <h2 className="text-2xl font-bold uppercase tracking-tight">1. Information We Collect</h2>
               <div className="space-y-4">
                  <h3 className="font-bold">Personal Information:</h3>
                  <p className="leading-relaxed">
                     When you create an account, activate a node, place an order, or interact with our services, we may collect personal information such as your name, email address, phone number, payment information, and dining preferences.
                  </p>
                  <h3 className="font-bold">Usage Data:</h3>
                  <p className="leading-relaxed">
                     We collect information about how you use our services, including your IP address, browser type, operating system, referring URLs, access times, pages viewed, and actions taken on our platform.
                  </p>
                  <h3 className="font-bold">Cookies and Tracking Technologies:</h3>
                  <p className="leading-relaxed">
                     We use cookies, web beacons, and similar tracking technologies to collect information about your interactions with our services and to enhance your user experience.
                  </p>
               </div>
            </section>

            <section className="space-y-6">
               <h2 className="text-2xl font-bold uppercase tracking-tight">2. How We Use Your Information</h2>
               <ul className="space-y-4 list-none">
                  <li className="leading-relaxed"><strong className="block text-black">To Provide and Improve Our Services:</strong> We use your information to process orders, payments, to personalize your dining experience, and to improve the functionality and performance of our services.</li>
                  <li className="leading-relaxed"><strong className="block text-black">Communication:</strong> We may use your contact information to send you updates, notifications, and technical alerts related to your account or our services.</li>
                  <li className="leading-relaxed"><strong className="block text-black">Marketing and Advertising:</strong> With your consent, we may use your information for marketing and advertising purposes, including sending you promotional offers.</li>
                  <li className="leading-relaxed"><strong className="block text-black">Analytics and Research:</strong> We use your information to analyze usage trends and conduct research to improve our offerings.</li>
                  <li className="leading-relaxed"><strong className="block text-black">Compliance and Protection:</strong> We use your information to comply with legal obligations, enforce our terms and policies, and protect the rights and safety of Diney.</li>
               </ul>
            </section>

            <section className="space-y-6">
               <h2 className="text-2xl font-bold uppercase tracking-tight">3. How We Share Your Information</h2>
               <ul className="space-y-4 list-none">
                  <li className="leading-relaxed"><strong className="block text-black">With Restaurants:</strong> We share relevant information with the restaurants you interact with through our services, such as order information and dining preferences.</li>
                  <li className="leading-relaxed"><strong className="block text-black">Service Providers:</strong> We may share your information with third-party service providers who perform functions on our behalf, such as payment processing and data analysis.</li>
                  <li className="leading-relaxed"><strong className="block text-black">Business Transfers:</strong> In the event of a merger or sale of assets, your information may be transferred as part of the transaction.</li>
                  <li className="leading-relaxed"><strong className="block text-black">Legal Requirements:</strong> We may disclose your information if required to do so by law or in response to valid requests by public authorities.</li>
               </ul>
            </section>

            <section className="space-y-6">
               <h2 className="text-2xl font-bold uppercase tracking-tight">4. Your Choices and Rights</h2>
               <p className="leading-relaxed">
                  You can access, update, or delete your account information at any time by logging into your account settings. You can opt-out of receiving marketing emails by following the unsubscribe instructions or by contacting us directly.
               </p>
            </section>

            <section className="space-y-6">
               <h2 className="text-2xl font-bold uppercase tracking-tight">5. Data Security</h2>
               <p className="leading-relaxed">
                  We implement a variety of security measures to protect your information including encryption and regular security assessments. However, no method of transmission over the Internet is completely secure.
               </p>
            </section>

            <section className="space-y-6">
               <h2 className="text-2xl font-bold uppercase tracking-tight">6. Data Retention</h2>
               <p className="leading-relaxed">
                  We retain your information for as long as necessary to fulfill the purposes outlined in this Privacy Policy unless a longer retention period is required by law.
               </p>
            </section>

            <section className="space-y-6">
               <h2 className="text-2xl font-bold uppercase tracking-tight">7. Children's Privacy</h2>
               <p className="leading-relaxed">
                  Our services are not intended for children under the age of 13. If we become aware that we have inadvertently received personal information from a child under 13, we will delete such information.
               </p>
            </section>

            <section className="space-y-6">
               <h2 className="text-2xl font-bold uppercase tracking-tight">8. International Transfers</h2>
               <p className="leading-relaxed">
                  Your information may be transferred to and processed in countries other than your own. By using our services, you consent to these transfers.
               </p>
            </section>

            <section className="space-y-6">
               <h2 className="text-2xl font-bold uppercase tracking-tight">9. Changes to This Privacy Policy</h2>
               <p className="leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on our website and updating the "Effective Date" at the top.
               </p>
            </section>

            <section className="space-y-6">
               <h2 className="text-2xl font-bold uppercase tracking-tight">10. Contact Us</h2>
               <p className="leading-relaxed">
                  If you have any questions or concerns about this Privacy Policy, please contact us at:
               </p>
               <div className="pt-4 border-l-2 border-[#025E43] pl-6 space-y-2">
                  <p><strong>Diney Support Team</strong></p>
                  <p>Email: mr.luckymano2005@gmail.com</p>
                  <p>Phone: +91 7569964480</p>
                  <p>Address: KNL, Andhra Pradesh, India</p>
               </div>
            </section>

            <div className="pt-12 border-t border-black/5 italic text-black/40">
               Last updated: March 17, 2026
            </div>
         </div>
      </LegalLayout>
   );
}
