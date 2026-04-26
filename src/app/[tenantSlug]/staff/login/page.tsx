import { getTenantData } from '@/app/actions/tenant';
import { getStaffListForLogin } from '@/app/actions/staff';
import StaffLoginPageClient from '@/components/staff/StaffLoginPageClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function StaffLoginPage({
    params
}: {
    params: Promise<{ tenantSlug: string }>
}) {
    const { tenantSlug } = await params;
    const { data: tenant } = await getTenantData(tenantSlug);

    if (!tenant) notFound();

    const { data: staff } = await getStaffListForLogin(tenant.id);

    return (
        <StaffLoginPageClient 
            staff={staff || []}
            tenantSlug={tenantSlug}
            tenantId={tenant.id}
            tenantName={tenant.name}
        />
    );
}
