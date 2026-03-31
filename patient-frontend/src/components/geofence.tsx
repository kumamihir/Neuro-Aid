import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

import { MapContainer, TileLayer, Circle, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Import marker assets so bundler knows about them
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Create a custom icon instance
const defaultIcon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

type Status = "not-set" | "set" | "outside";

interface Coordinates {
  lat: number;
  lng: number;
}

export default function GeofenceCheck() {
  const [geofence, setGeofence] = useState<Coordinates | null>(null);
  const [status, setStatus] = useState<Status>("not-set");
  const [lastNotified, setLastNotified] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);

  const token = localStorage.getItem("token");
  const BASE_URL = import.meta.env.DEV ? "http://localhost:10001" : "https://patient-backend-olyv.onrender.com";

  // Fetch existing geofence
  useEffect(() => {
    if (!token) return;
    fetch(`${BASE_URL}/api/geofence/get`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data.geofence) {
          setGeofence(data.geofence);
          setStatus("set");
          setDistance(0);
        }
      })
      .catch(() => {});
  }, []);

  const setupGeofence = () => {
    if (!navigator.geolocation) {
      toast({ title: "❌ Location not available" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const newGeofence = { lat: latitude, lng: longitude };
        setGeofence(newGeofence);
        setStatus("set");
        setDistance(0);
        toast({ title: "✅ Geofencing has been set up!" });
        try {
          await fetch(`${BASE_URL}/api/geofence/set`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(newGeofence),
          });
        } catch {
          toast({ title: "⚠ Failed to save geofence in backend" });
        }
      },
      () => toast({ title: "⚠ Please allow location access" })
    );
  };

  useEffect(() => {
    if (!geofence) return;
    const watcher = navigator.geolocation.watchPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      const dist = getDistanceFromLatLonInM(
        latitude,
        longitude,
        geofence.lat,
        geofence.lng
      );
      setDistance(dist);
      if (dist > 200) {
        setStatus("outside");
        const now = Date.now();
        if (!lastNotified || now - lastNotified > 10 * 60 * 1000) {
          sendAlertToBackend();
          setLastNotified(now);
        }
      } else {
        setStatus("set");
      }
      fetch(`${BASE_URL}/api/geofence/update-location`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ lat: latitude, lng: longitude }),
      }).catch(() => {});
    });

    return () => navigator.geolocation.clearWatch(watcher);
  }, [geofence, lastNotified]);

  const sendAlertToBackend = async () => {
    try {
      await fetch(`${BASE_URL}/api/alerts/send-sms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      toast({ title: "📨 Alert sent to relatives" });
    } catch {
      toast({ title: "❌ Failed to send alert" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Geofence Monitoring</CardTitle>
        <CardDescription>
          {status === "not-set"
            ? "No geofence set yet"
            : status === "set"
            ? " Safe zone set"
            : "⚠ Patient is outside safe zone"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Button
          onClick={setupGeofence}
          size="lg"
          variant={status === "set" ? "default" : "destructive"}
        >
          {status === "set" ? " Geofencing Set" : "🚨 Setup Geofencing"}
        </Button>

        {distance !== null && (
          <div className="text-sm font-medium text-gray-700">
            Distance from safe zone center:{" "}
            <span
              className={`font-bold ${
                status === "outside" ? "text-red-600" : "text-green-600"
              }`}
            >
              {distance.toFixed(1)} meters
            </span>
          </div>
        )}

        {geofence && (
          <div className="h-64 w-full mt-4 rounded-lg overflow-hidden">
            <MapContainer
              center={[geofence.lat, geofence.lng]}
              zoom={15}
              scrollWheelZoom={false}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[geofence.lat, geofence.lng]} icon={defaultIcon}>
                <Popup>Safe Zone Center</Popup>
              </Marker>
              <Circle
                center={[geofence.lat, geofence.lng]}
                radius={200}
                pathOptions={{ color: "green", fillColor: "green", fillOpacity: 0.2 }}
              />
            </MapContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper for distance
function getDistanceFromLatLonInM(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371000; // meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
