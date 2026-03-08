import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { encrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const { phoneNumber, password } = await request.json();

        if (!phoneNumber || !password) {
            return NextResponse.json({ error: 'Phone number and password are required' }, { status: 400 });
        }

        await connectToDatabase();

        
        const user = await User.findOne({ phoneNumber });
        if (!user || !user.password) {
            return NextResponse.json({ error: 'Invalid phone number or password' }, { status: 401 });
        }

        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return NextResponse.json({ error: 'Invalid phone number or password' }, { status: 401 });
        }

        
        const sessionPayload = {
            userId: user._id.toString(),
            role: user.role,
            phoneNumber: user.phoneNumber
        };

        const session = await encrypt(sessionPayload);

        
        (await cookies()).set('session', session, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7 
        });

        
        const userObj = user.toObject();
        delete userObj.password;

        return NextResponse.json({ user: userObj }, { status: 200 });

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Failed to authenticate user' }, { status: 500 });
    }
}
