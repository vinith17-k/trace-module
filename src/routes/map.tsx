import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Shield,
  MapPin,
  Radio,
  AlertTriangle,
  Send,
  Crosshair,
  CheckCircle2,
  PhoneCall,
  Flame,
  Building2,
  Truck,
  ArrowRight,
  RefreshCw,
  Eye,
  Activity,
  Layers,
  Sparkles,
} from "lucide-react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";

export const Route = createFileRoute("/map")({
  component: LiveSignalMapPage,
});

interface SignalIncident {
  id: string;
  refId: string;
  title: string;
  lat: number;
  lng: number;
  svi: number;
  riskTier: "CRITICAL" | "HIGH" | "ELEVATED" | "ROUTINE";
  category: "Intimate Partner Threat" | "Severe Distress" | "Physical Violence" | "Immediate Danger" | "Post-Trauma Shock";
  signals: string[];
  nearestShelter: string;
  eta: string;
  dispatched: boolean;
  timestamp: string;
}

interface HotspotCluster {
  id: string;
  name: string;
  lat: number;
  lng: number;
  incidentCount: number;
  severity: "CRITICAL" | "HIGH" | "ELEVATED";
  dominantSignal: string;
  recommendedAction: string;
  dispatchedUnits: number;
}

interface ShelterResource {
  id: string;
  name: string;
  type: "One-Stop Crisis Center (OSCC)" | "Women Safe House" | "Emergency Medical Care" | "Trauma Recovery Hub";
  lat: number;
  lng: number;
  capacity: string;
  availableBeds: number;
  helpline: string;
}

interface DispatchUnit {
  id: string;
  code: string;
  type: "CAD Police Unit" | "Mobile Medical Squad" | "Crisis Response Team";
  lat: number;
  lng: number;
  status: "AVAILABLE" | "EN_ROUTE" | "ON_SCENE";
  assignedCase?: string;
}

interface CitizenReport {
  id: string;
  lat: number;
  lng: number;
  address: string;
  type: "Distress Call" | "Acoustic Panic" | "Domestic Disturbance" | "SOS Beacon";
  confidence: number;
  timeAgo: string;
}

const REGIONS: Record<
  string,
  { label: string; name: string; center: [number, number]; zoom: number }
> = {
  delhi: {
    label: "Delhi NCR",
    name: "DELHI NATIONAL CAPITAL REGION",
    center: [28.6139, 77.209],
    zoom: 11,
  },
  mumbai: {
    label: "Mumbai Metro",
    name: "MUMBAI METROPOLITAN REGION",
    center: [19.076, 72.8777],
    zoom: 11,
  },
  bengaluru: {
    label: "Bengaluru Urban",
    name: "BENGALURU URBAN REGION",
    center: [12.9716, 77.5946],
    zoom: 11,
  },
  kolkata: {
    label: "Kolkata Hub",
    name: "KOLKATA METROPOLITAN AREA",
    center: [22.5726, 88.3639],
    zoom: 11,
  },
  hyderabad: {
    label: "Hyderabad Metro",
    name: "HYDERABAD CYBERABAD ZONE",
    center: [17.385, 78.4867],
    zoom: 11,
  },
  national: {
    label: "National View (All India)",
    name: "ALL INDIA CRISIS COMMAND RADAR",
    center: [22.5937, 78.9629],
    zoom: 5,
  },
};

const INITIAL_INCIDENTS: Record<string, SignalIncident[]> = {
  delhi: [
    {
      id: "inc-1",
      refId: "NHAA-4F82-K91",
      title: "Connaught Place South Block",
      lat: 28.6289,
      lng: 77.2185,
      svi: 88,
      riskTier: "CRITICAL",
      category: "Immediate Danger",
      signals: ["Weapons mentioned", "Direct threat to life", "Voice trembling / high pitch-shift"],
      nearestShelter: "Sakhi OSCC Lady Hardinge",
      eta: "4 mins",
      dispatched: true,
      timestamp: "2 mins ago",
    },
    {
      id: "inc-2",
      refId: "NHAA-8C21-M44",
      title: "Karol Bagh Block 4",
      lat: 28.6514,
      lng: 77.1907,
      svi: 76,
      riskTier: "CRITICAL",
      category: "Physical Violence",
      signals: ["Barricaded room", "Audible background shouting", "Child present"],
      nearestShelter: "New Delhi Family Support Center",
      eta: "7 mins",
      dispatched: false,
      timestamp: "5 mins ago",
    },
    {
      id: "inc-3",
      refId: "NHAA-1D90-P12",
      title: "Noida Sector 62",
      lat: 28.6255,
      lng: 77.368,
      svi: 64,
      riskTier: "HIGH",
      category: "Intimate Partner Threat",
      signals: ["Digital stalking", "Financial extortion", "Severe emotional distress"],
      nearestShelter: "Noida District Shelter Home",
      eta: "11 mins",
      dispatched: false,
      timestamp: "12 mins ago",
    },
    {
      id: "inc-4",
      refId: "NHAA-9E33-L78",
      title: "Dwarka Sector 10",
      lat: 28.581,
      lng: 77.0601,
      svi: 42,
      riskTier: "ELEVATED",
      category: "Severe Distress",
      signals: ["Depression indicators", "Prolonged isolation", "Needs counselling support"],
      nearestShelter: "West Delhi Community Haven",
      eta: "15 mins",
      dispatched: false,
      timestamp: "24 mins ago",
    },
    {
      id: "inc-5",
      refId: "NHAA-3B77-Q05",
      title: "Rohini Sector 14",
      lat: 28.7183,
      lng: 77.1265,
      svi: 22,
      riskTier: "ROUTINE",
      category: "Post-Trauma Shock",
      signals: ["Follow-up scheduled", "Safe with relative", "Legal guidance requested"],
      nearestShelter: "North Delhi Legal Aid Cell",
      eta: "20 mins",
      dispatched: false,
      timestamp: "38 mins ago",
    },
  ],
  mumbai: [
    {
      id: "inc-m1",
      refId: "NHAA-5M11-A01",
      title: "Andheri West Four Bungalows",
      lat: 19.129,
      lng: 72.8258,
      svi: 84,
      riskTier: "CRITICAL",
      category: "Immediate Danger",
      signals: ["Emergency door lock", "Physical aggression", "Voice biomarker high arousal"],
      nearestShelter: "Cooper Hospital OSCC Wing",
      eta: "6 mins",
      dispatched: true,
      timestamp: "3 mins ago",
    },
    {
      id: "inc-m2",
      refId: "NHAA-7M42-B99",
      title: "Dadar TT Circle",
      lat: 19.0178,
      lng: 72.8478,
      svi: 58,
      riskTier: "HIGH",
      category: "Intimate Partner Threat",
      signals: ["Threat of eviction", "Custody coercion"],
      nearestShelter: "KEM Hospital Crisis Cell",
      eta: "8 mins",
      dispatched: false,
      timestamp: "18 mins ago",
    },
  ],
  bengaluru: [
    {
      id: "inc-b1",
      refId: "NHAA-2B19-X02",
      title: "Indiranagar 100ft Road",
      lat: 12.9784,
      lng: 77.6408,
      svi: 91,
      riskTier: "CRITICAL",
      category: "Immediate Danger",
      signals: ["Physical assault in progress", "Caller whispering in closet", "Rapid breathing rate"],
      nearestShelter: "Bowring OSCC Shelter",
      eta: "5 mins",
      dispatched: true,
      timestamp: "1 min ago",
    },
  ],
  kolkata: [
    {
      id: "inc-k1",
      refId: "NHAA-6K30-W18",
      title: "Salt Lake Sector V",
      lat: 22.5804,
      lng: 88.4378,
      svi: 72,
      riskTier: "HIGH",
      category: "Severe Distress",
      signals: ["Workplace harassment escalation", "High panic score"],
      nearestShelter: "Bidhannagar OSCC Center",
      eta: "9 mins",
      dispatched: false,
      timestamp: "14 mins ago",
    },
  ],
  hyderabad: [
    {
      id: "inc-h1",
      refId: "NHAA-3H88-K50",
      title: "Gachibowli Financial District",
      lat: 17.44,
      lng: 78.3489,
      svi: 80,
      riskTier: "CRITICAL",
      category: "Immediate Danger",
      signals: ["Repeated physical stalking", "Aggressor at premise"],
      nearestShelter: "Cyberabad Bharosa Center",
      eta: "5 mins",
      dispatched: true,
      timestamp: "4 mins ago",
    },
  ],
  national: [],
};

const INITIAL_HOTSPOTS: Record<string, HotspotCluster[]> = {
  delhi: [
    {
      id: "hs-1",
      name: "Central Delhi Corridor (CP - Karol Bagh)",
      lat: 28.638,
      lng: 77.205,
      incidentCount: 14,
      severity: "CRITICAL",
      dominantSignal: "Physical & Verbal Threats (SVI Avg: 82)",
      recommendedAction: "Pre-position Mobile CAD Units & Activate Sakhi Fast-Track Response",
      dispatchedUnits: 3,
    },
    {
      id: "hs-2",
      name: "East Trans-Yamuna Zone",
      lat: 28.632,
      lng: 77.301,
      incidentCount: 8,
      severity: "HIGH",
      dominantSignal: "Domestic Coercion & Isolation",
      recommendedAction: "Assign 2 dedicated vernacular Telugu/Hindi counsellors",
      dispatchedUnits: 1,
    },
  ],
  mumbai: [
    {
      id: "hs-m1",
      name: "Western Suburbs Coastal Belt",
      lat: 19.115,
      lng: 72.83,
      incidentCount: 11,
      severity: "CRITICAL",
      dominantSignal: "Severe Trauma & High Acoustic Distress",
      recommendedAction: "Alert Nirbhaya Mobile Van Unit 4",
      dispatchedUnits: 2,
    },
  ],
  bengaluru: [
    {
      id: "hs-b1",
      name: "East Tech Corridor (Whitefield / Indiranagar)",
      lat: 12.975,
      lng: 77.65,
      incidentCount: 9,
      severity: "HIGH",
      dominantSignal: "Immediate Threat & Stalking Intakes",
      recommendedAction: "Coordinate with Parihar Family Counselling Cell",
      dispatchedUnits: 2,
    },
  ],
  kolkata: [],
  hyderabad: [],
  national: [],
};

const INITIAL_SHELTERS: Record<string, ShelterResource[]> = {
  delhi: [
    {
      id: "sh-1",
      name: "Sakhi One-Stop Center — Lady Hardinge",
      type: "One-Stop Crisis Center (OSCC)",
      lat: 28.634,
      lng: 77.214,
      capacity: "24/7 Medical, Legal, Shelter",
      availableBeds: 12,
      helpline: "011-23340000",
    },
    {
      id: "sh-2",
      name: "Delhi Government Women Safe Haven",
      type: "Women Safe House",
      lat: 28.665,
      lng: 77.185,
      capacity: "Short-stay secure shelter",
      availableBeds: 8,
      helpline: "011-23955555",
    },
    {
      id: "sh-3",
      name: "AIIMS Trauma & Crisis Recovery Hub",
      type: "Emergency Medical Care",
      lat: 28.5672,
      lng: 77.21,
      capacity: "Full Acute Trauma & Psychological Unit",
      availableBeds: 18,
      helpline: "011-26588500",
    },
  ],
  mumbai: [
    {
      id: "sh-m1",
      name: "Sakhi OSCC KEM Hospital",
      type: "One-Stop Crisis Center (OSCC)",
      lat: 19.002,
      lng: 72.842,
      capacity: "Integrated Medical & Legal Support",
      availableBeds: 14,
      helpline: "022-24107000",
    },
  ],
  bengaluru: [
    {
      id: "sh-b1",
      name: "Vanitha Sahayavani (Parihar)",
      type: "Trauma Recovery Hub",
      lat: 12.973,
      lng: 77.585,
      capacity: "Emergency police & trauma counsellors",
      availableBeds: 10,
      helpline: "080-22943225",
    },
  ],
  kolkata: [],
  hyderabad: [],
  national: [],
};

const INITIAL_DISPATCH: Record<string, DispatchUnit[]> = {
  delhi: [
    {
      id: "dsp-1",
      code: "CAD-SQUAD-1091-ALPHA",
      type: "CAD Police Unit",
      lat: 28.625,
      lng: 77.22,
      status: "EN_ROUTE",
      assignedCase: "NHAA-4F82-K91",
    },
    {
      id: "dsp-2",
      code: "MED-CRISIS-VAN-4",
      type: "Mobile Medical Squad",
      lat: 28.648,
      lng: 77.195,
      status: "AVAILABLE",
    },
    {
      id: "dsp-3",
      code: "WOMEN-RAPID-UNIT-9",
      type: "Crisis Response Team",
      lat: 28.61,
      lng: 77.35,
      status: "AVAILABLE",
    },
  ],
  mumbai: [
    {
      id: "dsp-m1",
      code: "NIRBHAYA-VAN-02",
      type: "Crisis Response Team",
      lat: 19.12,
      lng: 72.83,
      status: "EN_ROUTE",
      assignedCase: "NHAA-5M11-A01",
    },
  ],
  bengaluru: [
    {
      id: "dsp-b1",
      code: "BLR-POLICE-PINK-14",
      type: "CAD Police Unit",
      lat: 12.98,
      lng: 77.635,
      status: "EN_ROUTE",
      assignedCase: "NHAA-2B19-X02",
    },
  ],
  kolkata: [],
  hyderabad: [],
  national: [],
};

export function LiveSignalMapPage() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<LeafletMap | null>(null);
  const layerGroupsRef = useRef<{
    incidents?: LayerGroup;
    hotspots?: LayerGroup;
    shelters?: LayerGroup;
    dispatch?: LayerGroup;
    reports?: LayerGroup;
    pin?: LayerGroup;
  }>({});

  const [region, setRegion] = useState<string>("delhi");
  const [layers, setLayers] = useState({
    incidents: true,
    hotspots: true,
    shelters: true,
    dispatch: true,
    reports: true,
  });

  const [incidents, setIncidents] = useState<Record<string, SignalIncident[]>>(INITIAL_INCIDENTS);
  const [hotspots] = useState<Record<string, HotspotCluster[]>>(INITIAL_HOTSPOTS);
  const [shelters] = useState<Record<string, ShelterResource[]>>(INITIAL_SHELTERS);
  const [dispatchUnits] = useState<Record<string, DispatchUnit[]>>(INITIAL_DISPATCH);
  const [reports, setReports] = useState<CitizenReport[]>([]);

  // Geolocation & Reporting state
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [livePin, setLivePin] = useState<{ lat: number; lng: number; accuracy?: number; address?: string } | null>(null);
  const [locatingStatus, setLocatingStatus] = useState<string | null>(null);
  const [reportNote, setReportNote] = useState("");
  const [reportType, setReportType] = useState<CitizenReport["type"]>("Distress Call");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportFeedback, setReportFeedback] = useState<{ msg: string; success: boolean } | null>(null);

  const [currentTimeStr, setCurrentTimeStr] = useState("16:50");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.getHours().toString().padStart(2, "0") +
          ":" +
          now.getMinutes().toString().padStart(2, "0")
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 15000);
    return () => clearInterval(timer);
  }, []);

  // Initialize Leaflet Map safely in client runtime
  useEffect(() => {
    if (typeof window === "undefined") return;

    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current) return;
      if (leafletMapRef.current) return;

      const L = await import("leaflet");

      if (!isMounted || !mapContainerRef.current) return;

      const currentR = REGIONS[region] || REGIONS["delhi"]!;

      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false,
        scrollWheelZoom: true,
      }).setView(currentR.center, currentR.zoom);

      leafletMapRef.current = map;

      // Dark Matter Carto basemap with standard OSM fallback
      const tileUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
      L.tileLayer(tileUrl, {
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);

      // Initialize layer groups
      layerGroupsRef.current = {
        incidents: L.layerGroup().addTo(map),
        hotspots: L.layerGroup().addTo(map),
        shelters: L.layerGroup().addTo(map),
        dispatch: L.layerGroup().addTo(map),
        reports: L.layerGroup().addTo(map),
        pin: L.layerGroup().addTo(map),
      };

      // Click to place a pin on the map
      map.on("click", async (e) => {
        const { lat, lng } = e.latlng;
        setLivePin({ lat, lng });
        reverseGeocode(lat, lng);
      });

      // Trigger size invalidation to avoid grey map tiles
      setTimeout(() => {
        try {
          map.invalidateSize();
        } catch {}
      }, 250);
    }

    initMap();

    return () => {
      isMounted = false;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Handle region change
  useEffect(() => {
    if (!leafletMapRef.current) return;
    const currentR = REGIONS[region] || REGIONS["delhi"]!;
    leafletMapRef.current.flyTo(currentR.center, currentR.zoom, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [region]);

  // Reverse Geocoding helper (OpenStreetMap Nominatim with graceful fallback)
  const reverseGeocode = async (lat: number, lng: number) => {
    setLocatingStatus("LOOKING UP ADDRESS…");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { "User-Agent": "TRACE-National-Helpline/1.0" } }
      );
      if (!res.ok) throw new Error("Lookup error");
      const data = await res.json();
      const addr = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      setLivePin((prev) => (prev ? { ...prev, address: addr } : { lat, lng, address: addr }));
      setLocatingStatus("PIN SET · " + addr.slice(0, 42) + (addr.length > 42 ? "…" : ""));
    } catch {
      const fallback = `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
      setLivePin((prev) => (prev ? { ...prev, address: fallback } : { lat, lng, address: fallback }));
      setLocatingStatus("PIN SET · " + fallback);
    }
  };

  // Browser Geolocation API ("📍 Use my live location" from Project-Shwaas)
  const useLiveLocation = () => {
    if (!("geolocation" in navigator)) {
      setLocatingStatus("GEOLOCATION NOT SUPPORTED ON THIS DEVICE");
      return;
    }
    setLocatingStatus("ACQUIRING HIGH-PRECISION GPS LOCK…");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setLivePin({ lat: latitude, lng: longitude, accuracy });
        if (leafletMapRef.current) {
          leafletMapRef.current.flyTo([latitude, longitude], 16, { duration: 1.2 });
        }
        reverseGeocode(latitude, longitude);
      },
      (err) => {
        setLocatingStatus(
          err.code === 1
            ? "PERMISSION DENIED — PLEASE CLICK ON THE MAP TO DROP PIN"
            : "GPS SIGNAL TIMEOUT — CLICK THE MAP INSTEAD"
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Re-render and synchronize all Leaflet markers when state updates
  useEffect(() => {
    async function renderAllMarkers() {
      if (!leafletMapRef.current) return;
      const L = await import("leaflet");
      const lg = layerGroupsRef.current;
      if (!lg.incidents || !lg.hotspots || !lg.shelters || !lg.dispatch || !lg.reports || !lg.pin) return;

      // 1. Incidents
      lg.incidents.clearLayers();
      if (layers.incidents) {
        const currentIncs =
          region === "national"
            ? Object.values(incidents).flat()
            : incidents[region] || [];

        currentIncs.forEach((inc) => {
          const color =
            inc.riskTier === "CRITICAL"
              ? "#ef4444"
              : inc.riskTier === "HIGH"
              ? "#f97316"
              : inc.riskTier === "ELEVATED"
              ? "#eab308"
              : "#10b981";

          const isCritical = inc.svi >= 75;

          const customIcon = L.divIcon({
            className: "trace-incident-icon",
            iconSize: [36, 36],
            iconAnchor: [18, 18],
            html: `
              <div style="position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center;cursor:pointer;">
                ${
                  isCritical
                    ? `<div style="position:absolute;top:50%;left:50%;width:36px;height:36px;border-radius:50%;border:2px solid ${color};animation:ringPulse 2.2s cubic-bezier(0.2,0.8,0.2,1) infinite;"></div>`
                    : ""
                }
                <div style="width:28px;height:28px;border-radius:50%;background:${color};border:2.5px solid #0f172a;display:flex;align-items:center;justify-content:center;box-shadow:0 0 14px ${color}88;font-family:'JetBrains Mono',monospace;font-weight:800;font-size:10.5px;color:#ffffff;line-height:1;">
                  ${inc.svi}
                </div>
              </div>
            `,
          });

          const popupHtml = `
            <div style="min-width:260px;max-width:320px;font-family:'Inter',sans-serif;color:#f8fafc;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:6px;">
                <span style="font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;color:${color};letter-spacing:0.06em;">${inc.refId}</span>
                <span style="font-size:10px;font-weight:800;background:${color}22;color:${color};border:1px solid ${color}44;padding:2px 6px;border-radius:4px;letter-spacing:0.04em;">${inc.riskTier}</span>
              </div>
              <div style="font-size:14px;font-weight:700;color:#ffffff;margin-bottom:2px;">${inc.title}</div>
              <div style="font-size:11px;color:#94a3b8;margin-bottom:8px;">${inc.category} · ${inc.timestamp}</div>
              
              <div style="background:rgba(0,0,0,0.3);border-radius:8px;padding:8px;margin-bottom:8px;border:1px solid rgba(255,255,255,0.06);">
                <div style="font-size:9.5px;font-weight:700;color:#cbd5e1;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Detected Trauma Signals</div>
                <ul style="margin:0;padding-left:14px;font-size:11.5px;color:#e2e8f0;line-height:1.4;">
                  ${inc.signals.map((s) => `<li>${s}</li>`).join("")}
                </ul>
              </div>

              <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#94a3b8;margin-bottom:10px;">
                <span>Nearest: <strong style="color:#f1f5f9;">${inc.nearestShelter}</strong></span>
                <span style="font-family:'JetBrains Mono',monospace;color:#38bdf8;">ETA ~${inc.eta}</span>
              </div>

              <div style="display:flex;gap:6px;">
                <a href="/staff/case/${inc.refId}" style="flex:1;text-align:center;background:#3b82f6;color:#ffffff;font-size:11px;font-weight:700;padding:7px 10px;border-radius:6px;text-decoration:none;display:inline-block;">
                  View Case
                </a>
                <button onclick="window.__dispatchCase('${inc.id}')" style="flex:1;background:${inc.dispatched ? "#10b981" : "#ef4444"};color:#ffffff;border:none;font-size:11px;font-weight:700;padding:7px 10px;border-radius:6px;cursor:pointer;">
                  ${inc.dispatched ? "CAD Dispatched" : "Dispatch Unit"}
                </button>
              </div>
            </div>
          `;

          L.marker([inc.lat, inc.lng], { icon: customIcon })
            .bindPopup(popupHtml)
            .addTo(lg.incidents!);
        });
      }

      // 2. Hotspots
      lg.hotspots.clearLayers();
      if (layers.hotspots) {
        const currentHotspots =
          region === "national"
            ? Object.values(hotspots).flat()
            : hotspots[region] || [];

        currentHotspots.forEach((hs) => {
          const color = hs.severity === "CRITICAL" ? "#ff2bd6" : "#f59e0b";
          const hotspotIcon = L.divIcon({
            className: "trace-hotspot-icon",
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            html: `
              <div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
                <div style="position:absolute;top:50%;left:50%;width:38px;height:38px;border-radius:50%;border:2px solid ${color};animation:ringPulse 2s cubic-bezier(0.2,0.8,0.2,1) infinite;"></div>
                <div style="width:22px;height:22px;border-radius:50%;background:${color};border:2px solid #0f172a;display:flex;align-items:center;justify-content:center;box-shadow:0 0 18px ${color};">
                  <span style="font-size:11px;">⚠️</span>
                </div>
              </div>
            `,
          });

          const popupHtml = `
            <div style="min-width:260px;font-family:'Inter',sans-serif;color:#f8fafc;">
              <div style="font-size:10px;font-weight:800;color:${color};letter-spacing:0.08em;text-transform:uppercase;">🔥 TRAUMA CONCENTRATION HOTSPOT</div>
              <div style="font-size:14px;font-weight:700;color:#ffffff;margin:2px 0 4px;">${hs.name}</div>
              <div style="font-size:11.5px;color:#94a3b8;margin-bottom:8px;">${hs.incidentCount} active signals detected in 1.5km radius</div>
              
              <div style="font-size:11.5px;color:#e2e8f0;margin-bottom:6px;"><strong>Dominant:</strong> ${hs.dominantSignal}</div>
              <div style="background:rgba(255,43,214,0.1);border:1px solid rgba(255,43,214,0.3);padding:6px 8px;border-radius:6px;font-size:11px;color:#f472b6;margin-bottom:8px;">
                <strong>Protocol:</strong> ${hs.recommendedAction}
              </div>
              <div style="font-size:10px;font-family:'JetBrains Mono',monospace;color:#94a3b8;">
                DISPATCHED SQUADS: ${hs.dispatchedUnits} ACTIVE UNITS
              </div>
            </div>
          `;

          L.marker([hs.lat, hs.lng], { icon: hotspotIcon })
            .bindPopup(popupHtml)
            .addTo(lg.hotspots!);
        });
      }

      // 3. Shelters
      lg.shelters.clearLayers();
      if (layers.shelters) {
        const currentShelters =
          region === "national"
            ? Object.values(shelters).flat()
            : shelters[region] || [];

        currentShelters.forEach((sh) => {
          const shelterIcon = L.divIcon({
            className: "trace-shelter-icon",
            iconSize: [30, 30],
            iconAnchor: [15, 15],
            html: `
              <div style="width:28px;height:28px;border-radius:8px;background:#059669;border:2px solid #ffffff;display:flex;align-items:center;justify-content:center;box-shadow:0 0 10px rgba(5,150,105,0.6);font-size:13px;">
                🏠
              </div>
            `,
          });

          const popupHtml = `
            <div style="min-width:240px;font-family:'Inter',sans-serif;color:#f8fafc;">
              <div style="font-size:10px;font-weight:800;color:#34d399;letter-spacing:0.06em;">VERIFIED SAFE SHELTER RESOURCE</div>
              <div style="font-size:13.5px;font-weight:700;color:#ffffff;margin:2px 0;">${sh.name}</div>
              <div style="font-size:11.5px;color:#94a3b8;margin-bottom:6px;">${sh.type}</div>
              <div style="font-size:11px;color:#cbd5e1;margin-bottom:4px;">Capacity: <strong>${sh.capacity}</strong></div>
              <div style="font-size:11px;color:#34d399;font-weight:600;margin-bottom:8px;">Available Beds: ${sh.availableBeds} Ready Now</div>
              <a href="tel:${sh.helpline}" style="display:inline-block;width:100%;text-align:center;background:#059669;color:#fff;padding:6px;border-radius:6px;text-decoration:none;font-size:11px;font-weight:700;">
                Call Direct: ${sh.helpline}
              </a>
            </div>
          `;

          L.marker([sh.lat, sh.lng], { icon: shelterIcon })
            .bindPopup(popupHtml)
            .addTo(lg.shelters!);
        });
      }

      // 4. Dispatch Units
      lg.dispatch.clearLayers();
      if (layers.dispatch) {
        const currentDispatch =
          region === "national"
            ? Object.values(dispatchUnits).flat()
            : dispatchUnits[region] || [];

        currentDispatch.forEach((d) => {
          const isEnRoute = d.status === "EN_ROUTE";
          const dispatchIcon = L.divIcon({
            className: "trace-dispatch-icon",
            iconSize: [28, 28],
            iconAnchor: [14, 14],
            html: `
              <div style="width:26px;height:26px;border-radius:50%;background:#2563eb;border:2px solid #ffffff;display:flex;align-items:center;justify-content:center;box-shadow:0 0 12px rgba(37,99,235,0.8);font-size:12px;">
                🚓
              </div>
            `,
          });

          const popupHtml = `
            <div style="min-width:220px;font-family:'Inter',sans-serif;color:#f8fafc;">
              <div style="font-size:10px;font-weight:800;color:#60a5fa;letter-spacing:0.06em;">CAD EMERGENCY MOBILE UNIT</div>
              <div style="font-size:13px;font-weight:700;color:#ffffff;margin:2px 0;">${d.code}</div>
              <div style="font-size:11.5px;color:#94a3b8;margin-bottom:6px;">${d.type}</div>
              <div style="display:inline-block;font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px;background:${isEnRoute ? "#f59e0b22" : "#10b98122"};color:${isEnRoute ? "#f59e0b" : "#10b981"};border:1px solid ${isEnRoute ? "#f59e0b44" : "#10b98144"};">
                STATUS: ${d.status}
              </div>
              ${d.assignedCase ? `<div style="font-size:11px;color:#cbd5e1;margin-top:6px;">Assigned: <strong style="color:#60a5fa;">${d.assignedCase}</strong></div>` : ""}
            </div>
          `;

          L.marker([d.lat, d.lng], { icon: dispatchIcon })
            .bindPopup(popupHtml)
            .addTo(lg.dispatch!);
        });
      }

      // 5. Citizen SOS Reports
      lg.reports.clearLayers();
      if (layers.reports) {
        reports.forEach((rep) => {
          const reportIcon = L.divIcon({
            className: "trace-report-icon",
            iconSize: [26, 26],
            iconAnchor: [13, 13],
            html: `
              <div style="width:24px;height:24px;border-radius:50%;background:#8b5cf6;border:2px solid #ffffff;display:flex;align-items:center;justify-content:center;box-shadow:0 0 10px rgba(139,92,246,0.8);font-size:11px;">
                📢
              </div>
            `,
          });

          const popupHtml = `
            <div style="min-width:200px;font-family:'Inter',sans-serif;color:#f8fafc;">
              <div style="font-size:10px;font-weight:800;color:#a78bfa;letter-spacing:0.06em;">CITIZEN GEOTAGGED DISTRESS REPORT</div>
              <div style="font-size:13px;font-weight:700;color:#ffffff;margin:2px 0;">${rep.type}</div>
              <div style="font-size:11px;color:#cbd5e1;margin-bottom:4px;">${rep.address}</div>
              <div style="font-size:10px;color:#94a3b8;">Confidence: ${Math.round(rep.confidence * 100)}% · ${rep.timeAgo}</div>
            </div>
          `;

          L.marker([rep.lat, rep.lng], { icon: reportIcon })
            .bindPopup(popupHtml)
            .addTo(lg.reports!);
        });
      }

      // 6. Live Pin / Geolocation Marker
      lg.pin.clearLayers();
      if (livePin) {
        const pinIcon = L.divIcon({
          className: "trace-pin-icon",
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          html: `
            <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
              <div style="font-size:24px;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.8));">📍</div>
            </div>
          `,
        });

        L.marker([livePin.lat, livePin.lng], { icon: pinIcon })
          .bindPopup(
            `<div style="font-family:'Inter',sans-serif;color:#fff;"><strong>GPS Lock:</strong><br>${livePin.address || `${livePin.lat.toFixed(4)}, ${livePin.lng.toFixed(4)}`}</div>`
          )
          .addTo(lg.pin);

        if (livePin.accuracy) {
          L.circle([livePin.lat, livePin.lng], {
            radius: livePin.accuracy,
            color: "#38bdf8",
            fillColor: "#38bdf8",
            fillOpacity: 0.15,
            weight: 1.5,
          }).addTo(lg.pin);
        }
      }
    }

    renderAllMarkers();
  }, [layers, incidents, hotspots, shelters, dispatchUnits, reports, livePin, region]);

  // Global window handler for popup action dispatch
  useEffect(() => {
    (window as any).__dispatchCase = (incId: string) => {
      setIncidents((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((r) => {
          const list = updated[r];
          if (list) {
            updated[r] = list.map((inc) =>
              inc.id === incId ? { ...inc, dispatched: true } : inc
            );
          }
        });
        return updated;
      });
    };
    return () => {
      delete (window as any).__dispatchCase;
    };
  }, []);

  // Submit Geotagged Distress Report
  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!livePin) {
      setReportFeedback({
        msg: "Please click on the map or tap 'Use my live location' to drop a GPS pin.",
        success: false,
      });
      return;
    }

    setIsSubmittingReport(true);

    setTimeout(() => {
      const newReport: CitizenReport = {
        id: "rep-" + Date.now(),
        lat: livePin.lat,
        lng: livePin.lng,
        address: livePin.address || `${livePin.lat.toFixed(4)}, ${livePin.lng.toFixed(4)}`,
        type: reportType,
        confidence: 0.94,
        timeAgo: "Just now",
      };

      setReports((prev) => [newReport, ...prev]);

      // If high urgency, automatically spawn an incident on the map
      const newIncident: SignalIncident = {
        id: "inc-gen-" + Date.now(),
        refId: "NHAA-" + Math.random().toString(36).substring(2, 6).toUpperCase() + "-SOS",
        title: livePin.address?.split(",")[0] || "Geotagged Emergency Distress",
        lat: livePin.lat,
        lng: livePin.lng,
        svi: 82,
        riskTier: "CRITICAL",
        category: "Immediate Danger",
        signals: ["Real-time Citizen SOS", reportNote || "Panic button activated", "GPS verified location"],
        nearestShelter: "Sakhi OSCC Emergency Team",
        eta: "5 mins",
        dispatched: true,
        timestamp: "Just now",
      };

      setIncidents((prev) => ({
        ...prev,
        [region]: [newIncident, ...(prev[region] || [])],
      }));

      setIsSubmittingReport(false);
      setReportFeedback({
        msg: `SOS Signal successfully triangulated! Reference ID: ${newIncident.refId}. Dispatch squad notified.`,
        success: true,
      });

      setReportNote("");
    }, 800);
  };

  const currentIncidents =
    region === "national"
      ? Object.values(incidents).flat()
      : incidents[region] || [];

  const currentHotspots =
    region === "national"
      ? Object.values(hotspots).flat()
      : hotspots[region] || [];

  return (
    <div className="min-h-screen bg-[#07090e] text-[#f1f5f9] font-sans antialiased selection:bg-amber-500 selection:text-black">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0c1017]/90 backdrop-blur-md px-4 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2.5 text-white font-extrabold tracking-tight text-lg hover:opacity-90 transition-opacity"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 text-black font-black text-sm shadow-md shadow-amber-500/20">
              TR
            </span>
            <span className="font-display tracking-wider text-base uppercase">
              TRACE <span className="text-xs font-mono font-normal text-amber-400/90 ml-1">v2.4</span>
            </span>
          </Link>
          <span className="hidden sm:inline-block h-4 w-[1px] bg-white/20" />
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
            CAD 1091 & 14566 LIVE
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/support"
            className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            Victim Support Portal
          </Link>
          <Link
            to="/staff/queue"
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-lg bg-amber-500 text-black hover:bg-amber-400 transition-colors shadow-sm"
          >
            <Activity className="w-3.5 h-3.5" />
            Staff Triage Queue
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section Matching Project-Shwaas Layout */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-7">
          <div>
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-slate-400 mb-2">
              <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              LIVE SIGNAL RADAR · <span className="text-white font-bold">{REGIONS[region]?.label.toUpperCase()}</span>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-white leading-none">
              Every signal, on one <em className="italic font-serif text-amber-400">map.</em>
            </h1>
          </div>

          {/* SVI Risk Legend Chips */}
          <div className="flex flex-wrap items-center gap-3 font-mono text-[10.5px] tracking-wider text-slate-300">
            <span className="inline-flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-md border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              ROUTINE (0-25)
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-md border border-white/10">
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
              ELEVATED (26-50)
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-md border border-white/10">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              HIGH (51-75)
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-md border border-white/10">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              CRITICAL (76-100)
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-md border border-white/10">
              <span className="w-2 h-2 rounded-full bg-fuchsia-500" />
              HOTSPOT
            </span>
          </div>
        </div>

        {/* Toolbar: Layer Filters + City Select + Report CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 mb-4">
          {/* Layer Filter Toggles */}
          <div className="flex flex-wrap items-center gap-1.5" id="layerToggles">
            <button
              type="button"
              onClick={() => setLayers((prev) => ({ ...prev, incidents: !prev.incidents }))}
              className={`font-mono text-[10.5px] uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-all ${
                layers.incidents
                  ? "bg-amber-500 text-black border-amber-400 font-bold shadow-sm"
                  : "bg-white/5 text-slate-400 border-white/10 hover:text-white"
              }`}
            >
              INCIDENTS ({currentIncidents.length})
            </button>

            <button
              type="button"
              onClick={() => setLayers((prev) => ({ ...prev, hotspots: !prev.hotspots }))}
              className={`font-mono text-[10.5px] uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-all ${
                layers.hotspots
                  ? "bg-fuchsia-500 text-black border-fuchsia-400 font-bold shadow-sm"
                  : "bg-white/5 text-slate-400 border-white/10 hover:text-white"
              }`}
            >
              HOTSPOTS ({currentHotspots.length})
            </button>

            <button
              type="button"
              onClick={() => setLayers((prev) => ({ ...prev, shelters: !prev.shelters }))}
              className={`font-mono text-[10.5px] uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-all ${
                layers.shelters
                  ? "bg-emerald-500 text-black border-emerald-400 font-bold shadow-sm"
                  : "bg-white/5 text-slate-400 border-white/10 hover:text-white"
              }`}
            >
              SHELTERS (OSCC)
            </button>

            <button
              type="button"
              onClick={() => setLayers((prev) => ({ ...prev, dispatch: !prev.dispatch }))}
              className={`font-mono text-[10.5px] uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-all ${
                layers.dispatch
                  ? "bg-blue-500 text-white border-blue-400 font-bold shadow-sm"
                  : "bg-white/5 text-slate-400 border-white/10 hover:text-white"
              }`}
            >
              CAD UNITS
            </button>

            <button
              type="button"
              onClick={() => setLayers((prev) => ({ ...prev, reports: !prev.reports }))}
              className={`font-mono text-[10.5px] uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-all ${
                layers.reports
                  ? "bg-violet-500 text-white border-violet-400 font-bold shadow-sm"
                  : "bg-white/5 text-slate-400 border-white/10 hover:text-white"
              }`}
            >
              SOS REPORTS ({reports.length})
            </button>
          </div>

          {/* Region Selector + Report Button */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              aria-label="Select command region"
              className="font-mono text-[11px] tracking-wider px-3 py-1.5 rounded-lg border border-white/15 bg-slate-900/80 text-white focus:outline-none focus:border-amber-400 cursor-pointer backdrop-blur-md"
            >
              {Object.entries(REGIONS).map(([k, v]) => (
                <option key={k} value={k} className="bg-slate-900 text-white">
                  {v.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setIsReportOpen(!isReportOpen)}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-amber-600 text-white hover:opacity-95 transition-all shadow-md shadow-red-900/30 cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {isReportOpen ? "Close Distress Panel" : "+ Report Distress / SOS"}
            </button>
          </div>
        </div>

        {/* Map Viewport Card */}
        <div className="relative rounded-2xl bg-slate-950/80 border border-white/10 p-3.5 shadow-2xl overflow-hidden">
          {/* Leaflet Map Canvas */}
          <div
            ref={mapContainerRef}
            id="leafletMap"
            className="w-full h-[540px] sm:h-[600px] rounded-xl overflow-hidden relative bg-[#0b0f14]"
            style={{ zIndex: 10 }}
          />

          {/* CAD Sync Badge (Top Right of Map) */}
          <div className="absolute top-6 right-6 z-20 pointer-events-none inline-flex items-center gap-2 font-mono text-[10px] tracking-widest text-slate-200 bg-slate-950/85 backdrop-blur-md border border-white/15 rounded-lg px-3 py-1.5 shadow-lg">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span>
              ⚡ CAD & NHAA 14566 LIVE · {currentIncidents.length} SIGNALS MONITORED · {currentTimeStr}
            </span>
          </div>

          {/* Map Footer Note */}
          <div className="font-mono text-[10px] uppercase tracking-widest text-slate-400 text-center mt-3 opacity-80">
            RADAR FEED ACTIVE · {currentIncidents.length} ACTIVE INCIDENTS · {currentHotspots.length} TRAUMA HOTSPOTS · CLICK MAP TO DROP GEOTAG PIN
          </div>
        </div>

        {/* Citizen & Victim SOS Report Panel (Slide-down) */}
        {isReportOpen && (
          <section className="mt-5 rounded-2xl border border-amber-500/30 bg-slate-950/90 backdrop-blur-xl p-6 shadow-2xl transition-all">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-amber-400">
                  CRISIS GEOLOCATION & TRIAGE INTAKE
                </div>
                <h2 className="font-serif text-2xl font-normal text-white mt-1">
                  Report distress or request immediate dispatch
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsReportOpen(false)}
                className="text-slate-400 hover:text-white text-2xl leading-none p-1"
              >
                ×
              </button>
            </div>

            <p className="text-sm text-slate-300 mb-6 font-light">
              Submit real-time location details for high-stakes trauma incidents. Our automated SVI pipeline will evaluate keywords, acoustic threat signals, and dispatch the nearest One-Stop Center or CAD mobile unit.
            </p>

            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[10.5px] uppercase tracking-wider text-slate-400 mb-1.5">
                    Incident Type / Distress Category
                  </label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value as any)}
                    className="w-full font-sans text-sm bg-slate-900 border border-white/15 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Distress Call">Distress Call / Psychological Crisis</option>
                    <option value="Acoustic Panic">Immediate Physical Threat / Barricaded</option>
                    <option value="Domestic Disturbance">Intimate Partner Coercion / Stalking</option>
                    <option value="SOS Beacon">Silent Emergency SOS Beacon</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[10.5px] uppercase tracking-wider text-slate-400 mb-1.5">
                    Location / GPS Fix
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      placeholder="Click on the map or tap GPS button"
                      value={livePin?.address || (livePin ? `${livePin.lat.toFixed(4)}, ${livePin.lng.toFixed(4)}` : "")}
                      className="flex-1 font-mono text-xs bg-slate-900 border border-white/15 rounded-lg p-2.5 text-amber-300 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={useLiveLocation}
                      className="inline-flex items-center gap-1.5 font-mono text-xs px-3 py-2 rounded-lg bg-sky-500/10 border border-sky-400/30 text-sky-300 hover:bg-sky-500/20 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <Crosshair className="w-3.5 h-3.5" />
                      📍 Use my live location
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10.5px] uppercase tracking-wider text-slate-400 mb-1.5">
                  Distress Note / Threat Details (Optional)
                </label>
                <textarea
                  rows={2}
                  value={reportNote}
                  onChange={(e) => setReportNote(e.target.value)}
                  placeholder="Describe situational urgency (e.g. caller trapped in rear room, aggressor threatening violence, medical assistance needed)"
                  className="w-full font-sans text-sm bg-slate-900 border border-white/15 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-400 placeholder:text-slate-500"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isSubmittingReport}
                    className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider font-bold px-5 py-2.5 rounded-lg bg-gradient-to-r from-red-600 to-amber-600 text-white hover:opacity-90 transition-all shadow-lg shadow-red-900/30 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingReport ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Triangulating & Scoring SVI…
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Submit Distress Signal →
                      </>
                    )}
                  </button>

                  <span className="font-mono text-[10px] tracking-wider text-slate-400">
                    {locatingStatus || "CLICK MAP TO PINPOINT EXACT CO-ORDINATES"}
                  </span>
                </div>

                {reportFeedback && (
                  <div
                    className={`font-mono text-xs px-3 py-1.5 rounded-lg border ${
                      reportFeedback.success
                        ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                        : "bg-red-500/10 text-red-300 border-red-500/30"
                    }`}
                  >
                    {reportFeedback.msg}
                  </div>
                )}
              </div>
            </form>
          </section>
        )}

        {/* Live Ranked Distress & Hotspot Feed (Matching Project-Shwaas Layout) */}
        <section className="mt-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-amber-400">
                LIVE TRAUMA INCIDENTS & HOTSPOTS
              </div>
              <h2 className="font-serif text-3xl font-normal text-white">
                Ranked signals requiring <em className="italic font-serif text-amber-400">immediate triage</em>.
              </h2>
            </div>
            <div className="font-mono text-[11px] text-slate-400">
              Sorted by SVI severity & SLA deadline
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/80 overflow-hidden divide-y divide-white/10 shadow-xl">
            {currentIncidents.length === 0 ? (
              <div className="p-8 text-center font-mono text-xs text-slate-400">
                NO ACTIVE INCIDENTS IN THIS REGION · SUBMIT A TEST DISTRESS REPORT TO SEE LIVE SIGNALS APPEAR
              </div>
            ) : (
              currentIncidents.map((inc) => {
                const color =
                  inc.riskTier === "CRITICAL"
                    ? "bg-red-500 text-white"
                    : inc.riskTier === "HIGH"
                    ? "bg-orange-500 text-white"
                    : inc.riskTier === "ELEVATED"
                    ? "bg-yellow-500 text-black"
                    : "bg-emerald-500 text-black";

                return (
                  <div
                    key={inc.id}
                    className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div
                        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl font-mono font-bold text-sm shadow-md ${color}`}
                      >
                        {inc.svi}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-bold text-amber-400">
                            {inc.refId}
                          </span>
                          <span className="text-white font-medium text-sm">
                            {inc.title}
                          </span>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                              inc.riskTier === "CRITICAL"
                                ? "bg-red-500/10 text-red-400 border-red-500/30 animate-pulse"
                                : "bg-white/5 text-slate-300 border-white/10"
                            }`}
                          >
                            {inc.riskTier}
                          </span>
                        </div>

                        <div className="font-mono text-[11px] text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span>{inc.category}</span>
                          <span>•</span>
                          <span>Nearest: {inc.nearestShelter}</span>
                          <span>•</span>
                          <span className="text-sky-400">ETA ~${inc.eta}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Triggers */}
                    <div className="flex items-center gap-2.5 self-end md:self-auto flex-shrink-0">
                      <a
                        href={`/staff/case/${inc.refId}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Examine Case
                      </a>

                      <button
                        type="button"
                        onClick={() => (window as any).__dispatchCase?.(inc.id)}
                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all ${
                          inc.dispatched
                            ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                            : "bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-900/30 cursor-pointer"
                        }`}
                      >
                        {inc.dispatched ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            CAD Dispatched
                          </>
                        ) : (
                          <>
                            <Truck className="w-3.5 h-3.5" />
                            Dispatch Squad
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
