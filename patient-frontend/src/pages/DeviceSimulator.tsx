import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

import { MapContainer, TileLayer, Circle, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Green icon for geofence center
const geofenceIcon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Custom red icon for device/patient
const deviceIconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="none">
  <circle cx="12" cy="12" r="10" fill="#ef4444" stroke="#fff" stroke-width="2"/>
  <circle cx="12" cy="12" r="4" fill="#fff"/>
</svg>`;

const deviceIcon = L.divIcon({
  html: deviceIconSvg,
  className: "device-marker-icon",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

interface Patient {
  _id: string;
  name: string;
  email: string;
  phone: string;
  deviceId: string;
  subscriptionPlan: string;
}

interface Coordinates {
  lat: number;
  lng: number;
}

const BASE_URL = import.meta.env.DEV ? "http://localhost:10001" : "https://patient-backend-olyv.onrender.com";

// Draggable marker component
function DraggableMarker({
  position,
  onDrag,
}: {
  position: Coordinates;
  onDrag: (pos: Coordinates) => void;
}) {
  const markerRef = useRef<L.Marker>(null);

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker) {
        const latlng = marker.getLatLng();
        onDrag({ lat: latlng.lat, lng: latlng.lng });
      }
    },
  };

  return (
    <Marker
      draggable
      eventHandlers={eventHandlers}
      position={[position.lat, position.lng]}
      icon={deviceIcon}
      ref={markerRef}
    >
      <Popup>
        <strong>📍 GPS Device</strong>
        <br />
        Drag me to simulate patient movement
        <br />
        <span className="text-xs text-gray-500">
          {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
        </span>
      </Popup>
    </Marker>
  );
}

// Click-to-place handler
function MapClickHandler({ onClick }: { onClick: (pos: Coordinates) => void }) {
  useMapEvents({
    click(e) {
      onClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

// Auto-center map when geofence is loaded
function MapUpdater({ center }: { center: Coordinates | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo([center.lat, center.lng], 16, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
}

export default function DeviceSimulator() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [deviceId, setDeviceId] = useState<string>("");
  const [isRegistered, setIsRegistered] = useState(false);
  const [geofenceCenter, setGeofenceCenter] = useState<Coordinates | null>(null);
  const [devicePosition, setDevicePosition] = useState<Coordinates>({ lat: 19.076, lng: 72.8777 }); // Mumbai default
  const [isTracking, setIsTracking] = useState(false);
  const [trackingInterval, setTrackingIntervalState] = useState<number | null>(null);
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [autoWalk, setAutoWalk] = useState(false);
  const [walkAngle, setWalkAngle] = useState(0);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev.slice(-50), `[${time}] ${msg}`]);
  }, []);

  // Scroll logs to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Fetch patients
  useEffect(() => {
    fetch(`${BASE_URL}/api/device/patients`)
      .then((res) => res.json())
      .then((data) => {
        if (data.patients) setPatients(data.patients);
      })
      .catch(() => toast({ title: "❌ Failed to fetch patients" }));
  }, []);

  // Generate a random device ID
  useEffect(() => {
    setDeviceId(`GPS-SIM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
  }, []);

  // Register device to patient
  const registerDevice = async () => {
    if (!selectedPatient) {
      toast({ title: "⚠ Select a patient first" });
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}/api/device/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: selectedPatient, deviceId }),
      });
      const data = await res.json();
      if (data.status === "ok") {
        setIsRegistered(true);
        toast({ title: "✅ Device registered successfully!" });
        addLog(`Device ${deviceId} registered to patient ${data.patient.name}`);

        // Fetch geofence if exists
        fetchGeofence();
      } else {
        toast({ title: `❌ ${data.message}` });
      }
    } catch {
      toast({ title: "❌ Registration failed" });
    }
  };

  // Fetch existing geofence for the patient
  const fetchGeofence = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/device/status/${selectedPatient}`);
      const data = await res.json();
      if (data.tracking?.geofence) {
        setGeofenceCenter(data.tracking.geofence);
        setDevicePosition(data.tracking.geofence); // Start device at geofence center
        addLog(`Geofence found: ${data.tracking.geofence.lat.toFixed(4)}, ${data.tracking.geofence.lng.toFixed(4)}`);
      } else {
        addLog("No geofence set for this patient yet. Set one from the patient app.");
      }
    } catch {
      addLog("⚠ Could not fetch geofence data");
    }
  };

  // Send current device position to backend
  const sendLocation = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/device/location`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId,
          lat: devicePosition.lat,
          lng: devicePosition.lng,
          timestamp: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      setLastResponse(data);

      if (data.withinGeofence === false) {
        addLog(`🚨 ALERT! Patient outside safe zone — ${data.distance}m away`);
      } else if (data.withinGeofence === true) {
        addLog(`✅ Safe — ${data.distance}m from center`);
      } else {
        addLog(`📡 Location sent (no geofence set)`);
      }
    } catch {
      addLog("❌ Failed to send location");
    }
  }, [deviceId, devicePosition]);

  // Start/stop continuous tracking
  const toggleTracking = () => {
    if (isTracking) {
      if (trackingInterval) clearInterval(trackingInterval);
      setTrackingIntervalState(null);
      setIsTracking(false);
      setAutoWalk(false);
      addLog("⏸ Tracking paused");
    } else {
      sendLocation();
      const interval = window.setInterval(() => {
        sendLocation();
      }, 3000);
      setTrackingIntervalState(interval);
      setIsTracking(true);
      addLog("▶ Tracking started (every 3s)");
    }
  };

  // Auto-walk simulation
  useEffect(() => {
    if (!autoWalk || !isTracking) return;
    const walkInterval = setInterval(() => {
      setWalkAngle((prev) => prev + 0.3);
      setDevicePosition((prev) => ({
        lat: prev.lat + (Math.sin(walkAngle) * 0.0003),
        lng: prev.lng + (Math.cos(walkAngle) * 0.0003),
      }));
    }, 2000);
    return () => clearInterval(walkInterval);
  }, [autoWalk, isTracking, walkAngle]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (trackingInterval) clearInterval(trackingInterval);
    };
  }, [trackingInterval]);

  // Calculate distance
  const getDistance = (p1: Coordinates, p2: Coordinates) => {
    const R = 6371000;
    const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
    const dLon = ((p2.lng - p1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((p1.lat * Math.PI) / 180) *
        Math.cos((p2.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const distance = geofenceCenter ? getDistance(devicePosition, geofenceCenter) : null;
  const isOutside = distance !== null && distance > 200;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-emerald-950 text-white">
      {/* Header */}
      <div className="border-b border-emerald-800/40 bg-black/30 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-lg">📡</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">
                GPS Device Simulator
              </h1>
              <p className="text-xs text-emerald-400/70">Neuro-Aid IoT Tracker Module</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
              isTracking
                ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30"
                : "bg-gray-700/50 text-gray-400 ring-1 ring-gray-600/30"
            }`}>
              <span className={`w-2 h-2 rounded-full ${isTracking ? "bg-emerald-400 animate-pulse" : "bg-gray-500"}`} />
              {isTracking ? "LIVE" : "IDLE"}
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Panel — Controls */}
          <div className="space-y-5">
            {/* Device Setup Card */}
            <Card className="bg-gray-900/80 border-emerald-800/30 backdrop-blur-sm shadow-xl shadow-black/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-emerald-200 flex items-center gap-2">
                  🔧 Device Setup
                </CardTitle>
                <CardDescription className="text-emerald-400/60 text-xs">
                  Register this virtual GPS device to a patient
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Device ID */}
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1 block">Device ID</label>
                  <div className="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2 border border-emerald-800/20">
                    <span className="text-emerald-400 text-sm font-mono">{deviceId}</span>
                  </div>
                </div>

                {/* Patient Select */}
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1 block">Assign to Patient</label>
                  <select
                    value={selectedPatient}
                    onChange={(e) => setSelectedPatient(e.target.value)}
                    className="w-full bg-black/40 border border-emerald-800/30 rounded-lg px-3 py-2 text-sm text-gray-200 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none"
                    disabled={isRegistered}
                  >
                    <option value="">Select a patient...</option>
                    {patients.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({p.email}) — {p.subscriptionPlan}
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  onClick={registerDevice}
                  disabled={isRegistered || !selectedPatient}
                  className={`w-full font-semibold transition-all ${
                    isRegistered
                      ? "bg-emerald-700/40 text-emerald-300 cursor-not-allowed"
                      : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25"
                  }`}
                >
                  {isRegistered ? "✅ Device Registered" : "🔗 Register Device"}
                </Button>
              </CardContent>
            </Card>

            {/* Tracking Controls */}
            {isRegistered && (
              <Card className="bg-gray-900/80 border-emerald-800/30 backdrop-blur-sm shadow-xl shadow-black/20 animate-in fade-in slide-in-from-bottom-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-emerald-200 flex items-center gap-2">
                    🎮 Tracking Controls
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={toggleTracking}
                      className={`font-semibold transition-all ${
                        isTracking
                          ? "bg-red-500/80 hover:bg-red-500 text-white"
                          : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white"
                      }`}
                    >
                      {isTracking ? "⏸ Stop" : "▶ Start"} Tracking
                    </Button>
                    <Button
                      onClick={sendLocation}
                      variant="outline"
                      className="border-emerald-700/50 text-emerald-300 hover:bg-emerald-800/30"
                    >
                      📍 Send Once
                    </Button>
                  </div>

                  <Button
                    onClick={() => setAutoWalk(!autoWalk)}
                    variant="outline"
                    className={`w-full transition-all ${
                      autoWalk
                        ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                        : "border-gray-700 text-gray-400 hover:border-emerald-700/50 hover:text-emerald-300"
                    }`}
                    disabled={!isTracking}
                  >
                    {autoWalk ? "🚶 Auto-Walk ON" : "🚶 Enable Auto-Walk"}
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    Drag the red marker on the map, or enable auto-walk
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Status Card */}
            {lastResponse && (
              <Card className={`backdrop-blur-sm shadow-xl shadow-black/20 animate-in fade-in slide-in-from-bottom-2 ${
                isOutside
                  ? "bg-red-950/60 border-red-700/40"
                  : "bg-gray-900/80 border-emerald-800/30"
              }`}>
                <CardHeader className="pb-2">
                  <CardTitle className={`text-lg flex items-center gap-2 ${
                    isOutside ? "text-red-300" : "text-emerald-200"
                  }`}>
                    {isOutside ? "🚨 ALERT — OUTSIDE SAFE ZONE" : "✅ Status: Safe"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-black/20 rounded-lg p-3">
                      <p className="text-gray-500 text-xs mb-1">Distance</p>
                      <p className={`text-xl font-bold ${isOutside ? "text-red-400" : "text-emerald-400"}`}>
                        {lastResponse.distance}m
                      </p>
                    </div>
                    <div className="bg-black/20 rounded-lg p-3">
                      <p className="text-gray-500 text-xs mb-1">Zone Radius</p>
                      <p className="text-xl font-bold text-blue-400">200m</p>
                    </div>
                    <div className="bg-black/20 rounded-lg p-3 col-span-2">
                      <p className="text-gray-500 text-xs mb-1">Current Position</p>
                      <p className="text-sm font-mono text-gray-300">
                        {devicePosition.lat.toFixed(6)}, {devicePosition.lng.toFixed(6)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Center — Map */}
          <div className="lg:col-span-2 space-y-5">
            <Card className="bg-gray-900/80 border-emerald-800/30 backdrop-blur-sm shadow-xl shadow-black/20 overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-emerald-200">🗺️ Live Map</CardTitle>
                  {distance !== null && (
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                      isOutside
                        ? "bg-red-500/20 text-red-300 ring-1 ring-red-500/30 animate-pulse"
                        : "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30"
                    }`}>
                      {isOutside ? "⚠ OUTSIDE" : "✅ INSIDE"} — {Math.round(distance)}m
                    </span>
                  )}
                </div>
                <CardDescription className="text-emerald-400/60 text-xs">
                  {isRegistered
                    ? "Drag the red dot to simulate the patient moving. Green circle = safe zone (200m)."
                    : "Register a device first to start simulation."}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[500px] w-full relative">
                  <MapContainer
                    center={[devicePosition.lat, devicePosition.lng]}
                    zoom={15}
                    scrollWheelZoom={true}
                    style={{ height: "100%", width: "100%" }}
                    className="rounded-b-xl"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Auto-center map on geofence */}
                    <MapUpdater center={geofenceCenter} />

                    {/* Click handler for placing device */}
                    {isRegistered && (
                      <MapClickHandler onClick={(pos) => {
                        setDevicePosition(pos);
                        addLog(`📍 Device placed at ${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`);
                      }} />
                    )}

                    {/* Geofence safe zone */}
                    {geofenceCenter && (
                      <>
                        <Marker position={[geofenceCenter.lat, geofenceCenter.lng]} icon={geofenceIcon}>
                          <Popup>
                            <strong>🏠 Safe Zone Center</strong>
                            <br />
                            <span className="text-xs">
                              {geofenceCenter.lat.toFixed(6)}, {geofenceCenter.lng.toFixed(6)}
                            </span>
                          </Popup>
                        </Marker>
                        <Circle
                          center={[geofenceCenter.lat, geofenceCenter.lng]}
                          radius={200}
                          pathOptions={{
                            color: isOutside ? "#ef4444" : "#22c55e",
                            fillColor: isOutside ? "#ef4444" : "#22c55e",
                            fillOpacity: 0.12,
                            weight: 2,
                          }}
                        />
                      </>
                    )}

                    {/* Draggable device marker */}
                    {isRegistered && (
                      <DraggableMarker
                        position={devicePosition}
                        onDrag={(pos) => {
                          setDevicePosition(pos);
                          addLog(`📍 Dragged to ${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`);
                        }}
                      />
                    )}
                  </MapContainer>

                  {/* Overlay gradient at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-900/80 to-transparent pointer-events-none rounded-b-xl" />
                </div>
              </CardContent>
            </Card>

            {/* Console / Logs */}
            <Card className="bg-gray-900/80 border-emerald-800/30 backdrop-blur-sm shadow-xl shadow-black/20">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-emerald-200 flex items-center gap-2">
                    <span className="font-mono">{'>'}_</span> Device Console
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-gray-300 text-xs"
                    onClick={() => setLogs([])}
                  >
                    Clear
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-black/50 rounded-lg p-3 h-40 overflow-y-auto font-mono text-xs border border-emerald-900/20">
                  {logs.length === 0 && (
                    <p className="text-gray-600">Waiting for activity...</p>
                  )}
                  {logs.map((log, i) => (
                    <div
                      key={i}
                      className={`py-0.5 ${
                        log.includes("ALERT") || log.includes("🚨")
                          ? "text-red-400"
                          : log.includes("✅")
                          ? "text-emerald-400"
                          : log.includes("⚠")
                          ? "text-amber-400"
                          : "text-gray-400"
                      }`}
                    >
                      {log}
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mt-8 mb-12">
          <Card className="bg-gray-900/60 border-emerald-800/20 backdrop-blur-sm">
            <CardContent className="py-6">
              <h3 className="text-lg font-bold text-emerald-200 mb-4">🧠 How This Works (For Judges)</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { icon: "📡", title: "GPS Device", desc: "This page simulates a wearable GPS device (watch/locket) that the patient wears" },
                  { icon: "🔄", title: "Live Tracking", desc: "Sends lat/lng coordinates to the backend every 3 seconds via REST API" },
                  { icon: "🗺️", title: "Geofence Check", desc: "Backend compares device position against the preset safe zone (200m radius)" },
                  { icon: "🚨", title: "Smart Alerts", desc: "If patient leaves the zone → SMS alert to relatives + real-time Socket.IO notification" },
                ].map((step, i) => (
                  <div key={i} className="bg-black/20 rounded-xl p-4 border border-emerald-800/10">
                    <div className="text-2xl mb-2">{step.icon}</div>
                    <h4 className="font-semibold text-emerald-300 text-sm mb-1">{step.title}</h4>
                    <p className="text-xs text-gray-400">{step.desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 bg-emerald-950/30 rounded-lg p-3 border border-emerald-800/20">
                <p className="text-xs text-emerald-400/80">
                  <strong>💡 In production:</strong> This simulator would be replaced by a real GPS tracker (ESP32 + NEO-6M GPS module) 
                  worn as a watch or locket. The hardware sends the same <code className="text-emerald-300">POST /api/device/location</code> API 
                  call — making the transition seamless with zero backend changes.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Style for the device marker */}
      <style>{`
        .device-marker-icon {
          background: none !important;
          border: none !important;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
        }
        .leaflet-container {
          background: #1a1a2e;
        }
      `}</style>
    </div>
  );
}
