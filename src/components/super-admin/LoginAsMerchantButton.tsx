'use client';

import { useState } from 'react';
import { LogIn } from 'lucide-react';
import { loginAsMerchant } from '@/app/actions/super-admin';

interface LoginAsMerchantButtonProps {
    tenantSlug: string;
}

export default function LoginAsMerchantButton({ tenantSlug }: LoginAsMerchantButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        setIsLoading(true);
        try {
            await loginAsMerchant(tenantSlug);
        } catch (error) {
            console.error('Impersonation failed:', error);
            setIsLoading(false);
        }
    };

    return (
        <button 
            onClick={handleLogin}
            disabled={isLoading}
            className="flex items-center gap-2 text-[10px] md:text-xs font-black uppercase tracking-widest hover:text-red-500 transition-colors disabled:opacity-50"
            title="Login as Merchant"
        >
            <span className="hidden xs:inline">
                {isLoading ? 'Connecting...' : 'Impersonate'}
            </span>
            <LogIn className={`w-3.5 h-3.5 ${isLoading ? 'animate-pulse' : ''}`} />
        </button>
    );
}
