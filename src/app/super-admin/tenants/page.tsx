import { getAllTenants } from '@/app/actions/super-admin';
import TenantRegistryClient from '@/components/super-admin/TenantRegistryClient';

export const dynamic = 'force-dynamic';

export default async function TenantsPage() {
    const tenantsResult = await getAllTenants();
    const tenants = tenantsResult.success ? (tenantsResult.data || []) : [];

    return (
        <div className="space-y-10 pb-24 font-inter">
            <header className="space-y-2">
                <div className="flex items-center gap-2 mb-3">
                    <div className="px-2.5 py-1 bg-red-600/10 border border-red-600/20 rounded-lg">
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-red-500">Infrastructure</span>
                    </div>
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-white leading-tight uppercase">
                    Shop <span className="text-neutral-600 italic">Registry</span>
                </h1>
                <p className="text-neutral-500 font-medium text-base max-w-lg mt-2">Full authority management over all active platform merchants.</p>
            </header>

            <TenantRegistryClient initialTenants={tenants} />
        </div>
    );
}
