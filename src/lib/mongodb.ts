import mongoose, { Connection } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cached: { conn: Connection | null; promise: Promise<typeof mongoose> | null } = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
            return mongoose;
        });
    }

    try {
        const mongooseInstance = await cached.promise;
        cached.conn = mongooseInstance.connection;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}


declare global {
    var mongoose: {
        conn: Connection | null;
        promise: Promise<typeof import('mongoose')> | null;
    };
}
