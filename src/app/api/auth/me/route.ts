import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('session')?.value;

        if (!sessionCookie) {
            return NextResponse.json({ user: null }, { status: 401 });
        }

        const session = await decrypt(sessionCookie);

        if (!session || !session.userId) {
            return NextResponse.json({ user: null }, { status: 401 });
        }

        await connectToDatabase();
        const user = await User.findById(session.userId).select('-password');

        if (!user) {
            return NextResponse.json({ user: null }, { status: 401 });
        }

        return NextResponse.json({ user }, { status: 200 });
    } catch (error) {
        console.error('Auth check error:', error);
        return NextResponse.json({ user: null }, { status: 500 });
    }
}
