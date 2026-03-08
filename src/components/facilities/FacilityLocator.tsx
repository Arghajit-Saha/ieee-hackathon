'use client';

import { useEffect, useState } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { MapPin, NavigationArrow, Phone, WarningCircle, ArrowClockwise } from '@phosphor-icons/react';
import { getDB } from '@/lib/offline/idb';
import dynamic from 'next/dynamic';

const LeafletMap = dynamic(() => import('./LeafletMap'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-zinc-100 text-zinc-400 font-mono text-xs tracking-wider">
            LOADING MAP...
        </div>
    ),
});

interface Facility {
    _id: string;
    name: string;
    type: string;
    address: string;
    distanceMeter?: number;
    contactNumber?: string;
    lat?: number;
    lng?: number;
}

export default function FacilityLocator() {
    const { coordinates, error: geoError, isLoading: geoLoading, requestLocation } = useGeolocation();
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
    const [routeInfo, setRouteInfo] = useState<{ distance: number, duration: number } | null>(null);

    useEffect(() => {
        if (coordinates) {
            fetchNearbyFacilities(coordinates.lat, coordinates.lng);
        }
    }, [coordinates]);

    useEffect(() => {
        if (selectedFacility) {
            const el = document.getElementById(`facility-${selectedFacility._id}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [selectedFacility]);

    const fetchNearbyFacilities = async (lat: number, lng: number) => {
        setLoading(true);
        setError(null);
        try {
            if (typeof window !== 'undefined' && navigator.onLine) {
                const res = await fetch(`/api/facilities/nearby?lat=${lat}&lng=${lng}`);
                if (!res.ok) throw new Error('Failed to fetch from server');
                const data = await res.json();
                setFacilities(data);

                const db = await getDB();
                if (db) {
                    await db.clear('facilityCache');
                    for (const f of data) {
                        await db.put('facilityCache', { ...f, id: f._id });
                    }
                }
            } else {
                const db = await getDB();
                if (db) {
                    const cached = await db.getAll('facilityCache');
                    if (cached.length > 0) {
                        setFacilities(cached);
                    } else {
                        throw new Error('Offline — no cached facilities available.');
                    }
                }
            }
            
        } catch (err: any) {
            setError(err.message || 'Error fetching facilities');
        } finally {
            setLoading(false);
        }
    };

    if (geoLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <div className="w-6 h-6 border-2 border-black border-t-transparent animate-spin"></div>
                <p className="font-mono text-xs text-zinc-500 tracking-wider">GETTING LOCATION...</p>
            </div>
        );
    }

    if (geoError || error) {
        return (
            <div className="bg-white border-2 border-red-500 p-6">
                <div className="flex items-center gap-3 text-red-700 mb-4">
                    <WarningCircle size={24} weight="bold" />
                    <h3 className="font-bold">Location Access Required</h3>
                </div>
                <p className="text-sm text-red-600 mb-4">{geoError || error}</p>
                <button
                    onClick={requestLocation}
                    className="flex items-center gap-2 bg-black text-white px-4 py-2 text-sm font-semibold border-2 border-black hover:bg-zinc-800 transition-colors"
                >
                    <ArrowClockwise size={14} weight="bold" />
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Nearby Clinics</h2>
                {loading && <div className="w-4 h-4 border-2 border-black border-t-transparent animate-spin"></div>}
            </div>

            <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-14rem)] min-h-[500px]">

                
                <div className="w-full lg:w-1/3 flex flex-col space-y-3 overflow-y-auto pr-2 pb-4">
                    {facilities.map((facility) => (
                        <div
                            key={facility._id}
                            id={`facility-${facility._id}`}
                            onClick={() => setSelectedFacility(facility)}
                            className={`bg-white p-4 border-2 cursor-pointer transition-all duration-150 ${selectedFacility?._id === facility._id
                                ? 'border-black brutal-shadow-sm'
                                : 'border-zinc-200 hover:border-black'
                                }`}
                        >
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                    <h3 className="font-semibold text-sm line-clamp-1">{facility.name}</h3>
                                    <span className="font-mono text-[9px] tracking-wider uppercase font-bold px-1.5 py-0.5 bg-zinc-100 border border-zinc-200 text-zinc-500 shrink-0">
                                        {facility.type}
                                    </span>
                                </div>

                                <p className="text-zinc-500 text-xs flex items-start gap-1.5">
                                    <MapPin size={12} weight="bold" className="mt-0.5 shrink-0" />
                                    <span className="line-clamp-2">{facility.address}</span>
                                </p>

                                {facility.contactNumber && (
                                    <p className="text-zinc-500 text-xs flex items-center gap-1.5">
                                        <Phone size={12} weight="bold" /> {facility.contactNumber}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-100">
                                <div className="flex flex-col">
                                    {facility.distanceMeter && (
                                        <span className="font-mono text-[10px] text-zinc-400 tracking-wider">
                                            {Math.round(facility.distanceMeter)}M AERIAL
                                        </span>
                                    )}
                                    {selectedFacility?._id === facility._id && routeInfo && (
                                        <span className="font-mono text-[10px] text-black font-bold tracking-wider mt-0.5">
                                            {(routeInfo.distance / 1000).toFixed(1)} KM • {Math.round(routeInfo.duration / 60)} MIN
                                        </span>
                                    )}
                                </div>
                                <a
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURI(facility.name + ' ' + facility.address)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="bg-black text-white px-3 py-1.5 text-[10px] font-bold tracking-wider flex items-center gap-1.5 hover:bg-zinc-800 transition-colors"
                                >
                                    <NavigationArrow size={10} weight="bold" />
                                    NAV
                                </a>
                            </div>
                        </div>
                    ))}

                    {!loading && facilities.length === 0 && (
                        <div className="text-center p-8 border-2 border-dashed border-zinc-300">
                            <p className="text-zinc-500 text-sm">No facilities found near your location.</p>
                        </div>
                    )}
                </div>

                
                <div className="w-full lg:w-2/3 h-[500px] lg:h-full border-2 border-black overflow-hidden relative bg-zinc-100 z-0">
                    {coordinates ? (
                        <LeafletMap
                            coordinates={coordinates}
                            facilities={facilities}
                            selectedFacility={selectedFacility}
                            onMarkerClick={(fac: Facility) => setSelectedFacility(fac)}
                            onRouteFound={(info: { distance: number, duration: number } | null) => setRouteInfo(info)}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="font-mono text-xs text-zinc-400 tracking-wider">WAITING FOR COORDINATES...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
