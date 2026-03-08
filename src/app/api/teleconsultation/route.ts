import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Teleconsultation from '@/models/Teleconsultation';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';

export async function POST() {
    try {
        const cookieStore = await cookies();
        const session = cookieStore.get('session');
        const payload = await decrypt(session?.value);

        if (!payload || !payload.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        
        const existing = await Teleconsultation.findOne({
            patientId: payload.userId,
            status: 'pending'
        });

        if (existing) {
            existing.meetingUrl = existing._id.toString();
            await existing.save();
            return NextResponse.json({ roomId: existing._id.toString() }, { status: 200 });
        }

        
        const consultation = await Teleconsultation.create({
            patientId: payload.userId,
            type: 'synchronous',
            status: 'pending'
        });

        consultation.meetingUrl = consultation._id.toString();
        await consultation.save();

        return NextResponse.json({ roomId: consultation._id.toString() }, { status: 200 });
    } catch (error) {
        console.error('Teleconsultation error:', error);
        return NextResponse.json({ error: 'Failed to create teleconsultation' }, { status: 500 });
    }
}
