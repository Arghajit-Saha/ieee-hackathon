import mongoose, { Schema, Document } from 'mongoose';

export interface ITeleconsultation extends Document {
    patientId: mongoose.Types.ObjectId;
    doctorId?: mongoose.Types.ObjectId; 
    type: 'synchronous' | 'asynchronous';
    status: 'pending' | 'active' | 'completed' | 'cancelled';
    scheduledAt?: Date;
    startedAt?: Date;
    endedAt?: Date;
    symptomsNote?: string;
    mediaUrls?: string[]; 
    meetingUrl?: string; 
    notes?: string; 
    createdAt: Date;
    updatedAt: Date;
}

const TeleconsultationSchema: Schema = new Schema(
    {
        patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        doctorId: { type: Schema.Types.ObjectId, ref: 'User' },
        type: { type: String, enum: ['synchronous', 'asynchronous'], required: true },
        status: {
            type: String,
            enum: ['pending', 'active', 'completed', 'cancelled'],
            default: 'pending'
        },
        scheduledAt: { type: Date },
        startedAt: { type: Date },
        endedAt: { type: Date },
        symptomsNote: { type: String },
        mediaUrls: [{ type: String }],
        meetingUrl: { type: String },
        notes: { type: String },
    },
    { timestamps: true }
);

export default mongoose.models.Teleconsultation ||
    mongoose.model<ITeleconsultation>('Teleconsultation', TeleconsultationSchema);
