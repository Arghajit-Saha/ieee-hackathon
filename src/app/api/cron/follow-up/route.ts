import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import TriageLog from '@/models/TriageLog';
import { sendPatientFollowUp } from '@/lib/sms/twilioService';


export async function GET(request: Request) {
    
    const authHeader = request.headers.get('authorization');
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await connectToDatabase();

        
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        const logsToFollowUp = await TriageLog.find({
            urgencyLevel: 'Urgent',
            createdAt: { $gte: twoDaysAgo, $lte: oneDayAgo },
        }).populate('patientId', 'phoneNumber firstName');

        let processedCount = 0;

        for (const log of logsToFollowUp) {
            
            
            const patient: any = log.patientId;

            if (patient && patient.phoneNumber) {
                await sendPatientFollowUp(patient.phoneNumber, patient.firstName || 'Patient');
                processedCount++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Cron executed successfully. Sent ${processedCount} follow-ups.`
        });

    } catch (error) {
        console.error('Cron Follow-up Error:', error);
        return NextResponse.json({ error: 'Failed to process follow-ups' }, { status: 500 });
    }
}
