import { NextResponse } from 'next/server';

const RAG_API_URL = process.env.RAG_API_URL || 'http://localhost:8000';

export async function POST(request: Request) {
    try {
        const { symptoms, history } = await request.json();

        if (!symptoms) {
            return NextResponse.json({ error: 'Symptoms are required' }, { status: 400 });
        }

        
        let allInput = symptoms;
        if (history && history.length > 0) {
            allInput += ' ' + history.map((h: { question: string; answer: string }) => h.question + ' ' + h.answer).join(' ');
        }

        
        const ragResponse = await fetch(`${RAG_API_URL}/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: allInput, history: [] })
        });

        if (!ragResponse.ok) {
            const errData = await ragResponse.json().catch(() => ({}));
            console.error('RAG API error:', errData);
            return NextResponse.json({ error: 'RAG model returned an error' }, { status: 500 });
        }

        const data = await ragResponse.json();
        const aiResponse = data.result;

        
        let urgency: 'Routine' | 'Urgent' | 'Emergency' = 'Routine';
        const lowerRes = aiResponse.toLowerCase();
        if (lowerRes.includes('emergency') || lowerRes.includes('severe') || lowerRes.includes('immediate')) {
            urgency = 'Emergency';
        } else if (lowerRes.includes('doctor') || lowerRes.includes('clinic') || lowerRes.includes('urgent')) {
            urgency = 'Urgent';
        }

        return NextResponse.json({
            needsClarification: false,
            triageResult: {
                urgencyLevel: urgency,
                recommendedAction: aiResponse
            }
        });

    } catch (error) {
        console.error('Triage AI error:', error);
        return NextResponse.json(
            { error: 'Failed to connect to the RAG server. Make sure the Python FastAPI server is running.' },
            { status: 500 }
        );
    }
}
