import fs from 'fs';
import path from 'path';

export type RagRow = {
    disease: string;
    fever: boolean;
    cough: boolean;
    fatigue: boolean;
    breathing: boolean;
    age: number;
    gender: string;
    bloodPressure: string;
    cholesterol: string;
    outcome: string;
};


let ragDataset: RagRow[] = [];

export const loadDataset = (): RagRow[] => {
    if (ragDataset.length > 0) return ragDataset;

    try {
        const filePath = path.join(process.cwd(), '../docs/Disease_symptom_and_patient_profile_dataset.csv');
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const lines = fileContent.split('\n').filter(line => line.trim() !== '');

        
        const data: RagRow[] = lines.slice(1).map(line => {
            const cols = line.split(',');
            if (cols.length >= 10) {
                return {
                    disease: cols[0].trim(),
                    fever: cols[1].trim().toLowerCase() === 'yes',
                    cough: cols[2].trim().toLowerCase() === 'yes',
                    fatigue: cols[3].trim().toLowerCase() === 'yes',
                    breathing: cols[4].trim().toLowerCase() === 'yes',
                    age: parseInt(cols[5].trim(), 10) || 0,
                    gender: cols[6].trim(),
                    bloodPressure: cols[7].trim(),
                    cholesterol: cols[8].trim(),
                    outcome: cols[9].trim()
                };
            }
            return null;
        }).filter(Boolean) as RagRow[];

        ragDataset = data;
        return data;
    } catch (err) {
        console.error("Failed to load RAG dataset:", err);
        return [];
    }
};

export const findRagMatch = (symptomsText: string): { urgency: 'Routine' | 'Urgent' | 'Emergency', topDisease: string | null } => {
    const msgLower = symptomsText.toLowerCase();

    
    const hasFever = msgLower.includes('fever') || msgLower.includes('hot') || msgLower.includes('temperature');
    const hasCough = msgLower.includes('cough') || msgLower.includes('hacking');
    const hasFatigue = msgLower.includes('fatigue') || msgLower.includes('tired') || msgLower.includes('exhausted') || msgLower.includes('weak');
    const hasBreathing = msgLower.includes('breath') || msgLower.includes('wheezing') || msgLower.includes('gasping');
    const hasChestPain = msgLower.includes('chest pain') || msgLower.includes('heart attack');
    const hasBleeding = msgLower.includes('bleeding') || msgLower.includes('blood');

    if (hasChestPain || hasBleeding || (hasBreathing && msgLower.includes('severe'))) {
        return { urgency: 'Emergency', topDisease: 'Critical Incident' };
    }

    const dataset = loadDataset();
    if (dataset.length === 0) return { urgency: 'Urgent', topDisease: null };

    const possibleMatches = dataset.filter(row => {
        let matchScore = 0;
        let totalRequirements = 0;

        if (hasFever) { totalRequirements++; if (row.fever) matchScore++; }
        if (hasCough) { totalRequirements++; if (row.cough) matchScore++; }
        if (hasFatigue) { totalRequirements++; if (row.fatigue) matchScore++; }
        if (hasBreathing) { totalRequirements++; if (row.breathing) matchScore++; }

        return totalRequirements > 0 && matchScore === totalRequirements && row.outcome === 'Positive';
    });

    if (possibleMatches.length > 0) {
        const diseaseCounts = possibleMatches.reduce((acc: Record<string, number>, row) => {
            acc[row.disease] = (acc[row.disease] || 0) + 1;
            return acc;
        }, {});

        const topDisease = Object.keys(diseaseCounts).reduce((a, b) => diseaseCounts[a] > diseaseCounts[b] ? a : b);

        let urgency: 'Routine' | 'Urgent' | 'Emergency' = 'Urgent';
        if (hasBreathing || topDisease.toLowerCase().includes('pneumonia') || topDisease.toLowerCase().includes('stroke')) {
            urgency = 'Emergency';
        } else if (topDisease.toLowerCase().includes('cold') || topDisease.toLowerCase().includes('rhinitis')) {
            urgency = 'Routine';
        }

        return { urgency, topDisease };
    }

    return { urgency: 'Urgent', topDisease: null };
};
