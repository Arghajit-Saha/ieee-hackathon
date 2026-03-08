'use client';

import { CheckCircle, SpinnerGap } from '@phosphor-icons/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import haptic from '@/lib/haptics';

interface ResolveTriageButtonProps {
    triageId: string;
}

export default function ResolveTriageButton({ triageId }: ResolveTriageButtonProps) {
    const [isResolving, setIsResolving] = useState(false);
    const router = useRouter();

    const handleResolve = async () => {
        haptic.light();
        setIsResolving(true);
        try {
            const res = await fetch('/api/triage/status', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: triageId, status: 'resolved' }),
            });

            if (res.ok) {
                haptic.success();
                router.refresh();
            } else {
                haptic.error();
                console.error('Failed to resolve triage');
            }
        } catch (error) {
            haptic.error();
            console.error('Error resolving triage:', error);
        } finally {
            setIsResolving(false);
        }
    };

    return (
        <button
            onClick={handleResolve}
            disabled={isResolving}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border-2 border-emerald-200 text-[10px] font-mono-ui font-bold tracking-wider hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isResolving ? (
                <SpinnerGap size={14} weight="bold" className="animate-spin" />
            ) : (
                <CheckCircle size={14} weight="bold" />
            )}
            {isResolving ? 'RESOLVING...' : 'MARK RESOLVED'}
        </button>
    );
}
