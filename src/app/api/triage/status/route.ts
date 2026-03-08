import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import TriageLog from '@/models/TriageLog';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';

export async function PATCH(request: Request) {
    try {
        const cookieStore = await cookies();
        const session = cookieStore.get('session');
        const payload = await decrypt(session?.value);

        if (!payload || payload.role !== 'doctor') {
            return NextResponse.json({ error: 'Unauthorized. Doctors only.' }, { status: 401 });
        }

        const { id, status } = await request.json();

        if (!id || !status) {
            return NextResponse.json({ error: 'ID and Status are required' }, { status: 400 });
        }

        const validStatuses = ['pending', 'reviewed', 'resolved', 'archived'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        await connectToDatabase();

        const triage = await TriageLog.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!triage) {
            return NextResponse.json({ error: 'Triage log not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, triage });
    } catch (error) {
        console.error('Triage status update error:', error);
        return NextResponse.json({ error: 'Failed to update triage status' }, { status: 500 });
    }
}
