import { jwtVerify, SignJWT } from 'jose';

interface SessionPayload {
    userId: string;
    role: string;
    phoneNumber: string;
    [key: string]: any;
}

const secretKey = process.env.JWT_SECRET || 'fallback_secret_for_development_only';
const encodedKey = new TextEncoder().encode(secretKey);

export async function encrypt(payload: SessionPayload) {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(encodedKey);
}

export async function decrypt(session: string | undefined = '') {
    if (!session) return null;
    try {
        const { payload } = await jwtVerify(session, encodedKey, {
            algorithms: ['HS256'],
        });
        return payload as SessionPayload;
    } catch (error) {
        return null;
    }
}
