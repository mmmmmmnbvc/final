  import React, { useEffect, useState } from "react";
  import { supabase } from "@/supabaseClient";
  import { useNavigate } from "react-router-dom";
  import {
    PieChartOutlined,
    CloseOutlined,
    MenuUnfoldOutlined,
  } from "@ant-design/icons";
  import { Button, Select, Input } from "antd";
// import "./Map.css";
import markerIcon from "../assets/marker.png";
import markerIconNT from "../assets/markerNT.png";
import markerIconNT01 from "../assets/markerNT01.png";
import markerIconNE02 from "../assets/markerNE02.png";
import markerIconNE01 from "../assets/markerNE01.png";
import markerIconEE01 from "../assets/markerEE01.png";
import markerIconSS01 from "../assets/markerSS01.png";
import logo from "../assets/HIILogo_TH_EN-360x1271.png";
  const { Option } = Select;

  // Windy API
declare global {
  interface Window {
    windyInit?: (
      options: Record<string, any>,
      callback: (windyAPI: { map: any }) => void
    ) => void;
    L?: any;
    google?: any;
    _gmap?: any;
    _searchMarker?: any;
  }
}


  // station
  interface Station {
    No?: number;
    MARKER_NAM?: string;
    PROVINCE?: string;
    PROVINCE_TH?: string;
    REGION?: string;
    LATITUDE?: number | string;
    LONGITUDE?: number | string;
  }

  // Component
  type WindyMapProps = {
  stations: Station[];
  navigate: (path: string) => void;

  focusPos?: {
    center: [number, number];
    zoom: number;
  } | null;
};


function WindyMap({ stations, navigate, focusPos}: WindyMapProps) {
  const mapRef = React.useRef<any>(null);
  const markersRef = React.useRef<any[]>([]);
  const initRef = React.useRef(false);

const pulseRefs = React.useRef<any[]>([]);
const googleMarkersRef = React.useRef<any[]>([]);
  



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
  // ✅ Leaflet 1.4.x (จำเป็นมาก)
  await loadScript("https://unpkg.com/leaflet@1.4.0/dist/leaflet.js");

  // (ไม่บังคับ แต่ควรมี)
  if (!document.querySelector('link[href*="leaflet.css"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.4.0/dist/leaflet.css";
    document.head.appendChild(link);
  }

  // ✅ Windy
  await loadScript("https://api.windy.com/assets/map-forecast/libBoot.js");

  if (typeof window.windyInit !== "function") return;

window.windyInit(
  {
    key: "l1Ar79t4Fsa9q9yP2FshLN3iK4ktvuE5",
    lat: 13.75,
    lon: 100.5,
    zoom: 6,
  },
  (windyAPI: any) => {
    const { map } = windyAPI;
    mapRef.current = map;

    map.options.maxZoom = 20;
    map.options.minZoom = 3;

    // ✅ แก้ปัญหา map ขนาดผิด
    setTimeout(() => {
      map.invalidateSize();
    }, 400);

    const L = window.L;
    if (!L) return;
  }
);
};


    init();
    
  }, []);

  /* ---------- MARKERS UPDATE ---------- */
  useEffect(() => {
    if (!mapRef.current) return;

const L = window.L;
if (!L) return;


    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    stations.forEach((s) => {
const lat = Number(s.LATITUDE);
const lng = Number(s.LONGITUDE);

if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
  console.warn("Invalid station:", s);
  return;
}
      const L = window.L;
if (!L) return;
const region = s.REGION?.trim().toUpperCase();

const iconUrl =
  region === "NT02"
    ? markerIconNT
    : region === "NT01"
    ? markerIconNT01
    : region === "NE02"
    ? markerIconNE02
    : region === "NE01"
    ? markerIconNE01
    : region === "EE01"
    ? markerIconEE01
    : region === "SS01"
    ? markerIconSS01
    : markerIcon;
const icon = L.icon({
   iconUrl: iconUrl, 
  // iconRetinaUrl: "https://cdn-icons-png.flaticon.com/512/12363/12363577.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
  shadowSize: [41, 41],
});
const marker = L.marker([lat, lng], { icon })


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

// ----- Google marker -----
if (window._gmap && window.google) {
const region = s.REGION?.trim().toUpperCase();

const gIconUrl =
  region === "NT02"
    ? markerIconNT
    : region === "NT01"
    ? markerIconNT01
    : region === "NE02"
    ? markerIconNE02
    : region === "NE01"
    ? markerIconNE01
    : region === "EE01"
    ? markerIconEE01
    : region === "SS01"
    ? markerIconSS01
    : markerIcon;
const gMarker = new window.google.maps.Marker({
  position: { lat, lng },
  map: window._gmap,
  title: s.MARKER_NAM,
  icon: {
     url: gIconUrl,
    scaledSize: new window.google.maps.Size(32, 32),
    anchor: new window.google.maps.Point(16, 32), 
  },
});
// กระพริบในgoogle
const pulseCircle = new window.google.maps.Circle({
  strokeColor: "#de2500",
  strokeOpacity: 0.8,
  strokeWeight: 2,
  fillColor: "#de2500",
  fillOpacity: 0.35,
  map: window._gmap,
  center: { lat, lng },
  radius: 50,
  clickable: false,
});

// 🔥 Animation
let growing = true;
let radius = 50;
if (radius >= 200) growing = false;
const interval = setInterval(() => {
  if (!pulseCircle.getMap()) {
    clearInterval(interval);
    return;
  }

  if (growing) {
    radius += 5;
    if (radius >= 200) growing = false;
  } else {
    radius -= 5;
    if (radius <= 50) growing = true;
  }

  pulseCircle.setRadius(radius);
}, 30);

googleMarkersRef.current.push(gMarker);
googleMarkersRef.current.push(pulseCircle);

  const infoWindow = new window.google.maps.InfoWindow({
    content: `
      <div style="color:black; font-weight:bold;">
        <b>ชื่อสถานี:</b> ${s.MARKER_NAM}<br/>
        <b>จังหวัด:</b> ${s.PROVINCE_TH ?? "-"}<br/>
        <b>Region:</b> ${s.REGION ?? "-"}<br/>
        <button id="gbtn-${s.MARKER_NAM}"
        style="background:#007bff;color:white;padding:4px 8px;border:none;border-radius:6px;margin-top:4px;">
          View
        </button>
      </div>
    `,
  });

  gMarker.addListener("click", () => {
    infoWindow.open({
      anchor: gMarker,
      map: window._gmap,
    });

    setTimeout(() => {
      const btn = document.getElementById(`gbtn-${s.MARKER_NAM}`);
      if (btn) {
        btn.onclick = () => navigate(`/station/${s.MARKER_NAM}`);
      }
    }, 0);
  });
}
    });
  }, [stations, navigate, focusPos]);




// search
useEffect(() => {
  if (!focusPos) return;
  if (!mapRef.current) return;

  const center = focusPos.center;

  if (!Array.isArray(center) || center.length !== 2) return;

  const lat = Number(center[0]);
  const lng = Number(center[1]);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    console.warn("Invalid focusPos:", focusPos);
    return;
  }

  const map = mapRef.current;

  // ป้องกัน map ยังไม่ ready
  if (!map.getCenter) return;

  map.flyTo([lat, lng], focusPos.zoom ?? 10, {
    animate: true,
    duration: 1.2,
  });

  if (window._gmap) {
    window._gmap.setCenter({ lat, lng });
    window._gmap.setZoom(focusPos.zoom ?? 10);
  }
}, [focusPos]);
/* ---------- PULSE NEARBY DB STATIONS ---------- */
useEffect(() => {
  if (!mapRef.current || !window.L || stations.length === 0) return;
  const L = window.L;

  // ลบ pulse เดิม
  pulseRefs.current.forEach((c) => c.remove());
  pulseRefs.current = [];

  // แสดง pulse เฉพาะสถานีที่ส่งเข้ามา (ใกล้ที่สุด)
stations.forEach((s) => {
  const lat = parseFloat(String(s.LATITUDE));
  const lng = parseFloat(String(s.LONGITUDE));

  if (isNaN(lat) || isNaN(lng)) return;

  const circle = L.circleMarker(
    [lat, lng],
      {
        radius: 8,
        color: "#de2500",
        weight: 30,
        fillColor: "#de2500",
        fillOpacity: 1,
        className: "pulse-circle",
      }
    ).addTo(mapRef.current);

    pulseRefs.current.push(circle);
  });




}, [ stations]);

return (
  <>
    <div
      id="windy"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        visibility: "hidden",
pointerEvents: "none"

      }}
    />


  </>
);
  
}


function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(a));
}
const initGoogleMap = () => {
  if (!window.google || !window.google.maps) return;

  const googleDiv = document.getElementById("google-map");
  if (!googleDiv) return;

  if (window._gmap) return; // ป้องกันสร้างซ้ำ

  const gmap = new window.google.maps.Map(googleDiv, {
    center: { lat: 13.75, lng: 100.5 },
    zoom: 6,
    mapTypeId: "roadmap",
 //disableDefaultUI: false,      // เปิด UI Map Satellite
  // zoomControl: true,
  mapTypeControlOptions: {
  position: window.google.maps.ControlPosition.BOTTOM_LEFT,
},
  // streetViewControl: true,
  // fullscreenControl: true,
  });



  window._gmap = gmap;
};

  function Map() {
    const [stations, setStations] = useState<Station[]>([]);
    const [selectedRegion, setSelectedRegion] = useState<string>("");
    const [selectedStation, setSelectedStation] = useState<string>("");
    const [searchText, setSearchText] = useState<string>("");
    const [collapsed, setCollapsed] = useState<boolean>(true);
    const googleMapRef = React.useRef<any>(null);
    const [googlePos, setGooglePos] = useState<[number, number] | null>(null);
    const navigate = useNavigate();
    const [showMapDetail, setShowMapDetail] = useState(false);
const [activeLayer, setActiveLayer] = useState(null);
const [focusPos, setFocusPos] = useState<{
  center: [number, number];
  zoom: number;
} | null>(null);

    const toggleCollapsed = () => setCollapsed((c) => !c);

    //  ดึงข้อมูลจาก Supabase
    useEffect(() => {
      const fetchStations = async () => {
        const { data, error } = await supabase.from("G").select("*");
        if (error) console.error(" Error fetching GIS:", error.message);
        else setStations(data as Station[]);
      };
      fetchStations();
    }, []);

useEffect(() => {
  if (document.getElementById("google-script")) return;

  const script = document.createElement("script");
  script.id = "google-script";
  script.src =
    "https://maps.googleapis.com/maps/api/js?key=AIzaSyD16A5ynQsidha-fglUQruvUKu7MLWjxco&libraries=places";
  script.async = true;

  script.onload = () => {
     initGoogleMap();
    const input = document.querySelector(
      ".ant-input"
    ) as HTMLInputElement;

    if (!input || !window.google) return;

    const autocomplete = new window.google.maps.places.Autocomplete(input);

  autocomplete.addListener("place_changed", () => {
  const place = autocomplete.getPlace();
  if (!place.geometry) return;

  const lat = place.geometry.location.lat();
  const lng = place.geometry.location.lng();

  setFocusPos({
    center: [lat, lng],
    zoom: 15,
  });

  setGooglePos([lat, lng]);

  if (window._gmap) {
    window._gmap.setCenter({ lat, lng });
    window._gmap.setZoom(15);

    // ✅ ลบ marker เก่าก่อน (ถ้ามี)
    if (window._searchMarker) {
      window._searchMarker.setMap(null);
    }

    // ✅ สร้าง marker ใหม่ที่ตำแหน่งค้นหา
    window._searchMarker = new window.google.maps.Marker({
      position: { lat, lng },
      map: window._gmap,
      icon: {
        // url: "https://cdn-icons-png.flaticon.com/512/12363/12363577.png",
        scaledSize: new window.google.maps.Size(36, 36),
      },
    });
  }
});
  };

  document.body.appendChild(script);
}, []);

    const uniqueRegions = [...new Set(stations.map((s) => s.REGION))];
    const stationsByRegion = selectedRegion
      ? stations.filter((s) => s.REGION === selectedRegion)
      : stations;
    const filteredStations = selectedStation
      ? stationsByRegion.filter((s) => s.MARKER_NAM === selectedStation)
      : stationsByRegion;

    const searchedStations = searchText
      ? filteredStations.filter((s) => {
          const text = searchText.toLowerCase();
          return (
            s.MARKER_NAM?.toLowerCase().includes(text) ||
            s.PROVINCE?.toLowerCase().includes(text) ||
            s.REGION?.toLowerCase().includes(text) ||
            s.PROVINCE_TH?.toLowerCase().includes(text)
          );
        })
      : filteredStations;


      //ค้นหาสถานที่DBใกล้เคียง
    const nearbyStations = React.useMemo(() => {
  if (!googlePos) return searchedStations;

  const [lat, lon] = googlePos;

  const withDistance = stations
    .filter((s) => {
  const lat = Number(s.LATITUDE);
  const lng = Number(s.LONGITUDE);
  return Number.isFinite(lat) && Number.isFinite(lng);
})
.map((s) => {
  const lat2 = Number(s.LATITUDE);
  const lng2 = Number(s.LONGITUDE);

  return {
    ...s,
    LATITUDE: lat2,
    LONGITUDE: lng2,
    dist: distanceKm(lat, lon, lat2, lng2),
  };
})
    .sort((a, b) => a.dist - b.dist);

  if (withDistance.length === 0) return [];

  const minDist = withDistance[0].dist;

  // ใกล้สุด + เผื่อใกล้มาก
  //ไม่าเกิน 0.5 km
  // return withDistance.filter((s) => s.dist <= minDist + 0.5);
  
  return withDistance.slice(0, 1);
}, [googlePos, stations, searchedStations]);


    const regionConfig: Record<
      string,
      { label: string; center: [number, number]; zoom: number }
    > = {
      CT01: { label: "ภาคกลาง", center: [14.5, 100.5], zoom: 7 },
      EE01: { label: "ภาคตะวันออก", center: [13.0, 101.5], zoom: 7 },
      NE01: { label: "ภาคอีสานล่าง", center: [15.0, 103.0], zoom: 7 },
      NE02: { label: "ภาคอีสานบน", center: [17.0, 102.5], zoom: 7 },
      NT01: { label: "ภาคเหนือตอนล่าง", center: [16.5, 100.5], zoom: 7 },
      NT02: { label: "ภาคเหนือตอนบน", center: [18.5, 99.0], zoom: 7 },
      SS01: { label: "ภาคใต้", center: [8.5, 99.5], zoom: 7 },
    };

    const SIDEBAR_WIDTH = 320;


    const overlayStyle = {
      position: "absolute" as const,
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0, 0, 0, 0.45)",
      backdropFilter: "blur(3px)",
      opacity: collapsed ? 0 : 1,
      pointerEvents: collapsed ? "none" : "auto",
      transition: "opacity 0.3s ease",
      zIndex: 1000,
    };

    //  Sidebar
    const sidebarStyle = {
      position: "absolute" as const,
      top: 0,
      right: 0,
transform: collapsed 
  ? `translateX(${SIDEBAR_WIDTH + 20}px)` 
  : "translateX(0)",
transition: "transform 0.4s ease, box-shadow 0.4s ease",
      height: "100%",
      width: `${SIDEBAR_WIDTH}px`,
      background: "linear-gradient(180deg, #0B1220 0%, #0A0F1C 100%)",
      zIndex: 1100,
      overflowY: "auto" as const,
      padding: "20px",
      boxShadow: collapsed ? "none" : "0 0 20px rgba(0,0,0,0.5)",
 
    };
    //gobal
// const searchOSM = async (q: string) => {
//   if (!q) {
//     setOsmResults([]);
//     return;
//   }
//   const res = await fetch(
//     `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
//       q
//     )}&limit=5`
//   );
//   setOsmResults(await res.json());
  
  
// };


    return (
      <div style={{ height: "100vh", width: "100%", position: "relative", overflow: "hidden" }}>
        {/* 🔵 Top Map Overlay */}
      <div className="map-top-overlay">
        <div className="windy-like-brand">
<div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
  <div className="px-8 py-3 rounded-2xl   text-slate-800  font-bold  tracking-tight">
  {/* bg-white/80 backdrop-blur-lg border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] */}
    {/* <span className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-300 to-cyan-500 filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]"> */}
      {/* from-blue-700 to-cyan-600 */}
      {/* <span className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-yellow-100 via-yellow-400 to-amber-600 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"></span>
      <span className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-300 to-slate-400 filter drop-shadow-[0_2px_8px_rgba(0,0,0,1)]"></span> */}
      {/* สถาบันสารสนเทศทรัพยากรน้ำ (องค์การมหาชน)
    </span> */}
    <img
      src={logo}
      alt="logo"
      className="h-40 object-contain drop-shado w-[0_2px_6px_rgba(0,0,0,0.8)]"
    />
  </div>
</div> 
        </div>
      </div>
        {/* Search Box */}
        <div
          style={{
            position: "absolute",
            top: "16px",
            left: "20px",
            zIndex: 1001,
          }}
        >
          <div className="search-wrapper">
            <Input
              placeholder="Search location"
              allowClear
              value={searchText}
              onChange={(e) => {
  const v = e.target.value;
  setSearchText(v);

  const text = v.toLowerCase();

  // 🔎 ค้นหาใน DB ก่อน
  const st = stations.find(
    (s) =>
      s.MARKER_NAM?.toLowerCase().includes(text) ||
      s.PROVINCE?.toLowerCase().includes(text) ||
      s.PROVINCE_TH?.toLowerCase().includes(text)
  );

  if (st) {
    const lat = Number(st.LATITUDE);
    const lng = Number(st.LONGITUDE);

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      setFocusPos({
        center: [lat, lng],
        zoom: 14,
      });

      setGooglePos([lat, lng]);

      if (window._gmap) {
        window._gmap.setCenter({ lat, lng });
        window._gmap.setZoom(14);
      }
    }
  }
}}
              prefix={<span style={{ color: "rgba(0,0,0,.45)" }}>🔍</span>}
              style={{
                borderRadius: "9999px",
                width: "100%",
                transition: "all 0.3s ease",
              }}
            />
            

          </div>
        </div>

        <style>
          {`
            .search-wrapper {
              width: 180px;
              transition: width 0.3s ease;
            }
            .search-wrapper:hover,
            .search-wrapper:focus-within {
              width: 350px;
            }
            .ant-input-affix-wrapper {
              border-radius: 9999px !important;
            }
              .pulse-circle {
    animation: pulse 1.8s ease-out infinite;
  }

  @keyframes pulse {
    0% {
      r: 8;
      opacity: 0.8;
    }
    70% {
      r: 30;
      opacity: 0;
    }
    100% {
      opacity: 0;
    }
  }
          `}
        </style>

        {/*  Windy Map */}
<WindyMap
   stations={googlePos ? nearbyStations : searchedStations}
   navigate={navigate}
   focusPos={focusPos}
/>

<div
  id="google-map"
  style={{
    position: "absolute",
    inset: 0,
    zIndex: 1,
    display: "block",   // ✅ เปิด google ก่อน
    width: "100%",
    height: "100%",
    visibility: "visible"
  }}
/>
<div
  style={{
    position: "absolute",
    bottom: "10px",
    left: "278px",   // 🔥 ล่างซ้ายเหมือน Satellite
    zIndex: 2000,
  }}
>
  <button
    style={{
      padding: "8px 15px",
      border: "none",
      background: "#1E3A8A",
      color: "white",
      cursor: "pointer",
      boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
    }}
    onClick={() => {
      const windy = document.getElementById("windy");
      const google = document.getElementById("google-map");

      if (!windy || !google) return;

      if (google.style.visibility === "hidden") {
        google.style.visibility = "visible";
        google.style.pointerEvents = "auto";

        windy.style.visibility = "hidden";
        windy.style.pointerEvents = "none";
      } else {
        google.style.visibility = "hidden";
        google.style.pointerEvents = "none";

        windy.style.visibility = "visible";
        windy.style.pointerEvents = "auto";

        setTimeout(() => {
          // @ts-ignore
          window._windyMap?.invalidateSize?.();
        }, 300);
      }
    }}
  >
    Switch Map
  </button>
</div>
        

        {/*  Sidebar */}
        <div style={sidebarStyle}>
          <h2
            style={{
              color: "#4B7BFF",
              marginBottom: "16px",
              fontWeight: "bold",
              borderBottom: "1px solid rgba(255,255,255,0.15)",
              paddingBottom: "8px",
            }}
          >
            เมนูควบคุม
          </h2>

          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.05)",
              borderRadius: "16px",
              padding: "16px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  backgroundColor: "#4B7BFF",
                  borderRadius: "12px",
                  padding: "10px",
                }}
              >
                <PieChartOutlined style={{ color: "white", fontSize: "22px" }} />
              </div>
              <h3 style={{ color: "white", margin: 0, fontSize: "18px" }}>
                Georinex
              </h3>
            </div>

            <Select
              placeholder="-- เลือกโครงข่าย (Region) --"
              style={{ width: "100%", marginBottom: "10px" }}
              value={selectedRegion || undefined}
onChange={(value) => {
  setSelectedRegion(value);
  setSelectedStation("");
setGooglePos(null);
  if (value && regionConfig[value]) {
    setFocusPos({
      center: regionConfig[value].center,
      zoom: regionConfig[value].zoom,
    });
  }
}}

              getPopupContainer={(trigger) => trigger.parentNode as HTMLElement}
            >
              <Option key="ALL" value="">
                แสดงทั้งหมด
              </Option>
              {uniqueRegions.map((r) => (
                <Option key={r} value={r}>
                  {r} {regionConfig[r]?.label ? `(${regionConfig[r].label})` : ""}
                </Option>
              ))}
            </Select>

            {selectedRegion && (
              <Select
                placeholder="-- เลือกสถานี --"
                style={{ width: "100%" }}
                value={selectedStation || undefined}
                onChange={(value) => {
  setSelectedStation(value);

  const st = stations.find((s) => s.MARKER_NAM === value);
  const lat = Number(st?.LATITUDE);
const lng = Number(st?.LONGITUDE);

if (Number.isFinite(lat) && Number.isFinite(lng)) {
  setFocusPos({
    center: [lat, lng],
    zoom: 14,
  });
}
}}

                getPopupContainer={(trigger) => trigger.parentNode as HTMLElement}
              >
                <Option key="ALL_ST" value="">
                  แสดงทั้งหมด
                </Option>
                {stationsByRegion.map((s) => (
                  <Option key={s.No} value={s.MARKER_NAM}>
                    {s.MARKER_NAM} ({s.PROVINCE})
                  </Option>
                ))}
              </Select>
            )}
          </div>
        </div>

        {/*  Toggle Button */}
        <Button
          shape="circle"
          icon={collapsed ? <MenuUnfoldOutlined /> : <CloseOutlined />}
          onClick={toggleCollapsed}
          style={{
            position: "absolute",
            top: "100px",
            right: collapsed ? "20px" : `${SIDEBAR_WIDTH + 20}px`,
            backgroundColor: "#1E3A8A",
            border: "none",
            width: "55px",
            height: "55px",
            color: "white",
            fontSize: "20px",
            zIndex: 1201,
            borderRadius: "50%",
            boxShadow: "0 6px 14px rgba(0,0,0,0.35)",
            transition: "right 0.4s ease",
          }}
        />
      </div>
    );
  }

  export default Map;
