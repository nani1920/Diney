import { redirect } from 'next/navigation';
import { isSuperAdmin } from '@/lib/auth-utils';
import SuperAdminClientLayout from './SuperAdminClientLayout';

export default async function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
     
    const isAdmin = await isSuperAdmin();

    if (!isAdmin) {
        console.warn(`[Security Alert] Unauthorized access attempt to super-admin panel.`);
        
         
        const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'localhost:3000';
        const protocol = process.env.NEXT_PUBLIC_PROTOCOL || 'http';
        const mainDomain = `${protocol}://${baseDomain}`;
        
         
        redirect(`${mainDomain}/admin/login?error=unauthorized`);
    }
     

    return <SuperAdminClientLayout>{children}</SuperAdminClientLayout>;
}
