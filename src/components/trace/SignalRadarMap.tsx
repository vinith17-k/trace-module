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
  Navigation,
} from "lucide-react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";

export interface SignalIncident {
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

export interface HotspotCluster {
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

export interface ShelterResource {
  id: string;
  name: string;
  type: "One-Stop Crisis Center (OSCC)" | "Women Safe House" | "Emergency Medical Care" | "Trauma Recovery Hub";
  lat: number;
  lng: number;
  capacity: string;
  availableBeds: number;
  helpline: string;
}

export interface DispatchUnit {
  id: string;
  code: string;
  type: "CAD Police Unit" | "Mobile Medical Squad" | "Crisis Response Team";
  lat: number;
  lng: number;
  status: "AVAILABLE" | "EN_ROUTE" | "ON_SCENE";
  assignedCase?: string;
}

const REGIONS: Record<
  string,
  { label: string; name: string; center: [number, number]; zoom: number }
> = {
  delhi: {
    label: "Delhi NCR",
    name: "DELHI NATIONAL CAPITAL REGION",
    center: [28.6289, 77.2185],
    zoom: 13,
  },
  mumbai: {
    label: "Mumbai Metro",
    name: "MUMBAI METROPOLITAN REGION",
    center: [19.129, 72.8258],
    zoom: 13,
  },
  bengaluru: {
    label: "Bengaluru Urban",
    name: "BENGALURU URBAN REGION",
    center: [12.9784, 77.6408],
    zoom: 13,
  },
  kolkata: {
    label: "Kolkata Hub",
    name: "KOLKATA METROPOLITAN AREA",
    center: [22.5804, 88.4378],
    zoom: 13,
  },
  hyderabad: {
    label: "Hyderabad Metro",
    name: "HYDERABAD CYBERABAD ZONE",
    center: [17.44, 78.3489],
    zoom: 13,
  },
};

const INITIAL_INCIDENTS: Record<string, SignalIncident[]> = {
  delhi: [
    {
      id: "inc-1",
      refId: "NHAA-4F82-K91",
      title: "Connaught Place South Block (Active Case)",
      lat: 28.6289,
      lng: 77.2185,
      svi: 88,
      riskTier: "CRITICAL",
      category: "Immediate Danger",
      signals: ["Weapons mentioned", "Direct threat to life", "Voice pitch shift + high arousal"],
      nearestShelter: "Sakhi OSCC Lady Hardinge",
      eta: "4 mins",
      dispatched: true,
      timestamp: "Active Call",
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
      signals: ["Barricaded room", "Audible shouting"],
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
      signals: ["Digital stalking", "Financial extortion"],
      nearestShelter: "Noida District Shelter Home",
      eta: "11 mins",
      dispatched: false,
      timestamp: "12 mins ago",
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
      signals: ["Emergency door lock", "Physical aggression"],
      nearestShelter: "Cooper Hospital OSCC Wing",
      eta: "6 mins",
      dispatched: true,
      timestamp: "3 mins ago",
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
      signals: ["Physical assault in progress"],
      nearestShelter: "Bowring OSCC Shelter",
      eta: "5 mins",
      dispatched: true,
      timestamp: "1 min ago",
    },
  ],
  kolkata: [],
  hyderabad: [],
};

const INITIAL_SHELTERS: Record<string, ShelterResource[]> = {
  delhi: [
    {
      id: "sh-1",
      name: "Sakhi OSCC — Lady Hardinge Medical Center",
      type: "One-Stop Crisis Center (OSCC)",
      lat: 28.634,
      lng: 77.214,
      capacity: "24/7 Medical, Legal, Shelter",
      availableBeds: 12,
      helpline: "011-23340000",
    },
    {
      id: "sh-2",
      name: "Delhi Govt Safe Haven",
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
      capacity: "Full Acute Trauma Unit",
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
  bengaluru: [],
  kolkata: [],
  hyderabad: [],
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
  ],
  mumbai: [
    {
      id: "dsp-m1",
      code: "NIRBHAYA-VAN-02",
      type: "Crisis Response Team",
      lat: 19.12,
      lng: 72.83,
      status: "EN_ROUTE",
    },
  ],
  bengaluru: [],
  kolkata: [],
  hyderabad: [],
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
      recommendedAction: "Pre-position Mobile CAD Units",
      dispatchedUnits: 3,
    },
  ],
  mumbai: [],
  bengaluru: [],
  kolkata: [],
  hyderabad: [],
};

interface SignalRadarMapProps {
  activeCaseId?: string;
  isEmbedded?: boolean;
}

export function SignalRadarMap({ activeCaseId = "NHAA-4F82-K91" }: SignalRadarMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<LeafletMap | null>(null);
  const layerGroupsRef = useRef<{
    incidents?: LayerGroup;
    hotspots?: LayerGroup;
    shelters?: LayerGroup;
    dispatch?: LayerGroup;
    pin?: LayerGroup;
  }>({});

  const [region, setRegion] = useState<string>("delhi");
  const [layers, setLayers] = useState({
    incidents: true,
    hotspots: true,
    shelters: true,
    dispatch: true,
  });

  const [incidents, setIncidents] = useState<Record<string, SignalIncident[]>>(INITIAL_INCIDENTS);
  const [hotspots] = useState<Record<string, HotspotCluster[]>>(INITIAL_HOTSPOTS);
  const [shelters] = useState<Record<string, ShelterResource[]>>(INITIAL_SHELTERS);
  const [dispatchUnits, setDispatchUnits] = useState<Record<string, DispatchUnit[]>>(INITIAL_DISPATCH);

  const [livePin, setLivePin] = useState<{ lat: number; lng: number; accuracy?: number; address?: string } | null>({
    lat: 28.6289,
    lng: 77.2185,
    address: "Connaught Place South Block, New Delhi",
  });
  const [locatingStatus, setLocatingStatus] = useState<string | null>(null);
  const [isDispatched, setIsDispatched] = useState(true);

  // Initialize Leaflet Map
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

      // Watermark-free Dark Canvas: Esri World Dark Gray (No API key required) or Authenticated Carto
      const cartoKey = (import.meta as any).env?.VITE_CARTO_API_KEY;
      if (cartoKey) {
        L.tileLayer(`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?api_key=${cartoKey}`, {
          subdomains: "abcd",
          maxZoom: 19,
        }).addTo(map);
      } else {
        // Zero-configuration, clean dark basemap with NO watermark and NO API key required
        L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
          {
            maxZoom: 16,
          }
        ).addTo(map);

        L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
          {
            maxZoom: 16,
            pane: "overlayPane",
          }
        ).addTo(map);
      }

      // Initialize layer groups
      layerGroupsRef.current = {
        incidents: L.layerGroup().addTo(map),
        hotspots: L.layerGroup().addTo(map),
        shelters: L.layerGroup().addTo(map),
        dispatch: L.layerGroup().addTo(map),
        pin: L.layerGroup().addTo(map),
      };

      // Click to place a pin on the map
      map.on("click", async (e) => {
        const { lat, lng } = e.latlng;
        setLivePin({ lat, lng });
        reverseGeocode(lat, lng);
      });

      // Center on active case
      map.setView([28.6289, 77.2185], 14);

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
      duration: 1.0,
      easeLinearity: 0.25,
    });
  }, [region]);

  // Reverse Geocoding
  const reverseGeocode = async (lat: number, lng: number) => {
    setLocatingStatus("Looking up address…");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { "User-Agent": "TRACE-Staff-Portal/1.0" } }
      );
      if (!res.ok) throw new Error("Lookup error");
      const data = await res.json();
      const addr = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      setLivePin((prev) => (prev ? { ...prev, address: addr } : { lat, lng, address: addr }));
      setLocatingStatus("Pin calibrated: " + addr.slice(0, 36) + (addr.length > 36 ? "…" : ""));
    } catch {
      const fallback = `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
      setLivePin((prev) => (prev ? { ...prev, address: fallback } : { lat, lng, address: fallback }));
      setLocatingStatus("Pin calibrated: " + fallback);
    }
  };

  // Browser Geolocation API ("📍 Use my live location")
  const useLiveLocation = () => {
    if (!("geolocation" in navigator)) {
      setLocatingStatus("Geolocation not supported on this device");
      return;
    }
    setLocatingStatus("Acquiring GPS fix…");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setLivePin({ lat: latitude, lng: longitude, accuracy });
        if (leafletMapRef.current) {
          leafletMapRef.current.flyTo([latitude, longitude], 15, { duration: 1.0 });
        }
        reverseGeocode(latitude, longitude);
      },
      (err) => {
        setLocatingStatus(
          err.code === 1
            ? "Location permission denied"
            : "GPS timeout — click map manually"
        );
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  // Render markers
  useEffect(() => {
    async function renderMarkers() {
      if (!leafletMapRef.current) return;
      const L = await import("leaflet");
      const lg = layerGroupsRef.current;
      if (!lg.incidents || !lg.hotspots || !lg.shelters || !lg.dispatch || !lg.pin) return;

      // 1. Active Case & Incidents
      lg.incidents.clearLayers();
      if (layers.incidents) {
        const currentIncs = incidents[region] || [];

        currentIncs.forEach((inc) => {
          const isCaseSelected = inc.refId === activeCaseId;
          const color =
            inc.riskTier === "CRITICAL"
              ? "var(--a-critical, #e0584f)"
              : inc.riskTier === "HIGH"
              ? "var(--a-high, #e08b3d)"
              : "var(--a-low, #3bb273)";

          const customIcon = L.divIcon({
            className: "trace-incident-icon",
            iconSize: [42, 42],
            iconAnchor: [21, 21],
            html: `
              <div style="position:relative;width:42px;height:42px;display:flex;align-items:center;justify-content:center;cursor:pointer;">
                ${
                  isCaseSelected
                    ? `<div style="position:absolute;top:50%;left:50%;width:40px;height:40px;border-radius:50%;border:2.5px solid #38bdf8;animation:ringPulse 2.2s cubic-bezier(0.2,0.8,0.2,1) infinite;"></div>`
                    : ""
                }
                <div style="width:30px;height:30px;border-radius:50%;background:${color};border:${isCaseSelected ? "3px solid #38bdf8" : "2px solid #141a23"};display:flex;align-items:center;justify-content:center;box-shadow:0 0 14px ${color}99;font-family:'JetBrains Mono',monospace;font-weight:800;font-size:11px;color:#ffffff;line-height:1;">
                  ${inc.svi}
                </div>
              </div>
            `,
          });

          const popupHtml = `
            <div style="min-width:240px;font-family:var(--sans,'Inter',sans-serif);color:#f8fafc;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:5px;">
                <span style="font-family:'JetBrains Mono',monospace;font-size:11.5px;font-weight:700;color:#e0a23d;">${inc.refId}</span>
                <span style="font-size:10px;font-weight:800;background:rgba(224,88,79,0.2);color:#e0584f;border:1px solid rgba(224,88,79,0.4);padding:2px 6px;border-radius:4px;">${inc.riskTier}</span>
              </div>
              <div style="font-size:13.5px;font-weight:700;color:#ffffff;margin-bottom:3px;">${inc.title}</div>
              <div style="font-size:11px;color:#8b96a8;margin-bottom:8px;">${inc.category} · ${inc.timestamp}</div>
              <div style="font-size:11px;color:#38bdf8;margin-bottom:4px;">Nearest: <strong>${inc.nearestShelter}</strong> (ETA ~${inc.eta})</div>
            </div>
          `;

          const marker = L.marker([inc.lat, inc.lng], { icon: customIcon })
            .bindPopup(popupHtml)
            .addTo(lg.incidents!);

          if (isCaseSelected) {
            setTimeout(() => {
              try { marker.openPopup(); } catch {}
            }, 600);
          }
        });
      }

      // 2. Shelters
      lg.shelters.clearLayers();
      if (layers.shelters) {
        const currentShelters = shelters[region] || [];
        currentShelters.forEach((sh) => {
          const shelterIcon = L.divIcon({
            className: "trace-shelter-icon",
            iconSize: [28, 28],
            iconAnchor: [14, 14],
            html: `
              <div style="width:26px;height:26px;border-radius:7px;background:#3bb273;border:2px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 0 10px rgba(59,178,115,0.7);font-size:12px;">
                🏠
              </div>
            `,
          });

          L.marker([sh.lat, sh.lng], { icon: shelterIcon })
            .bindPopup(`
              <div style="min-width:220px;font-family:var(--sans,'Inter',sans-serif);color:#fff;">
                <div style="font-size:10px;font-weight:800;color:#3bb273;">ONE-STOP CRISIS CENTER (OSCC)</div>
                <div style="font-size:13px;font-weight:700;margin:2px 0;">${sh.name}</div>
                <div style="font-size:11px;color:#8b96a8;margin-bottom:4px;">${sh.capacity} · <b>${sh.availableBeds} beds available</b></div>
                <div style="font-size:11px;color:#e0a23d;font-weight:700;">Direct: ${sh.helpline}</div>
              </div>
            `)
            .addTo(lg.shelters!);
        });
      }

      // 3. Dispatch Units
      lg.dispatch.clearLayers();
      if (layers.dispatch) {
        const currentDispatch = dispatchUnits[region] || [];
        currentDispatch.forEach((d) => {
          const dispatchIcon = L.divIcon({
            className: "trace-dispatch-icon",
            iconSize: [28, 28],
            iconAnchor: [14, 14],
            html: `
              <div style="width:26px;height:26px;border-radius:50%;background:#3d82f6;border:2px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 0 12px rgba(61,130,246,0.8);font-size:12px;">
                🚓
              </div>
            `,
          });

          L.marker([d.lat, d.lng], { icon: dispatchIcon })
            .bindPopup(`
              <div style="min-width:200px;font-family:var(--sans,'Inter',sans-serif);color:#fff;">
                <div style="font-size:10px;font-weight:800;color:#3d82f6;">CAD MOBILE POLICE UNIT</div>
                <div style="font-size:13px;font-weight:700;margin:2px 0;">${d.code}</div>
                <div style="font-size:11px;color:#8b96a8;">Status: <b style="color:#e0a23d;">${d.status}</b></div>
                ${d.assignedCase ? `<div style="font-size:11px;color:#cbd5e1;margin-top:4px;">Assigned to: <b>${d.assignedCase}</b></div>` : ""}
              </div>
            `)
            .addTo(lg.dispatch!);
        });
      }

      // 4. Hotspots
      lg.hotspots.clearLayers();
      if (layers.hotspots) {
        const currentHotspots = hotspots[region] || [];
        currentHotspots.forEach((hs) => {
          const hotspotIcon = L.divIcon({
            className: "trace-hotspot-icon",
            iconSize: [36, 36],
            iconAnchor: [18, 18],
            html: `
              <div style="position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center;">
                <div style="position:absolute;top:50%;left:50%;width:34px;height:34px;border-radius:50%;border:2px solid #e08b3d;animation:ringPulse 2.2s infinite;"></div>
                <div style="width:20px;height:20px;border-radius:50%;background:#e08b3d;border:2px solid #141a23;display:flex;align-items:center;justify-content:center;font-size:10px;">
                  ⚠️
                </div>
              </div>
            `,
          });

          L.marker([hs.lat, hs.lng], { icon: hotspotIcon })
            .bindPopup(`
              <div style="min-width:220px;font-family:var(--sans,'Inter',sans-serif);color:#fff;">
                <div style="font-size:10px;font-weight:800;color:#e08b3d;">TRAUMA RISK HOTSPOT</div>
                <div style="font-size:13px;font-weight:700;margin:2px 0;">${hs.name}</div>
                <div style="font-size:11px;color:#8b96a8;">${hs.incidentCount} incidents clustered · ${hs.dominantSignal}</div>
              </div>
            `)
            .addTo(lg.hotspots!);
        });
      }

      // 5. GPS Pin
      lg.pin.clearLayers();
      if (livePin) {
        const pinIcon = L.divIcon({
          className: "trace-pin-icon",
          iconSize: [28, 28],
          iconAnchor: [14, 28],
          html: `<div style="font-size:22px;filter:drop-shadow(0 2px 5px rgba(0,0,0,0.8));">📍</div>`,
        });

        L.marker([livePin.lat, livePin.lng], { icon: pinIcon })
          .bindPopup(`<div style="font-family:var(--sans);font-size:12px;color:#fff;"><strong>GPS Lock:</strong><br>${livePin.address || `${livePin.lat.toFixed(4)}, ${livePin.lng.toFixed(4)}`}</div>`)
          .addTo(lg.pin);
      }
    }

    renderMarkers();
  }, [layers, incidents, shelters, dispatchUnits, hotspots, livePin, region, activeCaseId]);

  const activeInc = (incidents[region] || []).find((i) => i.refId === activeCaseId) || (incidents["delhi"]?.[0]);

  return (
    <div>
      {/* Top Header of the Section matching Staff Theme */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14, marginBottom: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: 7 }}>
              <Navigation style={{ width: 17, height: 17, color: "var(--a-accent, #3d82f6)" }} />
              Geographic Signal Radar &amp; Proximity Triage
            </h3>
            <span
              style={{
                fontSize: 10.5,
                fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                fontWeight: 700,
                padding: "2px 7px",
                borderRadius: 4,
                background: "rgba(59, 178, 115, 0.15)",
                color: "var(--a-low, #3bb273)",
                border: "1px solid rgba(59, 178, 115, 0.3)",
              }}
            >
              CAD 1091 / NHAA 14566 LIVE
            </span>
          </div>
          <p style={{ fontSize: 12.5, color: "var(--a-muted, #8b96a8)", margin: 0 }}>
            Triangulating active case incident coordinates, nearby One-Stop Crisis Centers (OSCC), and emergency response units.
          </p>
        </div>

        {/* Region & Layer Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            aria-label="Select command region"
            className="search-box"
            style={{ fontSize: 11.5, padding: "5px 10px", height: "auto", minHeight: 32 }}
          >
            {Object.entries(REGIONS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            className={`chip ${layers.incidents ? "on" : ""}`}
            onClick={() => setLayers((prev) => ({ ...prev, incidents: !prev.incidents }))}
            style={{ fontSize: 11, padding: "4px 8px" }}
          >
            Incidents
          </button>
          <button
            type="button"
            className={`chip ${layers.shelters ? "on" : ""}`}
            onClick={() => setLayers((prev) => ({ ...prev, shelters: !prev.shelters }))}
            style={{ fontSize: 11, padding: "4px 8px" }}
          >
            Shelters (OSCC)
          </button>
          <button
            type="button"
            className={`chip ${layers.dispatch ? "on" : ""}`}
            onClick={() => setLayers((prev) => ({ ...prev, dispatch: !prev.dispatch }))}
            style={{ fontSize: 11, padding: "4px 8px" }}
          >
            CAD Units
          </button>
          <button
            type="button"
            className={`chip ${layers.hotspots ? "on" : ""}`}
            onClick={() => setLayers((prev) => ({ ...prev, hotspots: !prev.hotspots }))}
            style={{ fontSize: 11, padding: "4px 8px" }}
          >
            Hotspots
          </button>
        </div>
      </div>

      {/* Main Map Box */}
      <div
        style={{
          position: "relative",
          height: 380,
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid var(--a-border, #2c3645)",
          background: "#0b0f14",
          marginBottom: 16,
        }}
      >
        <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />

        {/* Live Location Calibration Pill */}
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: 12,
            zIndex: 800,
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(20, 26, 35, 0.88)",
            border: "1px solid var(--a-border, #2c3645)",
            backdropFilter: "blur(12px)",
            borderRadius: 8,
            padding: "6px 12px",
            fontSize: 11.5,
            color: "var(--a-text, #e8ecf2)",
          }}
        >
          <button
            type="button"
            onClick={useLiveLocation}
            style={{
              background: "none",
              border: "none",
              color: "var(--a-accent, #3d82f6)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontWeight: 700,
              fontSize: 11.5,
              padding: 0,
            }}
          >
            <Crosshair style={{ width: 14, height: 14 }} />
            Calibrate GPS
          </button>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>|</span>
          <span style={{ fontSize: 11, color: "var(--a-muted, #8b96a8)", fontFamily: "var(--font-mono, monospace)" }}>
            {locatingStatus || livePin?.address || `${livePin?.lat.toFixed(4)}, ${livePin?.lng.toFixed(4)}`}
          </span>
        </div>
      </div>

      {/* Proximity & Incident Details Sub-Grid matching Staff Theme */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 12,
        }}
      >
        {/* Sub-Panel 1: Incident Location */}
        <div
          style={{
            background: "var(--a-panel2, #222b38)",
            border: "1px solid var(--a-border, #2c3645)",
            borderRadius: 10,
            padding: "12px 14px",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--a-muted, #8b96a8)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
            📍 Triangulated Location
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>
            {activeInc?.title || "Connaught Place South Block"}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--a-muted, #8b96a8)", fontFamily: "var(--font-mono, monospace)" }}>
            {livePin?.lat.toFixed(4)}°N, {livePin?.lng.toFixed(4)}°E (±8m accuracy)
          </div>
        </div>

        {/* Sub-Panel 2: Nearest Shelter Resource */}
        <div
          style={{
            background: "var(--a-panel2, #222b38)",
            border: "1px solid var(--a-border, #2c3645)",
            borderRadius: 10,
            padding: "12px 14px",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--a-low, #3bb273)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}>
            🏠 Nearest OSCC Shelter (4 mins away)
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>
            Sakhi One-Stop Center — Lady Hardinge
          </div>
          <div style={{ fontSize: 11.5, color: "var(--a-muted, #8b96a8)" }}>
            12 beds ready · 24/7 Medical &amp; Legal Support
          </div>
        </div>

        {/* Sub-Panel 3: Assigned CAD Unit */}
        <div
          style={{
            background: "var(--a-panel2, #222b38)",
            border: "1px solid var(--a-border, #2c3645)",
            borderRadius: 10,
            padding: "12px 14px",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--a-accent, #3d82f6)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}>
            🚓 Emergency Response CAD Squad
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>
            CAD-SQUAD-1091-ALPHA
          </div>
          <div style={{ fontSize: 11.5, color: "var(--a-muted, #8b96a8)" }}>
            Status: <b style={{ color: isDispatched ? "var(--a-low, #3bb273)" : "var(--a-high, #e08b3d)" }}>{isDispatched ? "En Route (ETA 4m)" : "Standby"}</b>
          </div>
        </div>
      </div>
    </div>
  );
}
