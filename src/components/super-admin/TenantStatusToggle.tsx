'use client';

import { useState } from 'react';
import { updateTenantStatus } from '@/app/actions/super-admin';
import { Power, PowerOff, Loader2, Clock, ShieldAlert } from 'lucide-react';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';

export default function TenantStatusToggle({ 
    tenantId, 
    initialStatus 
}: { 
    tenantId: string; 
    initialStatus: 'pending' | 'active' | 'suspended' | 'rejected';
}) {
    const [status, setStatus] = useState(initialStatus);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleToggle = async () => {
        if (status === 'pending') return; // Pending needs explicit approval button

        setIsLoading(true);
        try {
            const nextStatus = status === 'active' ? 'suspended' : 'active';
            const result = await updateTenantStatus(tenantId, nextStatus);
            if (result.success) {
                setStatus(nextStatus);
                router.refresh();
            } else {
                alert(result.error || 'Failed to update status');
            }
        } catch (error) {
            console.error('Failed to update status:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusStyles = () => {
        switch (status) {
            case 'active': return "bg-green-500/10 text-green-400 hover:bg-green-500/20";
            case 'pending': return "bg-amber-500/10 text-amber-500 cursor-default";
            case 'suspended': return "bg-red-500/10 text-red-400 hover:bg-red-500/20";
            case 'rejected': return "bg-neutral-800 text-neutral-500 cursor-default";
            default: return "bg-neutral-900 text-neutral-400";
        }
    };

    const getIcon = () => {
        if (isLoading) return <Loader2 className="w-3 h-3 animate-spin" />;
        switch (status) {
            case 'active': return <Power className="w-3 h-3" />;
            case 'pending': return <Clock className="w-3 h-3" />;
            case 'suspended': return <PowerOff className="w-3 h-3" />;
            case 'rejected': return <ShieldAlert className="w-3 h-3" />;
            default: return <Power className="w-3 h-3" />;
        }
    };

    return (
        <button
            onClick={handleToggle}
            disabled={isLoading || status === 'pending' || status === 'rejected'}
            className={clsx(
                "relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                getStatusStyles()
            )}
        >
            {getIcon()}
            <span>{status}</span>
        </button>
    );
}
