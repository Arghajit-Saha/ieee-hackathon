import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { connectToDatabase } from '@/lib/mongodb';
import TriageLog from '@/models/TriageLog';
import Teleconsultation from '@/models/Teleconsultation';
import User from '@/models/User';
import { Clock, VideoCamera, FileText, PhoneCall } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function QueuePage() {
    await connectToDatabase();


    const triages = await TriageLog.find({ urgencyLevel: { $in: ['Emergency', 'Urgent'] } })
        .populate('patientId', 'firstName lastName phoneNumber')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();


    const calls = await Teleconsultation.find({ status: 'pending' })
        .populate('patientId', 'firstName lastName phoneNumber')
        .sort({ createdAt: -1 })
        .lean();

    return (
        <DashboardLayout>

            <div className="mb-10">
                <p className="font-mono-ui text-[10px] tracking-wider uppercase text-zinc-400 mb-3">Health Command / Response Queue</p>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                    Active <span className="text-zinc-400">Response / Referring Queue</span>
                </h1>
                <p className="text-zinc-500 text-sm mt-2">Overseeing urgent triage alerts and active field referrals.</p>
            </div>


            <div className="bg-white border-2 border-black brutal-shadow">
                <div className="divide-y-2 divide-zinc-200">
                    {triages.length === 0 && calls.length === 0 ? (
                        <div className="p-16 text-center flex flex-col items-center">
                            <Clock size={40} weight="bold" className="text-zinc-300 mb-4" />
                            <p className="text-sm text-zinc-400">No pending urgent reviews or incoming calls.</p>
                        </div>
                    ) : (
                        <>
                            {calls.map((c: any) => (
                                <div key={c._id.toString()} className="p-6 flex flex-col sm:flex-row gap-5 bg-green-50 hover:bg-green-100 border-l-4 border-green-500 transition-colors">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono-ui text-[9px] tracking-wider uppercase font-bold px-2 py-0.5 border border-green-300 bg-green-100 text-green-700 animate-pulse">
                                                URGENT FIELD CONNECTION
                                            </span>
                                            <span className="font-mono-ui text-[9px] text-zinc-400 tracking-wider">
                                                {new Date(c.createdAt).toLocaleTimeString()}
                                            </span>
                                        </div>

                                        <h3 className="text-sm font-bold">
                                            {c.patientId?.firstName || 'Unknown'} {c.patientId?.lastName || 'Patient'}
                                            <span className="text-xs font-normal text-zinc-400 ml-2">{c.patientId?.phoneNumber || 'No phone'}</span>
                                        </h3>

                                        <div className="flex items-center text-xs text-green-600 font-bold gap-1.5 mt-1">
                                            <PhoneCall size={14} weight="fill" className="animate-bounce" />
                                            Patient is waiting in the video room...
                                        </div>
                                    </div>

                                    <div className="flex items-center sm:items-start sm:flex-col gap-2">
                                        <Link
                                            href={`/dashboard/doctor/consults?room=${c._id.toString()}`}
                                            className="bg-green-600 text-white px-4 py-3 font-mono-ui text-[10px] font-bold tracking-wider flex items-center gap-2 border-2 border-green-700 hover:bg-green-700 transition-colors shadow-[4px_4px_0px_0px_rgba(21,128,61,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]"
                                        >
                                            <VideoCamera size={16} weight="fill" />
                                            OPEN TELECARE CHANNEL
                                        </Link>
                                    </div>
                                </div>
                            ))}
                            {triages.map((t: any) => (
                                <div key={t._id.toString()} className="p-6 flex flex-col sm:flex-row gap-5 hover:bg-zinc-50 transition-colors">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-mono-ui text-[9px] tracking-wider uppercase font-bold px-2 py-0.5 border ${t.urgencyLevel === 'Emergency'
                                                ? 'border-red-300 bg-red-50 text-red-700'
                                                : 'border-amber-300 bg-amber-50 text-amber-700'
                                                }`}>
                                                {t.urgencyLevel.toUpperCase()}
                                            </span>
                                            <span className="font-mono-ui text-[9px] text-zinc-400 tracking-wider">
                                                {new Date(t.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <h3 className="text-sm font-bold">
                                            {t.patientId?.firstName || 'Unknown'} {t.patientId?.lastName || 'Patient'}
                                            <span className="text-xs font-normal text-zinc-400 ml-2">{t.patientId?.phoneNumber || 'No phone'}</span>
                                        </h3>

                                        {t.symptoms && t.symptoms.length > 0 && (
                                            <p className="text-xs text-zinc-500 bg-zinc-50 p-3 border-2 border-zinc-100 line-clamp-2">
                                                Symptoms: {t.symptoms.join(', ')}
                                            </p>
                                        )}

                                        {t.recommendedAction && (
                                            <div className="flex items-center text-xs text-zinc-400 gap-1.5 mt-1">
                                                <FileText size={12} weight="bold" />
                                                Community AI Insight Ready
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center sm:items-start sm:flex-col gap-2">
                                        {t.urgencyLevel === 'Emergency' ? (
                                            <Link
                                                href={`/dashboard/doctor/consults?room=${t._id.toString()}`}
                                                className="bg-black text-white px-4 py-2 font-mono-ui text-[10px] font-bold tracking-wider flex items-center gap-2 border-2 border-black hover:bg-zinc-800 transition-colors"
                                            >
                                                <VideoCamera size={14} weight="bold" />
                                                JOIN CALL
                                            </Link>
                                        ) : (
                                            <Link
                                                href={`/dashboard/doctor/review/${t._id.toString()}`}
                                                className="bg-white text-black px-4 py-2 font-mono-ui text-[10px] font-bold tracking-wider border-2 border-black hover:bg-black hover:text-white transition-colors"
                                            >
                                                REVIEW CASE
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
