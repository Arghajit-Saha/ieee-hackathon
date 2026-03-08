import mongoose, { Schema, Document } from 'mongoose';

export interface IFacility extends Document {
    name: string;
    type: 'hospital' | 'phc' | 'pharmacy';
    address: string;
    location: {
        type: 'Point';
        coordinates: [number, number]; 
    };
    contactNumber?: string;
    operatingHours?: string;
}

const FacilitySchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        type: { type: String, enum: ['hospital', 'phc', 'pharmacy'], required: true },
        address: { type: String, required: true },
        location: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], required: true, index: '2dsphere' },
        },
        contactNumber: { type: String },
        operatingHours: { type: String },
    },
    { timestamps: true }
);

export default mongoose.models.Facility || mongoose.model<IFacility>('Facility', FacilitySchema);
