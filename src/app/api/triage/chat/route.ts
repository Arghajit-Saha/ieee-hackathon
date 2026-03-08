import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import TriageLog from '@/models/TriageLog';
import mongoose from 'mongoose';

const RAG_API_URL = process.env.RAG_API_URL || 'http://localhost:8000';

export async function POST(request: Request) {
    try {
        const { message, history } = await request.json();

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        
        const ragResponse = await fetch(`${RAG_API_URL}/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: message, history: history || [] })
        });

        if (!ragResponse.ok) {
            const errData = await ragResponse.json().catch(() => ({}));
            console.error('RAG API error:', errData);
            return NextResponse.json({ error: 'RAG model returned an error' }, { status: 500 });
        }

        const data = await ragResponse.json();
        const aiResponse = data.result;

        
        let urgencyLevel: 'Routine' | 'Urgent' | 'Emergency' = 'Routine';
        if (data.assessment && data.assessment.summary) {
            const lowerRes = data.assessment.summary.toLowerCase();
            if (lowerRes.includes('emergency') || lowerRes.includes('severe') || lowerRes.includes('immediate')) {
                urgencyLevel = 'Emergency';
            } else if (lowerRes.includes('doctor') || lowerRes.includes('clinic') || lowerRes.includes('urgent')) {
                urgencyLevel = 'Urgent';
            }

            
            try {
                await connectToDatabase();

                
                const userMessages = Array.isArray(history)
                    ? history.filter((m: any) => m.role === 'user').map((m: any) => m.content)
                    : [];

                const symptoms = [...userMessages, message];
                const rawInput = symptoms.join(' | ');

                const matchPercentage = data.assessment.diseases?.[0]?.matchPercentage || 50;

                
                const cookieStore = await import('next/headers').then(m => m.cookies());
                const sessionCookie = cookieStore.get('session')?.value;
                let patientId = new mongoose.Types.ObjectId('60d5ecb8b392d715ba9b0a1a');

                if (sessionCookie) {
                    const { decrypt } = await import('@/lib/auth');
                    const session = await decrypt(sessionCookie);
                    if (session?.userId) {
                        try {
                            patientId = new mongoose.Types.ObjectId(session.userId);
                        } catch (e) {
                            
                        }
                    }
                }

                
                const lng = 27.78 + (Math.random() - 0.5) * 0.05;
                const lat = -26.15 + (Math.random() - 0.5) * 0.05;

                const triageLog = await TriageLog.create({
                    patientId,
                    symptoms,
                    rawInput,
                    urgencyLevel,
                    aiConfidenceScore: matchPercentage,
                    recommendedAction: JSON.stringify(data.assessment),
                    locationAtTimeOfTriage: {
                        type: 'Point',
                        coordinates: [lng, lat]
                    },
                    synced: true,
                });

                return NextResponse.json({
                    triageResult: {
                        id: triageLog._id.toString(),
                        urgencyLevel,
                        recommendedAction: aiResponse,
                        assessment: data.assessment
                    }
                });

            } catch (dbError) {
                console.error("Failed to save triage log to MongoDB:", dbError);
                
            }
        } else {
            
            const lowerRes = aiResponse.toLowerCase();
            if (lowerRes.includes('emergency') || lowerRes.includes('severe') || lowerRes.includes('immediate')) {
                urgencyLevel = 'Emergency';
            } else if (lowerRes.includes('doctor') || lowerRes.includes('clinic') || lowerRes.includes('urgent')) {
                urgencyLevel = 'Urgent';
            }
        }

        return NextResponse.json({
            triageResult: {
                urgencyLevel,
                recommendedAction: aiResponse,
                assessment: data.assessment
            }
        });

    } catch (error) {
        console.error('Chat API Error:', error);
        return NextResponse.json(
            { error: 'Failed to connect to the RAG server. Make sure the Python FastAPI server is running.' },
            { status: 500 }
        );
    }
}
