import { redirect } from 'next/navigation';
import { getTenantData, getTenantMenu } from '@/app/actions/tenant';
import StaffSidebar from '@/components/staff/StaffSidebar';
import { getAuthenticatedStaff } from '@/app/actions/staff-auth';
import { notFound } from 'next/navigation';
import StaffMenuClient from '@/components/staff/StaffMenuClient';

export const dynamic = 'force-dynamic';

export default async function StaffMenuPage({
    params
}: {
    params: Promise<{ tenantSlug: string }>
}) {
    const { tenantSlug } = await params;

    const staff = await getAuthenticatedStaff();
    if (!staff) redirect(`/${tenantSlug}/staff/login`);

    const { data: tenant } = await getTenantData(tenantSlug);
    if (!tenant) notFound();

    const menu = await getTenantMenu(tenant.id, tenantSlug);

    return (
        <div className="flex flex-col md:flex-row h-screen bg-gray-50 text-gray-900 overflow-hidden font-inter">
            <StaffSidebar
                staff={staff}
                tenantSlug={tenantSlug}
                tenantName={tenant.name}
            />
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-8">
                    <header className="mb-6 md:mb-8">
                        <h1 className="text-2xl md:text-4xl font-black italic tracking-tighter uppercase leading-none mb-2 text-gray-900">
                            Menu <span className="text-emerald-500">Stock</span>
                        </h1>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Toggle item availability for guest QR menu</p>
                    </header>

                    <StaffMenuClient 
                        initialItems={menu.data || []} 
                        tenantId={tenant.id}
                        tenantSlug={tenantSlug}
                    />
                </div>
            </main>
        </div>
    );
}
