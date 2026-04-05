import React, { useEffect, useState } from "react";
import "./Map.css";
import { supabase } from "@/supabaseClient";
import { useNavigate } from "react-router-dom";
import {
  PieChartOutlined,
  CloseOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { Button, Select, Input } from "antd";



/* ---------------- Windy Global ---------------- */
declare global {
  interface Window {
    windyInit?: (
      options: Record<string, any>,
      callback: (windyAPI: { map: any }) => void
    ) => void;
    L?: any;
  }
}

/* ---------------- Station ---------------- */
interface Station {
  No?: number;
  MARKER_NAM?: string;
  PROVINCE?: string;
  PROVINCE_TH?: string;
  REGION?: string;
  LATITUDE?: number | string;
  LONGITUDE?: number | string;
}

/* ---------------- WindyMap ---------------- */
type WindyMapProps = {
  stations: Station[];
  navigate: (path: string) => void;
  osmPos: [number, number] | null;
  focusPos?: {
    center: [number, number];
    zoom: number;
  } | null;
};

function WindyMap({ stations, navigate, osmPos, focusPos }: WindyMapProps) {
  const mapRef = React.useRef<any>(null);
  const markersRef = React.useRef<any[]>([]);
  const labelRefs = React.useRef<any[]>([]);
  const initRef = React.useRef(false);
  const osmMarkerRef = React.useRef<any>(null);

  /* ---------- ICON ---------- */
  const dbIcon = React.useMemo(() => {
    const L = window.L;
    if (!L) return null;

    return L.icon({
      iconUrl: "https://cdn-icons-png.flaticon.com/512/12363/12363577.png",
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });
  }, []);

  /* ---------- INIT WINDY ---------- */
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const loadScript = (src: string) =>
      new Promise<void>((resolve) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }
        const s = document.createElement("script");
        s.src = src;
        s.onload = () => resolve();
        document.body.appendChild(s);
      });

    const init = async () => {
      await loadScript("https://unpkg.com/leaflet@1.4.0/dist/leaflet.js");
      await loadScript("https://api.windy.com/assets/map-forecast/libBoot.js");

      window.windyInit!(
        {
          key: "l1Ar79t4Fsa9q9yP2FshLN3iK4ktvuE5",
          lat: 13.75,
          lon: 100.5,
          zoom: 6,
        },
        (windyAPI: any) => {
          const map = windyAPI.map;
          mapRef.current = map;

          const L = window.L;
          if (!L) return;

          /* 🔥 สร้าง pane สำหรับ label */
          if (!map.getPane("labelPane")) {
            const pane = map.createPane("labelPane");
            pane.style.zIndex = "650";
          }
        }
      );
    };

    init();
  }, []);

  /* ---------- MARKERS + LABEL ---------- */
  useEffect(() => {
    if (!mapRef.current || !window.L) return;
    const L = window.L;

    markersRef.current.forEach((m) => m.remove());
    labelRefs.current.forEach((l) => l.remove());
    markersRef.current = [];
    labelRefs.current = [];

    stations.forEach((s) => {
      if (!s.LATITUDE || !s.LONGITUDE) return;

      const lat = Number(s.LATITUDE);
      const lon = Number(s.LONGITUDE);

      /* marker */
      const marker = L.marker([lat, lon], dbIcon ? { icon: dbIcon } : undefined)
        .addTo(mapRef.current)
        .bindPopup(`
          <b>ชื่อสถานี:</b> ${s.MARKER_NAM}<br/>
          <b>จังหวัด:</b> ${s.PROVINCE_TH}<br/>
          <b>Region:</b> ${s.REGION}<br/>
          <button id="btn-${s.MARKER_NAM}"
            style="background:#007bff;color:white;padding:4px 8px;border:none;border-radius:6px;margin-top:4px;">
            View
          </button>
        `);

      marker.on("popupopen", () => {
        const btn = document.getElementById(`btn-${s.MARKER_NAM}`);
        if (btn) btn.onclick = () => navigate(`/station/${s.MARKER_NAM}`);
      });

      markersRef.current.push(marker);

      /* 🔥 label ลอย */
      const label = L.marker([lat, lon], {
        pane: "labelPane",
        interactive: false,
        icon: L.divIcon({
          className: "windy-label",
          html: `${s.MARKER_NAM} (${s.PROVINCE_TH})`,

          iconSize: [140, 24],
          iconAnchor: [70, 36],
        }),
      }).addTo(mapRef.current);

      labelRefs.current.push(label);
    });
  }, [stations, navigate]);

  /* ---------- FOCUS ---------- */
  useEffect(() => {
    if (!mapRef.current || !focusPos) return;
    mapRef.current.flyTo(focusPos.center, focusPos.zoom, {
      animate: true,
      duration: 1.2,
    });
  }, [focusPos]);

  return (
    
    <div
      id="windy"
      style={{ position: "absolute", inset: 0, zIndex: 1 }}
    />
  );
}

/* ================== MAIN MAP ================== */
function Map() {
  const [stations, setStations] = useState<Station[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from("G").select("*").then(({ data }) => {
      setStations(data as Station[]);
    });
  }, []);

  return (
    <div style={{ height: "100vh", width: "100%", position: "relative" }}>
{/* Top Map Overlay */}
<div className="map-top-overlay">
  <div className="windy-like-brand">
    <span>GNSS Dashboard</span>
  </div>
</div>
      <WindyMap
        stations={stations}
        navigate={navigate}
        osmPos={null}
        focusPos={null}
      />
    </div>
  );
}

export default Map;
