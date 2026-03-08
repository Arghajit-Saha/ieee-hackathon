import FacilityLocator from '@/components/facilities/FacilityLocator';

export default function LocatorPage() {
    return (
        <div className="min-h-screen bg-[#fafafa] pt-16">

            
            <div className="border-b-2 border-black bg-white px-8 md:px-16 py-12">
                <p className="font-mono-ui text-[10px] tracking-wider uppercase text-zinc-400 mb-3">Module / Locator</p>
                <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight">
                    Find Nearby <span className="font-serif-accent italic font-normal text-zinc-400">Healthcare</span>
                </h1>
                <p className="text-zinc-500 text-sm mt-2">Enable location services to find clinics and hospitals near you.</p>
            </div>

            
            <div className="px-8 md:px-16 py-12">
                <FacilityLocator />
            </div>
        </div>
    );
}
