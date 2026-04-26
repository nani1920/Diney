import { getTenantData } from '@/app/actions/tenant';
import { getStaff } from '@/app/actions/staff';
import StaffManagementClient from '@/components/admin/StaffManagementClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function StaffManagementPage({
    params
}: {
    params: Promise<{ tenantSlug: string }>
}) {
    const { tenantSlug } = await params;
    const { data: tenant } = await getTenantData(tenantSlug);

    if (!tenant) notFound();

    const { data: initialStaff, error } = await getStaff(tenant.id);

    return (
        <div className="max-w-6xl mx-auto">
            <StaffManagementClient 
                initialStaff={initialStaff || []} 
                tenantId={tenant.id} 
            />
        </div>
    );
}
