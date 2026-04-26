'use client';

import { useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import StaffNotificationListener from '@/components/staff/StaffNotificationListener';

export default function StaffRootLayout({ children }: { children: React.ReactNode }) {
    const { tenant } = useStore();
    
    useEffect(() => {
        console.log('👷 StaffRootLayout mounted, tenant:', tenant?.slug, tenant?.id);
    }, [tenant]);

    return (
        <>
            {tenant?.id ? (
                <StaffNotificationListener tenantId={tenant.id} />
            ) : (
                <div className="hidden">No Tenant ID for Notifications</div>
            )}
            {children}
        </>
    );
}
