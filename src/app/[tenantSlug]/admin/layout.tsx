import AdminSidebar from '@/components/admin/Sidebar';
import { getTenantData } from '@/app/actions/tenant';
import type { Metadata } from 'next';
import AnnouncementBanner from '@/components/admin/AnnouncementBanner';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { exitImpersonation } from '@/app/actions/super-admin';
import { ShieldAlert, LogOut } from 'lucide-react';
import { isSuperAdmin } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ 
    params 
}: { 
    params: Promise<{ tenantSlug: string }> 
}): Promise<Metadata> {
    const { tenantSlug } = await params;
    const res = await getTenantData(tenantSlug);
    const tenant = res.data;
    return {
        title: `Admin Portal - ${tenant?.name || 'Admin'}`,
        description: 'Store Management Dashboard',
    };
}

export default async function AdminLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ tenantSlug: string }>;
}) {
     
    const { tenantSlug } = await params;
    const res = await getTenantData(tenantSlug);
    const tenant = res.data;

     
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
     
    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'localhost:3000';
    const protocol = process.env.NEXT_PUBLIC_PROTOCOL || 'http';
    const mainDomain = `${protocol}://${baseDomain}`;

    const cookieStore = await cookies();
    const isImpersonating = cookieStore.get('impersonation_target')?.value === tenantSlug;

     
    if (!user && !isImpersonating) {
        const currentPath = `/admin`;  
        const currentUrl = `${protocol}://${tenantSlug}.${baseDomain}${currentPath}`;
        redirect(`${mainDomain}/admin/login?returnTo=${encodeURIComponent(currentUrl)}`);
    }

    if (isImpersonating) {
        const isAdmin = await isSuperAdmin();
        if (!isAdmin) {
            console.error(`[Security Violation] Non-admin user attempted to spoof impersonation cookie for ${tenantSlug}`);
            redirect(`${mainDomain}/admin/login?error=forbidden`);
        }
    } else if (user && tenant?.owner_id !== user.id) {
        console.warn(`[Security Alert] User ${user.id} attempted unauthorized access to tenant ${tenantSlug}. Owner: ${tenant?.owner_id}`);
        redirect(`${mainDomain}/admin/dashboard`);
    }
     

     
    const status = tenant?.status || 'pending';
    
     
    if (status === 'pending') {
        return (
            <div className="fixed inset-0 z-[9999] bg-[#050505] flex flex-col items-center justify-center p-6 text-center text-white ring-[20px] ring-inset ring-amber-500/10">
                 <div className="w-24 h-24 bg-amber-500 rounded-[2.5rem] flex items-center justify-center text-4xl shadow-2xl shadow-amber-500/20 mb-8 animate-pulse text-black">
                    ⏳
                </div>
                <div className="space-y-4 max-w-md">
                    <h1 className="text-4xl font-black uppercase italic tracking-tighter">
                        Registry <span className="text-amber-500">Calibration</span>
                    </h1>
                    <p className="text-neutral-400 font-medium leading-relaxed text-lg">
                        Your merchant infrastructure for <span className="text-white">"{tenant?.name}"</span> has been transmitted. Platform authorities are currently auditing your credentials.
                    </p>
                </div>
                <div className="mt-12 p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">
                    System Audit in Progress
                </div>
                <p className="mt-8 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-600">
                    Estimated Time: ~24 Hours
                </p>
            </div>
        );
    }

     
    if (status === 'suspended' || status === 'rejected') {
        return (
            <div className="fixed inset-0 z-[9999] bg-neutral-950 flex flex-col items-center justify-center p-6 text-center text-white font-inter ring-[20px] ring-inset ring-red-500/10">
                <div className="w-24 h-24 bg-red-600 rounded-[2.5rem] flex items-center justify-center text-4xl shadow-2xl shadow-red-600/20 mb-8">
                    🚫
                </div>
                <div className="space-y-4 max-w-md">
                    <h1 className="text-4xl font-black uppercase italic tracking-tighter">
                        Infrastructure <span className="text-red-600">Restricted</span>
                    </h1>
                    <p className="text-neutral-400 font-medium leading-relaxed text-lg">
                        Access to <span className="text-white">"{tenant?.name}"</span> has been disabled by platform administration due to {status === 'rejected' ? 'registry rejection' : 'policy violations'}.
                    </p>
                </div>
                <div className="mt-12 p-3 bg-red-600/10 rounded-2xl border border-red-600/20 text-xs font-black uppercase tracking-[0.2em] text-red-500">
                    Authority Enforcement Gate
                </div>
                <a href="mailto:support@qrsaas.com" className="mt-8 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-600 hover:text-white transition-colors border-b border-neutral-800 hover:border-white pb-1">
                    Contact Registry Support
                </a>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50 font-inter overflow-hidden text-neutral-900">
            <AdminSidebar />
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {isImpersonating && (
                    <div className="bg-red-600 text-white px-6 py-2 flex items-center justify-between z-[60] border-b border-red-500 shadow-lg">
                        <div className="flex items-center gap-3">
                            <ShieldAlert className="w-5 h-5 animate-pulse" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Super Admin Access</span>
                                <span className="text-sm font-bold tracking-tight">Impersonating <span className="italic">"{tenant?.name}"</span></span>
                            </div>
                        </div>
                        <form action={exitImpersonation}>
                            <button 
                                type="submit"
                                className="flex items-center gap-2 px-4 py-1.5 bg-black/20 hover:bg-black/40 rounded-lg text-xs font-black uppercase tracking-widest transition-all border border-white/10 group"
                            >
                                <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                Exit Session
                            </button>
                        </form>
                    </div>
                )}
                <AnnouncementBanner />
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
