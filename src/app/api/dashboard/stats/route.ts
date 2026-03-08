import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import TriageLog from '@/models/TriageLog';

export async function GET() {
    try {
        await connectToDatabase();

        
        const activeEmergencies = await TriageLog.countDocuments({
            urgencyLevel: 'Emergency',
            
        });

        
        const pendingReviews = await TriageLog.countDocuments({
            urgencyLevel: 'Urgent',
        });

        
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const seenToday = await TriageLog.countDocuments({
            createdAt: { $gte: startOfDay }
        });

        
        const recentAlerts = await TriageLog.find({
            urgencyLevel: { $in: ['Emergency', 'Urgent'] }
        })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        return NextResponse.json({
            stats: {
                activeEmergencies,
                pendingReviews,
                seenToday
            },
            recentAlerts
        });
    } catch (error) {
        console.error('Dashboard Stats API Error:', error);
        return NextResponse.json({ error: 'Failed to retrieve stats' }, { status: 500 });
    }
}
