'use client';

import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface LeafletHeatmapProps {
    
    data: any; 
}

export default function LeafletHeatmapImpl({ data }: LeafletHeatmapProps) {
    const hasData = data && data.features && data.features.length > 0;

    return (
        <div className="relative w-full h-full">
            <MapContainer
                center={[28.6139, 77.2090]} 
                zoom={4}
                style={{ height: '100%', width: '100%', zIndex: 0 }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {hasData && data.features.map(
                    
                    (feature: any, index: number) => {
                        const [lng, lat] = feature.geometry.coordinates;
                        const properties = feature.properties;
                        const urgency = properties.urgency;

                        
                        const color = urgency === 2 ? '#ef4444' : '#f97316';

                        return (
                            <CircleMarker
                                key={`heatmap-point-${index}`}
                                center={[lat, lng]}
                                radius={urgency === 2 ? 16 : 10}
                                fillColor={color}
                                fillOpacity={0.6}
                                color="white"
                                weight={2}
                            >
                                <Popup>
                                    <div className="p-1">
                                        <strong className="block mb-1">{properties.facility || 'Triage Log'}</strong>
                                        <span className="text-xs text-gray-500 uppercase tracking-widest block mb-2">
                                            {properties.date}
                                        </span>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full text-white ${urgency === 2 ? 'bg-red-500' : 'bg-orange-500'}`}>
                                            {urgency === 2 ? 'EMERGENCY' : 'URGENT'}
                                        </span>
                                    </div>
                                </Popup>
                            </CircleMarker>
                        );
                    })}
            </MapContainer>

            {!hasData && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 z-20 backdrop-blur-sm">
                    <p className="font-medium text-gray-500">Not enough geospatial data to map outbreaks in this region yet.</p>
                </div>
            )}
        </div>
    );
}
