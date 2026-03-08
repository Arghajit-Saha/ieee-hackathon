'use client';

import { useState, useEffect } from 'react';
import { getUnsyncedTriageLogs, markTriageLogSynced } from '@/lib/offline/idb';
import { syncOfflineTriageLog } from '@/app/actions/triage';

export function useOfflineSync() {
    const [isOnline, setIsOnline] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        
        if (typeof window !== 'undefined') {
            setIsOnline(navigator.onLine);
        }

        const handleOnline = () => {
            setIsOnline(true);
            triggerSync(); 
        }
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const triggerSync = async () => {
        if (!navigator.onLine) return;

        try {
            setIsSyncing(true);
            const unsyncedLogs = await getUnsyncedTriageLogs();

            if (unsyncedLogs.length === 0) {
                setIsSyncing(false);
                return;
            }

            console.log(`Syncing ${unsyncedLogs.length} offline logs...`);

            for (const log of unsyncedLogs) {
                
                const result = await syncOfflineTriageLog(log);

                if (result.success) {
                    await markTriageLogSynced(log.id);
                }
            }

        } catch (error) {
            console.error('Failed to sync offline logs', error);
        } finally {
            setIsSyncing(false);
        }
    };

    return { isOnline, isSyncing, triggerSync };
}
