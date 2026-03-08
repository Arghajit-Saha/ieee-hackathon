'use client';

import dynamic from 'next/dynamic';

interface MapboxHeatmapProps {
    
    data: any; 
}

const LeafletHeatmapImpl = dynamic(() => import('./LeafletHeatmapImpl'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-xl animate-pulse">
            <p className="text-gray-500 font-medium">Loading outbreak radar...</p>
        </div>
    )
});


export default function MapboxHeatmap({ data }: MapboxHeatmapProps) {
    return <LeafletHeatmapImpl data={data} />;
}
