import { useState, useEffect } from "react";

interface Position {
  latitude: number;
  longitude: number;
}

interface GeofenceConfig {
  center: Position;
  radius: number; // in meters
}

// Default campus location (can be configured)
const DEFAULT_CAMPUS_GEOFENCE: GeofenceConfig = {
  center: {
    latitude: 28.6139, // New Delhi coordinates as example
    longitude: 77.2090,
  },
  radius: 1000, // 1km radius
};

export const useGeoFence = (geofence: GeofenceConfig = DEFAULT_CAMPUS_GEOFENCE) => {
  const [position, setPosition] = useState<Position | null>(null);
  const [isWithinGeofence, setIsWithinGeofence] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const calculateDistance = (pos1: Position, pos2: Position): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (pos1.latitude * Math.PI) / 180;
    const φ2 = (pos2.latitude * Math.PI) / 180;
    const Δφ = ((pos2.latitude - pos1.latitude) * Math.PI) / 180;
    const Δλ = ((pos2.longitude - pos1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const getCurrentPosition = (): Promise<Position> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              reject(new Error("Location access denied by user"));
              break;
            case error.POSITION_UNAVAILABLE:
              reject(new Error("Location information unavailable"));
              break;
            case error.TIMEOUT:
              reject(new Error("Location request timed out"));
              break;
            default:
              reject(new Error("Unknown location error"));
              break;
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  };

  const checkGeofence = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const currentPosition = await getCurrentPosition();
      setPosition(currentPosition);

      const distance = calculateDistance(currentPosition, geofence.center);
      const withinFence = distance <= geofence.radius;
      
      setIsWithinGeofence(withinFence);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Location check failed");
      setIsWithinGeofence(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkGeofence();
  }, []);

  return {
    position,
    isWithinGeofence,
    error,
    isLoading,
    checkGeofence,
    distance: position ? calculateDistance(position, geofence.center) : null,
  };
};
