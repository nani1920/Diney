'use client';

import { useState } from 'react';
import { updateTenantTier } from '@/app/actions/super-admin';
import { toast } from 'react-hot-toast';
import { Crown, Zap, Shield } from 'lucide-react';
import clsx from 'clsx';

interface TenantTierSelectProps {
    tenantId: string;
    currentTier: string;
}

const TIERS = [
    { id: 'free', name: 'Free', icon: Zap, color: 'text-neutral-500', bg: 'bg-neutral-500/10' },
    { id: 'pro', name: 'Pro', icon: Crown, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 'enterprise', name: 'Enterprise', icon: Shield, color: 'text-blue-500', bg: 'bg-blue-500/10' }
];

export default function TenantTierSelect({ tenantId, currentTier }: TenantTierSelectProps) {
    const [tier, setTier] = useState(currentTier);
    const [isLoading, setIsLoading] = useState(false);

    const handleTierChange = async (newTier: string) => {
        if (newTier === tier) return;
        
        setIsLoading(true);
        const result = await updateTenantTier(tenantId, newTier);
        
        if (result.success) {
            setTier(newTier);
            toast.success(`Upgraded to ${newTier.toUpperCase()}`);
        } else {
            toast.error('Failed to update tier');
        }
        setIsLoading(false);
    };

    return (
        <div className="flex gap-1.5 py-1">
            {TIERS.map((t) => {
                const Icon = t.icon;
                const isActive = tier === t.id;
                
                return (
                    <button
                        key={t.id}
                        onClick={() => handleTierChange(t.id)}
                        disabled={isLoading}
                        className={clsx(
                            "p-2 rounded-xl border transition-all relative group/tier",
                            isActive 
                                ? `border-current ${t.bg} ${t.color}` 
                                : "border-white/5 bg-white/5 text-neutral-600 hover:border-white/10 hover:bg-white/[0.07]",
                            isLoading && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <Icon className="w-4 h-4" />
                        
                        {isActive && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border-2 border-[#0d0d0d]" />
                        )}
                        
                        { }
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-2 py-1 bg-neutral-950 border border-white/10 rounded-md text-[8px] font-black uppercase tracking-[0.2em] text-white opacity-0 group-hover/tier:opacity-100 scale-90 group-hover/tier:scale-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-[100] shadow-2xl">
                            {t.name}
                            { }
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-neutral-950" />
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
