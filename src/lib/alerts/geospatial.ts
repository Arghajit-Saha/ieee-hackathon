import User from '@/models/User';
import { sendTriageAlert } from '@/lib/sms/twilioService';

export async function checkAndAlertNearbyDoctors(patientCoordinates: [number, number], urgency: string, _symptomSummary: string) {
    try {
        
        const nearbyDoctors = await User.aggregate([
            {
                $geoNear: {
                    near: {
                        type: 'Point',
                        coordinates: patientCoordinates,
                    },
                    distanceField: 'distance',
                    maxDistance: 5000, 
                    query: { role: 'doctor', notificationsEnabled: true },
                    spherical: true,
                },
            },
            {
                $limit: 3 
            }
        ]);

        for (const doctor of nearbyDoctors) {
            if (doctor.phoneNumber) {
                
                await sendTriageAlert(doctor.phoneNumber, urgency, `${Math.round(doctor.distance)} meters away`);
                console.log(`Geospatial Alert sent to Doctor: ${doctor.firstName} (${doctor.distance}m away)`);
            }
        }

        return { success: true, count: nearbyDoctors.length };

    } catch (error) {
        console.error('Failed to trigger geospatial alerts:', error);
        return { success: false, error };
    }
}
