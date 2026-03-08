import mongoose, { Schema, Document } from 'mongoose';

export interface ITriageLog extends Document {
    patientId: mongoose.Types.ObjectId;
    symptoms: string[];
    rawInput: string;
    urgencyLevel: 'Routine' | 'Urgent' | 'Emergency';
    aiConfidenceScore: number;
    recommendedAction: string;
    nearestFacilityId?: mongoose.Types.ObjectId;
    locationAtTimeOfTriage?: {
        type: 'Point';
        coordinates: [number, number];
    };
    status: 'pending' | 'reviewed' | 'resolved' | 'archived';
    synced: boolean;
    offlineGeneratedId?: string;
    createdAt: Date;
}

const TriageLogSchema: Schema = new Schema(
    {
        patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        symptoms: [{ type: String }],
        rawInput: { type: String, required: true },
        urgencyLevel: {
            type: String,
            enum: ['Routine', 'Urgent', 'Emergency'],
            required: true
        },
        aiConfidenceScore: { type: Number, required: true },
        recommendedAction: { type: String, required: true },
        nearestFacilityId: { type: Schema.Types.ObjectId, ref: 'Facility' },
        locationAtTimeOfTriage: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number] },
        },
        status: {
            type: String,
            enum: ['pending', 'reviewed', 'resolved', 'archived'],
            default: 'pending'
        },
        synced: { type: Boolean, default: true },
        offlineGeneratedId: { type: String },
    },
    { timestamps: true }
);


TriageLogSchema.index({ 'locationAtTimeOfTriage': '2dsphere', createdAt: -1 });

export default mongoose.models.TriageLog || mongoose.model<ITriageLog>('TriageLog', TriageLogSchema);
