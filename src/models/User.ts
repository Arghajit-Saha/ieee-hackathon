import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    phoneNumber: string;
    password?: string; 
    role: 'patient' | 'doctor';
    firstName?: string;
    lastName?: string;
    age?: number;
    gender?: string;
    location?: {
        type: 'Point';
        coordinates: [number, number]; 
    };
    languagePref?: string;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema(
    {
        phoneNumber: { type: String, required: true, unique: true },
        password: { type: String }, 
        role: { type: String, enum: ['patient', 'doctor'], default: 'patient' },
        firstName: { type: String },
        lastName: { type: String },
        age: { type: Number },
        gender: { type: String },
        location: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], index: '2dsphere' },
        },
        languagePref: { type: String, default: 'en' },
    },
    { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
