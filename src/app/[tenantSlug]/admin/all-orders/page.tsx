import { redirect } from 'next/navigation';
import { getTenantData } from '@/app/actions/tenant';
import { getTenantOrders } from '@/app/actions/orders';
import { notFound } from 'next/navigation';
import AdminAllOrdersClient from '@/components/staff/AdminAllOrdersClient';
import { getAuthenticatedStaff } from '@/app/actions/staff-auth';

export const dynamic = 'force-dynamic';

export default async function AdminAllOrdersPage({
    params,
    searchParams
}: {
    params: Promise<{ tenantSlug: string }>;
    searchParams: Promise<{ page?: string }>;
}) {
    const { tenantSlug } = await params;
    const { page } = await searchParams;
    const currentPage = parseInt(page || '1');

    // Security: Check if admin/staff is logged in
    const staff = await getAuthenticatedStaff();
    if (!staff) {
        redirect(`/${tenantSlug}/staff/login`);
    }

    const { data: tenant } = await getTenantData(tenantSlug);
    if (!tenant) notFound();

    // Fetch paginated orders from server action
    const res = await getTenantOrders(tenant.id, currentPage, 20);
    
    if (!res.success || !res.data) {
        return (
            <div className="p-8 text-center text-neutral-500">
                Failed to load orders history. Please try again.
            </div>
        );
    }

    return (
        <AdminAllOrdersClient 
            tenant={tenant}
            tenantSlug={tenantSlug}
            initialOrders={res.data.data}
            hasMore={currentPage < res.data.totalPages}
            currentPage={currentPage}
            totalOrders={res.data.total}
        />
    );
}
