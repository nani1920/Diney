'use client';

import { useEffect } from 'react';

/**
 * DomainGuard ensures the user is always on the canonical domain
 * specified in the environment variables. This is critical for 
 * local development on lvh.me where cookie sharing depends on 
 * the exact hostname.
 */
export default function DomainGuard() {
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'localhost:3000';
    const protocol = process.env.NEXT_PUBLIC_PROTOCOL || 'http';
    const currentHost = window.location.host;

    // Localhost to lvh.me redirect logic
    // We only force redirect if the canonical base domain is lvh.me-based
    // and the user has accidentally landed on 'localhost'
    if (currentHost === 'localhost:3000' && baseDomain.includes('lvh.me')) {
      const canonicalUrl = `${protocol}://${baseDomain}${window.location.pathname}${window.location.search}${window.location.hash}`;
      window.location.replace(canonicalUrl);
    }
  }, []);

  return null;
}
