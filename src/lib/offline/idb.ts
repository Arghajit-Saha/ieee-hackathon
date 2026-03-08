import { openDB, IDBPDatabase } from 'idb';

interface HealthcareOfflineDB {
    triageLogs: {
        key: string;
        value: {
            id: string; 
            symptoms: string[];
            rawInput: string;
            timestamp: number;
            synced: boolean;
            
        };
        indexes: { 'by-synced': boolean };
    };
    facilityCache: {
        key: string; 
        
        value: any; 
    };
}

let dbPromise: Promise<IDBPDatabase<HealthcareOfflineDB>> | null = null;

export const getDB = () => {
    if (typeof window === 'undefined') return null; 

    if (!dbPromise) {
        dbPromise = openDB<HealthcareOfflineDB>('healthcare-offline-db', 1, {
            upgrade(db) {
                
                const triageStore = db.createObjectStore('triageLogs', {
                    keyPath: 'id',
                });
                triageStore.createIndex('by-synced', 'synced');

                
                db.createObjectStore('facilityCache', {
                    keyPath: 'id',
                });
            },
        });
    }
    return dbPromise;
};


export const addOfflineTriageLog = async (logData: { symptoms: string[]; rawInput: string }) => {
    const db = await getDB();
    if (!db) return null;

    const id = crypto.randomUUID();
    const entry = {
        ...logData,
        id,
        timestamp: Date.now(),
        synced: false,
    };

    await db.add('triageLogs', entry);
    return id;
};

export const getUnsyncedTriageLogs = async () => {
    const db = await getDB();
    if (!db) return [];

    
    const allLogs = await db.getAll('triageLogs');
    return allLogs.filter((log) => !log.synced);
};

export const markTriageLogSynced = async (id: string) => {
    const db = await getDB();
    if (!db) return;

    const log = await db.get('triageLogs', id);
    if (log) {
        log.synced = true;
        await db.put('triageLogs', log);
    }
};
