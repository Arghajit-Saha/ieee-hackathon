'use client';

import { useState, useEffect } from 'react';

interface LocationState {
    coordinates: { lat: number; lng: number } | null;
    error: string | null;
    isLoading: boolean;
}

export function useGeolocation() {
    const [location, setLocation] = useState<LocationState>({
        coordinates: null,
        error: null,
        isLoading: true,
    });

    const requestLocation = () => {
        setLocation(prev => ({ ...prev, isLoading: true, error: null }));

        if (!navigator.geolocation) {
            setLocation({
                coordinates: null,
                error: 'Geolocation is not supported by your browser',
                isLoading: false,
            });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    coordinates: {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    },
                    error: null,
                    isLoading: false,
                });
            },
            (error) => {
                let errorMessage = 'An error occurred while retrieving location.';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "User denied the request for Geolocation.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "Location information is unavailable.";
                        break;
                    case error.TIMEOUT:
                        errorMessage = "The request to get user location timed out.";
                        break;
                }
                setLocation({
                    coordinates: null,
                    error: errorMessage,
                    isLoading: false,
                });
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    useEffect(() => {
        requestLocation();
    }, []);

    return { ...location, requestLocation };
}
