import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { encrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const { phoneNumber, password, role, firstName, lastName } = await request.json();

        if (!phoneNumber || !password) {
            return NextResponse.json({ error: 'Phone number and password are required' }, { status: 400 });
        }

        await connectToDatabase();

        
        const existingUser = await User.findOne({ phoneNumber });
        if (existingUser) {
            return NextResponse.json({ error: 'User with this phone number already exists' }, { status: 400 });
        }

        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        
        const newUser = await User.create({
            phoneNumber,
            password: hashedPassword,
            role: role || 'patient',
            firstName,
            lastName
        });

        
        const sessionPayload = {
            userId: newUser._id.toString(),
            role: newUser.role,
            phoneNumber: newUser.phoneNumber
        };

        const session = await encrypt(sessionPayload);

        
        (await cookies()).set('session', session, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7 
        });

        
        const userObj = newUser.toObject();
        delete userObj.password;

        return NextResponse.json({ user: userObj }, { status: 201 });

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Failed to register user' }, { status: 500 });
    }
}
