'use server';

import { connectToDatabase } from '@/lib/mongodb';
import TriageLog from '@/models/TriageLog';
import { revalidatePath } from 'next/cache';

export async function syncOfflineTriageLog(data: {
    id: string; 
    symptoms: string[];
    rawInput: string;
}) {
    try {
        await connectToDatabase();

        
        const existingLog = await TriageLog.findOne({ offlineGeneratedId: data.id });
        if (existingLog) {
            return { success: true, message: 'Log already synced' };
        }

        
        

        
        
        

        const newLog = new TriageLog({
            patientId: '60d5ecb8b392d715ba9b0a1a', 
            symptoms: data.symptoms,
            rawInput: data.rawInput,
            urgencyLevel: 'Routine', 
            aiConfidenceScore: 90,
            recommendedAction: 'Pending Doctor Review (Offline Sync)',
            synced: true,
            offlineGeneratedId: data.id,
        });

        await newLog.save();
        revalidatePath('/dashboard'); 

        return { success: true };
    } catch (error) {
        console.error('Error syncing log:', error);
        return { success: false, error: 'Failed to sync log' };
    }
}
