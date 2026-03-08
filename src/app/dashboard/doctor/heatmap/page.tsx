import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { connectToDatabase } from '@/lib/mongodb';
import TriageLog from '@/models/TriageLog';
import MapboxHeatmap from '@/components/dashboard/MapboxHeatmap';

export const dynamic = 'force-dynamic';

export default async function HeatmapPage() {
    await connectToDatabase();



    const recentLogs = await TriageLog.find({
        urgencyLevel: { $in: ['Urgent', 'Emergency'] },
        'locationAtTimeOfTriage.coordinates': { $exists: true, $ne: [] }
    })
        .sort({ createdAt: -1 })
        .limit(100)
        .select('locationAtTimeOfTriage urgencyLevel symptoms createdAt')
        .lean();


    const geoJsonData = {
        type: 'FeatureCollection',

        features: recentLogs.map((log: any) => ({
            type: 'Feature',
            properties: {
                urgency: log.urgencyLevel === 'Emergency' ? 2 : 1,
                symptoms: log.symptoms?.join(', '),
            },
            geometry: log.locationAtTimeOfTriage
        }))
    };

    return (
        <DashboardLayout>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Community Health Monitor</h1>
                <p className="text-gray-500 mt-1">Gaining foresight into regional health trends through real-time symptom clustering.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-[600px] relative">
                <MapboxHeatmap data={geoJsonData} />


                <div className="absolute bottom-6 right-6 bg-white p-4 rounded-xl shadow-lg border border-gray-100 z-10">
                    <h4 className="text-sm font-semibold mb-3">Epidemic Intensity</h4>
                    <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                        <div className="w-4 h-4 rounded-full bg-red-600 opacity-80"></div> High Vulnerability (Critical)
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                        <div className="w-4 h-4 rounded-full bg-yellow-400 opacity-80"></div> Mid-Range Trend (Urgent)
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
