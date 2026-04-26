import { redirect } from 'next/navigation';
import { getTenantData } from '@/app/actions/tenant';
import { getAdminTables, getLiveOrders } from '@/app/actions/orders';
import StaffSidebar from '@/components/staff/StaffSidebar';
import StaffDashboardClient from '@/components/staff/StaffDashboardClient';
import { notFound } from 'next/navigation';
import { getAuthenticatedStaff } from '@/app/actions/staff-auth';
import { getStaffListForLogin } from '@/app/actions/staff';

export const dynamic = 'force-dynamic';

export default async function StaffDashboardPage({
    params
}: {
    params: Promise<{ tenantSlug: string }>
}) {
    const { tenantSlug } = await params;

    const staff = await getAuthenticatedStaff();

    if (!staff) {
        redirect(`/${tenantSlug}/staff/login`);
    }

    const { data: tenant } = await getTenantData(tenantSlug);
    if (!tenant) notFound();

    const [tablesRes, ordersRes, staffListRes] = await Promise.all([
        getAdminTables(tenant.id),
        getLiveOrders(tenant.id),
        getStaffListForLogin(tenant.id)
    ]);

    return (
        <div className="flex flex-col md:flex-row h-screen bg-neutral-50 overflow-hidden font-inter">
            <StaffSidebar
                staff={staff}
                tenantSlug={tenantSlug}
                tenantName={tenant.name}
            />
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-8">
                    <StaffDashboardClient
                        staff={staff}
                        tenantId={tenant.id}
                        tenantSlug={tenantSlug}
                        initialTables={tablesRes.data || []}
                        initialOrders={ordersRes.data || []}
                        staffList={staffListRes.data || []}
                    />
                </div>
            </main>
        </div>
    );
}
