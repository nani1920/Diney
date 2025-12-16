import AdminSidebar from '@/components/admin/Sidebar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Admin Portal - Nani Chef',
    description: 'Food Truck Management System',
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 font-sans">
            <AdminSidebar />
            <main className="flex-1 max-h-screen overflow-y-auto w-full md:w-[calc(100vw-16rem)]">
                {children}
            </main>
        </div>
    );
}
