import { redirect } from 'next/navigation';
import { getTenantData } from '@/app/actions/tenant';
import { getTenantOrders } from '@/app/actions/orders';
import StaffSidebar from '@/components/staff/StaffSidebar';
import { getAuthenticatedStaff } from '@/app/actions/staff-auth';
import { notFound } from 'next/navigation';
import StaffOrdersClient from '@/components/staff/StaffOrdersClient';

export const dynamic = 'force-dynamic';

export default async function StaffOrdersPage({
    params,
    searchParams
}: {
    params: Promise<{ tenantSlug: string }>,
    searchParams: Promise<{ page?: string }>
}) {
    const { tenantSlug } = await params;
    const { page: pageStr } = await searchParams;
    const page = Number(pageStr) || 1;

    const staff = await getAuthenticatedStaff();
    if (!staff) redirect(`/${tenantSlug}/staff/login`);

    const { data: tenant } = await getTenantData(tenantSlug);
    if (!tenant) notFound();

    const ordersRes = await getTenantOrders(tenant.id, page);
    const { data: orders = [], totalPages = 1 } = ordersRes.data || {};
    const hasMore = page < totalPages;

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
                        <h1 className="text-2xl md:text-4xl font-bold italic tracking-tighter uppercase leading-none mb-2 text-gray-900">
                            Order <span className="text-emerald-500">History</span>
                        </h1>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Manage all active and past orders</p>
                    </header>

                    <StaffOrdersClient 
                        initialOrders={orders} 
                        hasMore={hasMore}
                        currentPage={page}
                        tenantId={tenant.id}
                    />
                </div>
            </main>
        </div>
    );
}
