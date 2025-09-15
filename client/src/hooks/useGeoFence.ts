import { useEffect, useState } from "react";
import * as turf from "@turf/turf";
import type { Feature, LineString, MultiLineString, Point, Polygon } from "geojson";
import geojsonData from "../data/classroom.json";

const classroomPolygon = geojsonData.features[0] as Feature<Polygon>;

export function useGeoFence() {
  const [isWithinGeofence, setIsWithinGeofence] = useState<boolean | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation not supported by your browser");
      setGeoLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const point: Feature<Point> = turf.point([longitude, latitude]);

        // ✅ check inside
        const inside = turf.booleanPointInPolygon(point, classroomPolygon);
        setIsWithinGeofence(inside);

        // ✅ distance to nearest edge
        const lineCollection = turf.polygonToLine(classroomPolygon);
        const lineFeature = (lineCollection.type === "FeatureCollection"
          ? lineCollection.features[0]
          : lineCollection) as Feature<LineString | MultiLineString>;

        const nearest = turf.nearestPointOnLine(lineFeature, point);
        const dist = turf.distance(point, nearest, { units: "meters" });
        setDistance(dist);

        setGeoLoading(false);
      },
      (err) => {
        setGeoError(err.message);
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  return { isWithinGeofence, distance, geoError, geoLoading };
}
