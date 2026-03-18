'use client';

import { useEffect } from 'react';

 
export default function DomainGuard() {
  useEffect(() => {
     
    if (typeof window === 'undefined') return;

    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'localhost:3000';
    const protocol = process.env.NEXT_PUBLIC_PROTOCOL || 'http';
    const currentHost = window.location.host;

     
     
     
    if (currentHost === 'localhost:3000' && baseDomain.includes('lvh.me')) {
      const canonicalUrl = `${protocol}://${baseDomain}${window.location.pathname}${window.location.search}${window.location.hash}`;
      window.location.replace(canonicalUrl);
    }
  }, []);

  return null;
}
