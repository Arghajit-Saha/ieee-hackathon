import { NextResponse } from 'next/server';


function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const lat = parseFloat(searchParams.get('lat') || '0');
        const lng = parseFloat(searchParams.get('lng') || '0');
        const radiusInMeters = parseInt(searchParams.get('radius') || '10000'); 

        if (!lat || !lng) {
            return NextResponse.json({ error: 'Latitude and longitude required' }, { status: 400 });
        }

        
        const overpassQuery = `
            [out:json][timeout:25];
            (
                node["amenity"="hospital"](around:${radiusInMeters},${lat},${lng});
                way["amenity"="hospital"](around:${radiusInMeters},${lat},${lng});
                node["amenity"="clinic"](around:${radiusInMeters},${lat},${lng});
                way["amenity"="clinic"](around:${radiusInMeters},${lat},${lng});
            );
            out center;
        `;

        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: overpassQuery,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        if (!response.ok) {
            throw new Error(`Overpass API responded with status: ${response.status}`);
        }

        const data = await response.json();

        
        const facilities = data.elements.map((el: any) => {
            const itemLat = el.lat || (el.center && el.center.lat);
            const itemLon = el.lon || (el.center && el.center.lon);

            return {
                _id: el.id.toString(),
                name: el.tags.name || 'Unnamed Healthcare Facility',
                type: el.tags.amenity === 'hospital' ? 'Hospital' : 'Clinic',
                address: [
                    el.tags['addr:street'],
                    el.tags['addr:city']
                ].filter(Boolean).join(', ') || 'Address not listed',
                distanceMeter: getDistanceInMeters(lat, lng, itemLat, itemLon),
                contactNumber: el.tags.phone || el.tags['contact:phone'] || undefined,
            };
            
        }).sort((a: any, b: any) => a.distanceMeter - b.distanceMeter).slice(0, 15); 

        return NextResponse.json(facilities);

    } catch (error) {
        console.error('External API Facility search error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch nearby facilities from live API' },
            { status: 500 }
        );
    }
}
