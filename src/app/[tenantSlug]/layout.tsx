'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { useParams, usePathname, useRouter } from 'next/navigation';

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  const { fetchStoreData, isLoading, isInitialLoading, tenant, isStoreOpen } = useStore();
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (tenantSlug) {
      fetchStoreData(tenantSlug).finally(() => setHasFetched(true));
    }
  }, [tenantSlug, fetchStoreData]);

  // Route Guard for Closed Store
  useEffect(() => {
    if (!isLoading && tenant && !isStoreOpen) {
      const protectedRoutes = ['/cart', '/checkout', '/my-orders', '/order'];
      const isProtectedRoute = protectedRoutes.some(route => 
        pathname.startsWith(`/${tenantSlug}${route}`)
      );
      
      const isAdminRoute = pathname.includes('/admin');

      if (isProtectedRoute && !isAdminRoute) {
        router.push(`/${tenantSlug}`);
      }
    }
  }, [isStoreOpen, isLoading, tenant, pathname, tenantSlug, router]);

  if (isInitialLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-neutral-50">
        <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-neutral-400 font-medium italic">Setting up the kitchen...</p>
      </div>
    );
  }

  if (!isLoading && !tenant) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="mb-8 p-4 bg-red-50 rounded-full">
          <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-4xl font-black mb-4 tracking-tighter uppercase italic">Store Not Found</h1>
        <p className="text-gray-500 max-w-sm mb-8 leading-relaxed">
          The store <span className="font-bold text-black">"{tenantSlug}"</span> doesn't exist or has moved. 
          Check the spelling or start your own truck!
        </p>
        <a 
          href="https://qrsaas.com" 
          className="px-8 py-4 bg-black text-white rounded-full font-bold hover:bg-neutral-800 transition-all hover:scale-105"
        >
          Launch Your Own Shop 🚀
        </a>
      </div>
    );
  }

  return <>{children}</>;
}
