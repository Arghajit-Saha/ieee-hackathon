import { Suspense } from 'react';
import PatientConsultClient from './PatientConsultClient';

export default function PatientConsultPage() {
    return (
        <div className="min-h-screen bg-[#fafafa] flex flex-col pt-16">
            <main className="flex-1 p-6 lg:p-12 max-w-7xl mx-auto w-full">
                <div className="mb-8">
                    <h1 className="text-3xl font-black tracking-tight uppercase">Live Consultation</h1>
                    <p className="font-mono-ui text-xs tracking-wider text-zinc-500 mt-2">Connect with a doctor instantly</p>
                </div>

                <Suspense fallback={<div className="font-mono-ui tracking-widest text-xs animate-pulse text-center mt-20">LOADING TELECONSULT...</div>}>
                    <PatientConsultClient />
                </Suspense>
            </main>
        </div>
    );
}
