import { redirect } from 'next/navigation';
import { getTenantData, getTenantMenu } from '@/app/actions/tenant';
import { getTableBill } from '@/app/actions/orders';
import StaffSidebar from '@/components/staff/StaffSidebar';
import { getAuthenticatedStaff } from '@/app/actions/staff-auth';
import { notFound } from 'next/navigation';
import StaffTableTerminalClient from '@/components/staff/StaffTableTerminalClient';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function StaffTablePage({
    params
}: {
    params: Promise<{ tenantSlug: string, tableNumber: string }>
}) {
    const { tenantSlug, tableNumber } = await params;

    const staff = await getAuthenticatedStaff();
    if (!staff) redirect(`/${tenantSlug}/staff/login`);

    const { data: tenant } = await getTenantData(tenantSlug);
    if (!tenant) notFound();

    const bill = await getTableBill(tenant.id, tableNumber);
    const menu = await getTenantMenu(tenant.id, tenantSlug);

    return (
        <div className="flex flex-col md:flex-row h-[100dvh] bg-gray-50 text-gray-900 overflow-hidden font-inter">
            <StaffSidebar
                staff={staff}
                tenantSlug={tenantSlug}
                tenantName={tenant.name}
            />
            <main className="flex-1 flex flex-col min-w-0 min-h-0">
                <div className="flex-1 flex flex-col min-w-0 min-h-0 p-0">

                    <div className="flex-1 min-h-0 flex flex-col">
                        <StaffTableTerminalClient 
                            tableNumber={tableNumber}
                            billData={bill.data}
                            menu={menu.data || []}
                            tenantId={tenant.id}
                            tenantSlug={tenantSlug}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}
