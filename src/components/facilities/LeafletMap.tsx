'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';



delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});


const createUserIcon = () => {
    const html = `
    <div style="position:relative;display:flex;align-items:center;justify-content:center;">
        <span style="position:absolute;display:inline-flex;height:32px;width:32px;border-radius:9999px;background-color:#60a5fa;opacity:0.5;animation:ping 1s cubic-bezier(0,0,0.2,1) infinite;"></span>
        <div style="background-color:#2563eb;padding:8px;border-radius:9999px;box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);border:2px solid white;position:relative;z-index:10;color:white;display:flex;align-items:center;justify-content:center;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
    </div>
    `;
    return L.divIcon({ html, className: 'custom-leaflet-icon', iconSize: [32, 32], iconAnchor: [16, 16] });
};

const createFacilityIcon = (type: string) => {
    const color = type === 'Hospital' ? '#ef4444' : '#f97316';
    const html = `<div style="padding:8px;border-radius:9999px;box-shadow:0 1px 3px 0 rgba(0,0,0,0.1);border:2px solid white;background-color:${color};width:20px;height:20px;display:flex;"></div>`;
    return L.divIcon({ html, className: 'facility-icon', iconSize: [20, 20], iconAnchor: [10, 10] });
};


function RouteDrawer({ coordinates, selectedFacility, onRouteFound }: { coordinates: any, selectedFacility?: any, onRouteFound: (info: any) => void }) {
    const map = useMap();
    const [route, setRoute] = useState<[number, number][]>([]);

    useEffect(() => {
        if (!selectedFacility || !selectedFacility.lat || !selectedFacility.lng) {
            
            setRoute([]);
            onRouteFound(null);
            map.setView([coordinates.lat, coordinates.lng], 13);
            return;
        }

        const fetchRoute = async () => {
            try {
                
                const url = `https://router.project-osrm.org/route/v1/driving/${coordinates.lng},${coordinates.lat};${selectedFacility.lng},${selectedFacility.lat}?overview=full&geometries=geojson`;
                const res = await fetch(url);
                const data = await res.json();

                if (data.routes && data.routes.length > 0) {
                    
                    
                    const coords = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
                    setRoute(coords);

                    onRouteFound({
                        distance: data.routes[0].distance, 
                        duration: data.routes[0].duration  
                    });

                    const bounds = L.latLngBounds(coords);
                    map.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 1.5 });
                } else {
                    const bounds = L.latLngBounds([
                        [coordinates.lat, coordinates.lng],
                        [selectedFacility.lat, selectedFacility.lng]
                    ]);
                    map.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 1.5 });
                }
            } catch (err) {
                console.error("Failed to fetch route", err);
                const bounds = L.latLngBounds([
                    [coordinates.lat, coordinates.lng],
                    [selectedFacility.lat, selectedFacility.lng]
                ]);
                map.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 1.5 });
            }
        };

        fetchRoute();
        
    }, [coordinates, selectedFacility, map]);

    return (
        <Polyline
            key={selectedFacility?._id || 'empty-route'}
            positions={route}
            color="#2563eb"
            weight={6}
            opacity={0.8}
        />
    );
}


export default function LeafletMap({ coordinates, facilities, selectedFacility, onMarkerClick, onRouteFound }: { coordinates: any, facilities: any[], selectedFacility?: any, onMarkerClick: (f: any) => void, onRouteFound: (i: any) => void }) {
    return (
        <MapContainer
            center={[coordinates.lat, coordinates.lng]}
            zoom={13}
            style={{ height: '100%', width: '100%', zIndex: 0 }}
            scrollWheelZoom={true}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <RouteDrawer coordinates={coordinates} selectedFacility={selectedFacility} onRouteFound={onRouteFound} />

            
            <Marker position={[coordinates.lat, coordinates.lng]} icon={createUserIcon()}>
                <Popup>You are here</Popup>
            </Marker>

            
            {facilities.map((fac) => {
                if (!fac.lat || !fac.lng) return null;
                const isSelected = selectedFacility?._id === fac._id;

                return (
                    <Marker
                        key={fac._id}
                        position={[fac.lat, fac.lng]}
                        icon={createFacilityIcon(fac.type)}
                        ref={(ref) => {
                            if (ref && isSelected) {
                                
                                setTimeout(() => ref.openPopup(), 1500);
                            }
                        }}
                        eventHandlers={{
                            click: () => onMarkerClick(fac)
                        }}
                    >
                        <Popup>
                            <strong>{fac.name}</strong><br />
                            {fac.type}<br />
                            {fac.distanceMeter ? `~${Math.round(fac.distanceMeter)}m away` : ''}
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}
