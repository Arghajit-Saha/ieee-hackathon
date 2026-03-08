import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { ShieldWarning, Heartbeat, Users } from '@phosphor-icons/react/dist/ssr';
import { connectToDatabase } from '@/lib/mongodb';
import TriageLog from '@/models/TriageLog';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    await connectToDatabase();


    const activeEmergencies = await TriageLog.countDocuments({
        urgencyLevel: 'Emergency',
    });


    const pendingReviews = await TriageLog.countDocuments({
        urgencyLevel: 'Urgent',
    });


    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const seenToday = await TriageLog.countDocuments({
        createdAt: { $gte: startOfDay }
    });


    const recentAlerts = await TriageLog.find({
        urgencyLevel: { $in: ['Emergency', 'Urgent'] }
    })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

    return (
        <DashboardLayout>

            <div className="mb-10">
                <p className="font-mono-ui text-[10px] tracking-wider uppercase text-zinc-400 mb-3">Health Command / Regional Surveillance</p>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                    Regional <span className="text-zinc-400">Surveillance &amp; Alerts</span>
                </h1>
                <p className="text-zinc-500 text-sm mt-2">Monitoring high-priority health vulnerabilities in your jurisdiction.</p>
            </div>


            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                <div className="bg-white border-2 border-black p-6 brutal-shadow flex items-center justify-between">
                    <div>
                        <p className="font-mono-ui text-[9px] tracking-wider uppercase text-zinc-400 mb-1">Critical Life Alerts</p>
                        <p className="text-4xl font-extrabold text-red-600">{activeEmergencies}</p>
                    </div>
                    <div className="w-12 h-12 bg-red-50 border-2 border-red-200 flex items-center justify-center">
                        <ShieldWarning size={22} weight="bold" className="text-red-600" />
                    </div>
                </div>

                <div className="bg-white border-2 border-black p-6 brutal-shadow flex items-center justify-between">
                    <div>
                        <p className="font-mono-ui text-[9px] tracking-wider uppercase text-zinc-400 mb-1">Pending Field Reviews</p>
                        <p className="text-4xl font-extrabold text-amber-600">{pendingReviews}</p>
                    </div>
                    <div className="w-12 h-12 bg-amber-50 border-2 border-amber-200 flex items-center justify-center">
                        <Heartbeat size={22} weight="bold" className="text-amber-600" />
                    </div>
                </div>

                <div className="bg-white border-2 border-black p-6 brutal-shadow flex items-center justify-between">
                    <div>
                        <p className="font-mono-ui text-[9px] tracking-wider uppercase text-zinc-400 mb-1">Community Consultations</p>
                        <p className="text-4xl font-extrabold">{seenToday}</p>
                    </div>
                    <div className="w-12 h-12 bg-zinc-100 border-2 border-zinc-200 flex items-center justify-center">
                        <Users size={22} weight="bold" className="text-zinc-600" />
                    </div>
                </div>
            </div>


            <div className="bg-white border-2 border-black brutal-shadow">
                <div className="px-6 py-4 border-b-2 border-black flex items-center justify-between">
                    <h3 className="text-sm font-bold">Active Response Metrics</h3>
                    <span className="font-mono-ui text-[9px] tracking-wider uppercase text-zinc-400">LIVE FEED</span>
                </div>
                <div className="divide-y divide-zinc-200">
                    {recentAlerts.length === 0 ? (
                        <div className="p-6 text-center text-zinc-500 text-sm">No recent alerts found.</div>
                    ) : (
                        recentAlerts.map((log: any) => (
                            <div key={log._id.toString()} className="p-6 flex items-start gap-4 hover:bg-zinc-50 transition-colors">
                                <div className={`w-2 h-2 mt-2 shrink-0 ${log.urgencyLevel === 'Emergency' ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold truncate max-w-lg">{log.symptoms?.[0] || 'Unknown symptom reported'}</p>
                                    <p className="font-mono-ui text-[9px] text-zinc-400 mt-1 tracking-wide uppercase">
                                        {(new Date(log.createdAt)).toLocaleString()} • {log.urgencyLevel}
                                    </p>
                                </div>
                                <Link
                                    href={`/dashboard/doctor/queue?id=${log._id.toString()}`}
                                    className="font-mono-ui text-[10px] font-bold tracking-wider border-2 border-black px-4 py-2 hover:bg-black hover:text-white transition-colors"
                                >
                                    REVIEW
                                </Link>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
