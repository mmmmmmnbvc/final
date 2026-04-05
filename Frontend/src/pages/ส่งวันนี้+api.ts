import { useParams } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/supabaseClient";
import Papa from "papaparse";
import Plotly from "plotly.js-dist-min";
import { ResizableWindow } from "@/components/ResizableWindow";
import { DashboardToolbar } from "@/components/DashboardToolbar";
import { ChevronUp, ChevronDown, Download, Sun, Moon } from "lucide-react";
import { Color } from "antd/es/color-picker";

// Types
interface CsvRow {
  time: string;
  sv: string;

  C1C?: number | string;
  L1C?: number | string;
  S1C?: number | string;

  C1X?: number | string;
  L1X?: number | string;
  S1X?: number | string;

  C2W?: number | string;
  S2W?: number | string;

  C5X?: number | string;
  S5X?: number | string;

  [key: string]: number | string | null | undefined;
}

interface SvMetrics {
  tsec: number[];
  C1: (number | null)[];
  S1: (number | null)[];
  P2: (number | null)[];
  S2: (number | null)[];
  C2: (number | null)[];
  C5: (number | null)[];
  S5: (number | null)[];
  L1: (number | null)[];
  doppler: (number | null)[];
  residual: (number | null)[];
  lock: number[];
}

interface GroupedData {
  [group: string]: {
    [SV: string]: SvMetrics;
  };
}

interface StationData {
  MARKER_NAM: string;
  REGION: string;
  LATITUDE: number;
  LONGITUDE: number;
  ELL_Height: number;
  PROVINCE_TH?: string;
  [key: string]: unknown;
}

interface PanelVisibility {
  skyplot: boolean;
  info: boolean;
  snr: boolean;
  america: boolean;
  russia: boolean;
  europe: boolean;
  dataerror: boolean
  table: boolean;
}

// Helper functions
const toNum = (v: string | number | null): number | null => {
  const n = parseFloat(v as string);
  return isNaN(n) ? null : n;
};
const pick = (row: CsvRow, keys: string[]): number | null => {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null && v !== "") {
      const n = parseFloat(v as string);
      if (!isNaN(n)) return n;
    }
  }
  return null;
};
const rollingMedian = (arr: (number | null)[], window: number): (number | null)[] => {
  const out: (number | null)[] = Array(arr.length).fill(null);
  const w = Math.max(1, window | 0);
  for (let i = 0; i < arr.length; i++) {
    const start = Math.max(0, i - Math.floor(w / 2));
    const end = Math.min(arr.length, start + w);
    const slice = arr.slice(start, end).filter((x): x is number => x !== null);
    if (slice.length > 0) {
      const sorted = slice.slice().sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      out[i] = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }
  }
  return out;
};

const computeMetrics = (data: CsvRow[]): GroupedData => {
  const groups: GroupedData = {};
  let t0: number | null = null;

  data.forEach((r) => {
    if (t0 === null) {
      const dt = Date.parse(r.time);
      if (!isNaN(dt)) t0 = dt / 1000;
    }
  });

  if (t0 === null) t0 = 0;

  data.forEach((r, idx) => {
    const SV = (r.sv || "").toString().trim();
    if (!SV) return;

    const grp = SV.charAt(0);

    let tsec: number;
    const dt = Date.parse(r.time);
    if (!isNaN(dt)) tsec = dt / 1000 - t0!;
    else tsec = idx;

    if (!groups[grp]) groups[grp] = {};

    if (!groups[grp][SV]) {
      groups[grp][SV] = {
        tsec: [],
        C1: [],
        S1: [],
        P2: [],
        S2: [],
        C2: [],
        C5: [],
        S5: [],
        L1: [],
        doppler: [],
        residual: [],
        lock: [],
      };
    }

    const s = groups[grp][SV];

    // เลือก signal หลัก
    const C1 = pick(r, ["C1C", "C1X"]);
    const L1 = pick(r, ["L1C", "L1X"]);
    const S1 = pick(r, ["S1C", "S1X"]);

    const C2 = pick(r, ["C2W", "C2X"]);
    const S2 = pick(r, ["S2W", "S2X"]);

    const C5 = pick(r, ["C5X"]);
    const S5 = pick(r, ["S5X"]);

    s.tsec.push(tsec);
    s.C1.push(C1);
    s.S1.push(S1);
    s.P2.push(C2);
    s.S2.push(S2);
    s.C2.push(C2);
    s.C5.push(C5);
    s.S5.push(S5);
    s.L1.push(L1);
  });

  // Doppler
  for (const grp in groups) {
    for (const SV in groups[grp]) {
      const s = groups[grp][SV];

      s.doppler = Array(s.C1.length).fill(null);

      for (let i = 1; i < s.C1.length; i++) {
        const c1a = s.C1[i - 1];
        const c1b = s.C1[i];
        const ta = s.tsec[i - 1];
        const tb = s.tsec[i];

        if (c1a !== null && c1b !== null && tb > ta)
          s.doppler[i] = -(c1b - c1a) / (tb - ta);
      }

      // residual
      s.residual = Array(s.C1.length).fill(null);
      const med = rollingMedian(s.C1, 5);

      for (let i = 0; i < s.C1.length; i++) {
        if (s.C1[i] !== null && med[i] !== null)
          s.residual[i] = s.C1[i]! - med[i]!;
      }

      // lock time
      s.lock = Array(s.tsec.length).fill(0);

      let start: number | null = null;

      for (let i = 0; i < s.tsec.length; i++) {
        const valid = s.C1[i] !== null || s.L1[i] !== null;

        if (valid) {
          if (start === null) start = s.tsec[i];
          s.lock[i] = s.tsec[i] - start;
        } else {
          start = null;
        }
      }
    }
  }

  return groups;
};

// Default window positions (grid layout)
const DEFAULT_POSITIONS = {
  skyplot: { x: 0, y: 0 },
  info: { x: 530, y: 0 },
  snr: { x: 1720, y: 0 },
  america: { x: 0, y: 520 },
  russia: { x: 530, y: 520 },
  europe: { x: 1060, y: 520 },
  dataerror: { x: 1590, y: 520 },
  table: { x: 1060, y: 0 },
};

const DEFAULT_SIZES = {
  skyplot: { width: 520, height: 510 },
  info: { width: 520, height: 510 },  
  snr: { width: 540, height: 510 },
  america: { width: 520, height: 430 },
  russia: { width: 520, height: 430 },
  europe: { width: 520, height: 430 },
  dataerror: { width: 520, height: 430 },
  table: { width: 650, height: 510 },
};

export default function Station() {
  const { stationCode } = useParams<{ stationCode: string }>();
  const [activeMetric, setActiveMetric] = useState<string | null>(null);
  const [selectedConstellation, setSelectedConstellation] = useState<"G" | "R" | "E">("G");
  const [skyConstellation, setSkyConstellation] =
  useState<"ALL" | "G" | "R" | "E">("ALL");
  const [station, setStation] = useState<StationData | null>(null);
  const [uploadedData, setUploadedData] = useState<{ raw: CsvRow[] | null; groups: GroupedData | null }>({ raw: null, groups: null });
  const [fileSuffix, setFileSuffix] = useState<string>("a");
  const [selectedTime, setSelectedTime] = useState<string>("01:00");
  const [selectedDay, setSelectedDay] = useState<string>("204");
  const [availableDays, setAvailableDays] = useState<string[]>([]);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme-mode');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const toggleTheme = useCallback(() => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem('theme-mode', newMode ? 'dark' : 'light');
      return newMode;
    });
  }, []);

  const [visiblePanels, setVisiblePanels] = useState<PanelVisibility>({
    skyplot: true,
    info: true,
    snr: true,
    america: true,
    russia: true,
    europe: true,
    dataerror: true,
    table: true,
  });

  const closePanel = (id: string) => {
    setVisiblePanels(prev => ({ ...prev, [id]: false }));
  };

  const togglePanel = (id: keyof PanelVisibility) => {
    setVisiblePanels(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const resetAllPanels = () => {
    setVisiblePanels({
      skyplot: true,
      info: true,
      snr: true,
      america: true,
      russia: true,
      europe: true,
      dataerror: true,
      table: true,
    });
  };

  // Time options
  const timeOptions = Array.from({ length: 26 }, (_, i) => {
    const hour = 6 + i;
    const suffix = String.fromCharCode("a".charCodeAt(0) + i);
    const displayHour = hour > 23 ? hour - 24 : hour;
    const label = `${displayHour.toString().padStart(2, "0")}:00`;
    return { label, suffix };
  });

  const handleTimeChange = useCallback((timeValue: string) => {
    const [h] = timeValue.split(":").map(Number);
    let hourIndex = (h + 24 - 6) % 24;
    if (hourIndex >= timeOptions.length) hourIndex = 0;
    const suffix = timeOptions[hourIndex]?.suffix || "a";
    setFileSuffix(suffix);
    setSelectedTime(timeValue);
  }, [timeOptions]);

  const changeTime = (newHour: number, newMinute: number) => {
    const newT = `${newHour.toString().padStart(2, "0")}:${newMinute.toString().padStart(2, "0")}`;
    handleTimeChange(newT);
  };

  // AutoPlay effect - continuously cycle through times
  useEffect(() => {
  const timer = setInterval(() => {
    setSelectedTime(prev => {
      const [h, m] = prev.split(":").map(Number);
      
      // เลือกโหมดการไหล:
      // แบบ A: ไหลทีละ 15 นาที (เห็นความต่อเนื่องดีกว่า 1 นาที)
      let newMinute = m + 15; 
      let newHour = h;

      if (newMinute >= 60) {
        newMinute = 0;
        newHour = (newHour + 1) % 24;
      }

      const newT = `${newHour.toString().padStart(2, "0")}:${newMinute.toString().padStart(2, "0")}`;
      
      // ค้นหา suffix ใหม่เพื่อโหลดไฟล์ CSV ของชั่วโมงนั้นๆ
      const hourIndex = (newHour + 24 - 6) % 24;
      const suffix = timeOptions[hourIndex]?.suffix || "a";
      
      // อัปเดต state เพื่อ Trigger useEffect สำหรับ Fetch CSV
      setFileSuffix(suffix);
      
      return newT;
    });
  }, 25000); // ไหลทุก 2.5 วินาที

  return () => clearInterval(timer);
}, [timeOptions]);

  // Load station data
  useEffect(() => {
    const fetchStation = async () => {
      const mockData: StationData = {
        MARKER_NAM: stationCode || "DEMO",
        REGION: "NT02",
        LATITUDE: 17.896381,
        LONGITUDE: 98.35830182,
        ELL_Height: 755.0298,
        PROVINCE_TH: "เชียงใหม่",
      };

      try {
        const { data, error } = await supabase
          .from("G")
          .select("*")
          .eq("MARKER_NAM", stationCode || "")
          .single();

        if (error) {
          console.warn("Using mock data:", error.message);
          setStation(mockData);
        } else {
          setStation(data as StationData);
        }
      } catch (e) {
        console.error("Error fetching station:", e);
        setStation(mockData);
      }
    };
    fetchStation();
  }, [stationCode]);



useEffect(() => {
  const loadDays = async () => {
    if (!stationCode) return;

    try {
      const res = await fetch("http://localhost:3001/api/files");
      const files: string[] = await res.json();

      const stationFiles = files.filter(f =>
        f.includes(stationCode)
      );

      const days = [...new Set(
        stationFiles.map(f => f.split("/")[0])
      )];

      setAvailableDays(days);

      if (days.length > 0) {
        setSelectedDay(days[0]);
      }

    } catch (err) {
      console.error("API error:", err);
    }
  };

  loadDays();
}, [stationCode]);

  // Load CSV based on selected time
  useEffect(() => {
    if (!station || !fileSuffix) return;

    const csvPath =
`http://localhost:3001/api/${selectedDay}/${station.MARKER_NAM}${selectedDay}${fileSuffix}.csv`;

    fetch(csvPath)
      .then((res) => {
        if (!res.ok) throw new Error("File not found: " + csvPath);
        return res.text();
      })
      .then((csvText) => {
        Papa.parse<CsvRow>(csvText, {
          header: true,
          dynamicTyping: false,
          skipEmptyLines: true,
          complete: (results) => {
            const data = results.data;
            const groups = computeMetrics(data);
            setUploadedData({ raw: data, groups });

            if (groups) {
              drawPolar(groups, skyConstellation);
              drawMiniBar("plot-G", groups["G"] || {}, "cn0");
              drawMiniBar("plot-R", groups["R"] || {}, "cn0");
              drawMiniBar("plot-E", groups["E"] || {}, "cn0");
              drawSignalStrength(groups);
            }
          },
        });
      })
      .catch((err) => console.warn("CSV load failed:", err.message));
  }, [station, fileSuffix, selectedDay]);

  useEffect(() => {
  if (!uploadedData.groups) return;

  if (visiblePanels.skyplot) {
    drawPolar(uploadedData.groups, skyConstellation);
  }

  if (visiblePanels.america) {
    drawMiniBar("plot-G", uploadedData.groups["G"] || {}, "cn0");
  }

  if (visiblePanels.russia) {
    drawMiniBar("plot-R", uploadedData.groups["R"] || {}, "cn0");
  }

  if (visiblePanels.europe) {
    drawMiniBar("plot-E", uploadedData.groups["E"] || {}, "cn0");
  }

  if (visiblePanels.dataerror) {
  drawMiniBar(
    "plot-dataerror",
    uploadedData.groups?.[selectedConstellation] || {},
    "doppler"
  );
}

  if (visiblePanels.snr) {
    drawSignalStrength(uploadedData.groups);
  }
}, [visiblePanels, uploadedData.groups, skyConstellation]);

  // Draw Polar Plot - NO changes to internal logic, just renders to container
const drawPolar = (
  groups: GroupedData,
  filter: "ALL" | "G" | "R" | "E"
): void => {
  const plotDiv = document.getElementById("polarPlot");
  if (!plotDiv) return;

  let traces: Plotly.Data[] = [];
  let allSatellites: string[] = [];
  const avgSNRValues: { [SV: string]: number } = {};

  for (const grp in groups) {
    if (filter !== "ALL" && grp !== filter) continue;
    for (const SV in groups[grp]) {
      const SVData: SvMetrics = groups[grp][SV];
      const S1_data: number[] = SVData.S1.filter((v): v is number => v !== null);
      if (S1_data.length > 0) {
        const avgSNR: number = S1_data.reduce((a, b) => a + b, 0) / S1_data.length;
        allSatellites.push(SV);
        avgSNRValues[SV] = avgSNR;
      }
    }
  }

  // 🔹 เรียงลำดับดาวเทียมตามชื่อ (G01, G02, R01...) เพื่อให้พล็อตเป็นระเบียบ
  allSatellites.sort().forEach((SV: string, idx: number) => {
    const avgSNR: number = avgSNRValues[SV];
    const color: string = avgSNR >= 40 ? "#2ECC71" : (avgSNR >= 30 ? "#F1C40F" : "#E74C3C");
    
    // 🔹 คำนวณรัศมี (R) ตามความเข้มสัญญาณ (SNR)
    let r_value: number = (60 - avgSNR) / 40; 
    if (r_value < 0.1) r_value = 0.1; 
    if (r_value > 1) r_value = 1;

    // 🔹 คำนวณมุม (Theta) โดยแยกตามประเภทดาวเทียม (G, R, E, C)
    const svType = SV.charAt(0);
    const svNum = parseInt(SV.substring(1));
    let theta_value: number;

    if (svType === 'G') theta_value = (svNum * 11) % 360; // GPS กระจายตัวรอบทิศ
    else if (svType === 'R') theta_value = (svNum * 15 + 180) % 360; // GLONASS อยู่โซนล่าง
    else theta_value = (idx * 137.5) % 360; // ประเภทอื่นใช้ Golden Angle

    traces.push({
      type: "scatterpolar",
      r: [r_value * 10], 
      theta: [theta_value],
      mode: "markers+text",
      text: [SV],
      textposition: "middle center",
      name: SV,
      marker: { size: 12, color: color, line: { color: 'white', width: 1 } }, 
      hovertemplate: `SV: ${SV}<br>Avg SNR: ${avgSNR.toFixed(2)} dB-Hz<extra></extra>`
    } as Plotly.Data);
  });

  // 🔹 ปรับ Layout ให้โปร่งใสตามที่คุณต้องการ
  Plotly.newPlot("polarPlot", traces, {
    polar: {
      radialaxis: { visible: true, range: [0, 10], showticklabels: false, gridcolor: "#444" },
      angularaxis: { direction: "clockwise", rotation: 90, gridcolor: "#444" },
      bgcolor: "rgba(0,0,0,0)",
    },
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    margin: { t: 30, b: 30, l: 30, r: 30 },
    showlegend: false,
    autosize: true,
  }, { responsive: true, displayModeBar: false });
};

  // Draw MiniBar - NO changes to internal logic
  const drawMiniBar = (plotId: string, groupData: { [SV: string]: SvMetrics }, metric: keyof SvMetrics | "cn0" | "psr") => {
    const SVs = Object.keys(groupData).sort();
    const traces: Plotly.Data[] = [];

    const getLast = (arr: (number | null)[]): number => arr.slice().reverse().find((v): v is number => v !== null) ?? 0;

    if (SVs.length === 0) {
      Plotly.react(plotId, traces, {
        margin: { t: 10, b: 40, l: 30, r: 10 },
        showlegend: false,
        yaxis: { title: "", range: [0, 65], showticklabels: false, fixedrange: true },
        autosize: true,
      } as Partial<Plotly.Layout>, { responsive: true, displayModeBar: false });
      return;
    }

    const x = SVs;
    const barColors: Record<string, string> = {
      cn0: "#3b82f6",
      psr: "#06b6d4",
      doppler: "#a855f7",
      residual: "#ef4444",
      lock: "#ec4899",
    };

    let y: number[] = [];
    if (metric === "cn0") {
      y = SVs.map((SV) => getLast(groupData[SV].S1));
    } else if (metric === "psr") {
      y = SVs.map((SV) => getLast(groupData[SV].C1));
    } else if (metric === "doppler") {
      y = SVs.map((SV) => getLast(groupData[SV].doppler));
    } else if (metric === "residual") {
      y = SVs.map((SV) => getLast(groupData[SV].residual));
    } else if (metric === "lock") {
      y = SVs.map((SV) => getLast(groupData[SV].lock));
    }

    traces.push({
      x,
      y,
      name: metric.toString().toUpperCase(),
      type: "bar",
      marker: { color: barColors[metric] || "#3b82f6" }
    });

    Plotly.react(plotId, traces, {
      barmode: "group",
      paper_bgcolor: "rgba(0,0,0,0)",
  plot_bgcolor: "rgba(0,0,0,0)",
      margin: { t: 10, b: 40, l: 30, r: 10 },
      showlegend: false,
      yaxis: { title: "", showticklabels: false, fixedrange: true },
      xaxis: { showgrid: false, tickangle: -45 },
      autosize: true,
    } as Partial<Plotly.Layout>, { responsive: true, displayModeBar: false });
  };

  // Draw Signal Strength - NO changes to internal logic
// สร้างตัวแปรไว้นอกฟังก์ชันเพื่อเก็บสถานะของลำดับ (Persistent State)
let displayQueue: { sv: string; val: number }[] = [];
let incomingBuffer: { sv: string; val: number }[] = [];
let flowInterval: any = null;

const drawSignalStrength = (groups: any) => {
  const containerId = "signalStrengthPlot";
  const container = document.getElementById(containerId);
  if (!container) return;

  // 1. ดึงข้อมูลและจัดลำดับตามที่ปรากฏใน data (Flattening)
  const tempBuffer: { sv: string; val: number }[] = [];
  if (groups) {
    Object.values(groups).forEach((constellation: any) => {
      if (!constellation || typeof constellation !== 'object') return;
      
      // วนลูปตามลำดับ SV ที่เจอ (ซึ่งจะอิงตามการ Parse CSV)
      Object.keys(constellation).forEach((svName) => {
        if (svName === "epochs") return;
        const sData = constellation[svName];
        const val = sData.S1?.[0] || sData.s1?.[0]; // เอาค่าล่าสุด
        if (val !== undefined && val !== null) {
          tempBuffer.push({ sv: svName, val: parseFloat(val) });
        }
      });
    });
  }

  // ป้องกันข้อมูลซ้ำ (เช็คตัวสุดท้ายที่เพิ่งเข้า)
  if (tempBuffer.length > 0) {
    incomingBuffer = tempBuffer;
  }

  // 2. เริ่มระบบ Flow (ถ้ายังไม่เริ่ม)
  if (!flowInterval) {
    // ปรับความเร็วตรงนี้: 200ms = 5 แท่งต่อวินาที (ยิ่งน้อยยิ่งเร็ว)
    flowInterval = setInterval(() => {
      if (incomingBuffer.length > 0) {
        // ดึงข้อมูลตัวแรกสุดจาก Buffer ออกมา (ขยับทีละ 1)
        const nextPoint = incomingBuffer.shift();
        if (nextPoint) {
          displayQueue.push(nextPoint);
        }

        // ควบคุมให้โชว์แค่ 10 แท่งล่าสุด
        if (displayQueue.length > 10) {
          displayQueue.shift(); // ลบตัวเก่าสุดออก (-1)
        }

        renderPlot(containerId, displayQueue);
      }
    }, 3000); // <--- ปรับความเร็วการไหลที่นี่ (มิลลิวินาที)
  }
};

// ฟังก์ชันสำหรับสั่งวาด Plotly แยกออกมา
const renderPlot = (id: string, data: { sv: string; val: number }[]) => {
  const displayLimit = 10;
  
  const trace: Plotly.Data = {
    x: data.map((_, i) => i),
    y: data.map(d => d.val),
    text: data.map(d => d.sv),
    textposition: 'outside',
    type: "bar",
    marker: {
      color: data.map(d => (d.val >= 50 ? "#22c55e" : d.val >= 35 ? "#eab308" : "#ef4444")),
      line: { width: 1, color: 'rgba(255,255,255,0.1)' }
    },
    hovertemplate: "<b>%{text}</b><br>SNR: %{y}<extra></extra>",
  };

  const layout: Partial<Plotly.Layout> = {
    margin: { t: 30, b: 10, l: 40, r: 10 },
    font: { size: 10, color: "#b8a094" },
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    xaxis: { 
      showgrid: false, 
      zeroline: false, 
      showticklabels: false,
      range: [-0.5, displayLimit - 0.5], // ล็อคช่วงไว้ที่ 10 ช่องเสมอ
      fixedrange: true
    },
    yaxis: { 
      title: "dB-Hz", 
      range: [0, 65], 
      gridcolor: "rgba(255, 255, 255, 0.05)",
      fixedrange: true 
    },
    autosize: true,
    // เพิ่มการตั้งค่าเพื่อความลื่นไหล
    transition: { duration: 150, easing: 'cubic-in-out' }
  };

  Plotly.react(id, [trace], layout, { responsive: true, displayModeBar: false });
};

  // Download CSV
  const handleDownloadCSV = () => {
    if (!uploadedData.raw) {
      alert("No CSV data loaded");
      return;
    }
    const csv = Papa.unparse(uploadedData.raw);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${station?.MARKER_NAM || "station"}_204${fileSuffix}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!station) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-foreground text-lg">⏳ Loading station data...</div>
      </div>
    );
  }

  const [currentHour, currentMinute] = selectedTime.split(":").map(Number);
  const period = currentHour >= 12 ? "PM" : "AM";
  const imageDisplayHour = (currentHour % 12 || 12).toString().padStart(2, "0");

  const metricButtons = ["cn0", "psr"] as const;

  return (
    <div
  className={`min-h-screen bg-background p-4 ${
    isDarkMode ? "" : "station-light"
  }`}
  style={{ position: "relative", overflow: "hidden" }}
>
      {/* Toolbar */}
      <DashboardToolbar
        visiblePanels={visiblePanels}
        togglePanel={togglePanel}
        resetAllPanels={resetAllPanels}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />

      {/* Dashboard Canvas - contains all resizable windows */}
      <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 120px)' }}>
        
        {/* Sky Plot Window */}
        <ResizableWindow
          title="Sky Plot"
          id="skyplot"
          visible={visiblePanels.skyplot}
          onClose={closePanel}
          defaultPosition={DEFAULT_POSITIONS.skyplot}
          defaultSize={DEFAULT_SIZES.skyplot}
          lockAspectRatio={true}
          
        >
<div className="p-3 h-full flex flex-col">

  {/* Dropdown แบบเดียวกับ Data Quality */}
  <div className="mb-2">
    <select
      value={skyConstellation}
      onChange={(e) =>
        setSkyConstellation(e.target.value as "ALL" | "G" | "R" | "E")
      }
      className="px-2 py-1 text-xs rounded bg-muted"
    >
      <option value="ALL">All</option>
      <option value="G">G-Satellite</option>
      <option value="R">R-Satellite</option>
      <option value="E">E-Satellite</option>
    </select>
  </div>

  <div id="polarPlot" className="flex-1 w-full" />
</div>
        </ResizableWindow>

        {/* Station Info Window */}
        <ResizableWindow
          title={`Station: ${station.MARKER_NAM}`}
          id="info"
          visible={visiblePanels.info}
          onClose={closePanel}
          defaultPosition={DEFAULT_POSITIONS.info}
          defaultSize={DEFAULT_SIZES.info}
        >
          <div className="p-4 space-y-4 overflow-auto h-full">
            <div className="space-y-2 text-sm">
              <p><span className="font-medium text-muted-foreground">Region:</span> <span className="text-foreground">{station.REGION}</span></p>
              <p><span className="font-medium text-muted-foreground">Latitude:</span> <span className="text-foreground">{station.LATITUDE}</span></p>
              <p><span className="font-medium text-muted-foreground">Longitude:</span> <span className="text-foreground">{station.LONGITUDE}</span></p>
              <p><span className="font-medium text-muted-foreground">Ellipsoid Height:</span> <span className="text-foreground">{station.ELL_Height}</span></p>
              {station.PROVINCE_TH && (
                <p><span className="font-medium text-muted-foreground">Thai Name:</span> <span className="text-foreground">{station.PROVINCE_TH}</span></p>
              )}
            </div>

{/* Day Picker */}
<div className="border-t border-border pt-4">
  <label className="text-sm text-muted-foreground">Day</label>

  <select
    value={selectedDay}
    onChange={(e) => setSelectedDay(e.target.value)}
    className="w-full mt-1 rounded-md border border-border bg-secondary px-3 py-2 text-sm"
  >
    {availableDays.map((day) => (
      <option key={day} value={day}>
        Day {day}
      </option>
    ))}
  </select>
</div>

            {/* Time Picker */}
            <div className="border-t border-border pt-4">
              <div className="flex items-center gap-4">
                {/* Hour */}
                <div className="text-center">
                  <button
                    onClick={() => changeTime((currentHour + 1) % 24, currentMinute)}
                    className="w-8 h-6 rounded bg-muted hover:bg-muted/80 transition-colors flex items-center justify-center"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <div className="text-3xl font-bold text-card-foreground my-1">{imageDisplayHour}</div>
                  <button
                    onClick={() => changeTime((currentHour - 1 + 24) % 24, currentMinute)}
                    className="w-8 h-6 rounded bg-muted hover:bg-muted/80 transition-colors flex items-center justify-center"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                <span className="text-2xl font-bold text-card-foreground">:</span>

                {/* Minute (fixed) */}
                <div className="text-center">
                  <div className="w-8 h-6 opacity-50" />
                  <div className="text-3xl font-bold text-card-foreground my-1">00</div>
                  <div className="w-8 h-6 opacity-50" />
                </div>

                {/* AM/PM */}
                <div className="flex flex-col gap-1 ml-2">
                  <button
                    onClick={() => changeTime(currentHour % 12, currentMinute)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                      period === "AM" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    AM
                  </button>
                  <button
                    onClick={() => changeTime((currentHour % 12) + 12, currentMinute)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                      period === "PM" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    PM
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ResizableWindow>

        {/* Signal Strength (SNR) Window - Scrolling Bar Chart */}
        {/* Signal Strength (SNR) Window */}
<ResizableWindow
  title="Signal-to-Noise Ratio (Average S1)"
  id="snr"
  visible={visiblePanels.snr}
  onClose={closePanel}
  defaultPosition={DEFAULT_POSITIONS.snr}
  defaultSize={DEFAULT_SIZES.snr}
>
  <div className="p-3 h-full flex flex-col bg-card/50">
    {/* กราฟหลัก */}
    <div id="signalStrengthPlot" className="flex-1 w-full min-h-[200px]" />
    
    {/* Legend คำอธิบายสี */}
    <div className="flex justify-center items-center gap-6 mt-2 py-2 border-t border-border/50 text-[10px] font-medium uppercase tracking-wider">
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm" />
        <span className="text-muted-foreground">High </span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-sm" />
        <span className="text-muted-foreground">Mid </span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm" />
        <span className="text-muted-foreground">Weak </span>
      </div>
    </div>
  </div>
</ResizableWindow>

        {/* America (G) Satellite Window */}
        <ResizableWindow
          title="G-Satellite (America)"
          id="america"
          visible={visiblePanels.america}
          onClose={closePanel}
          defaultPosition={DEFAULT_POSITIONS.america}
          defaultSize={DEFAULT_SIZES.america}
        >
          <div className="p-3 h-full flex flex-col">
            <div className="flex gap-1 mb-2 flex-wrap">
              {metricButtons.map((metric) => (
                <button
                  key={metric}
                  onClick={() => {
                    drawMiniBar("plot-G", uploadedData.groups?.["G"] || {}, metric);
                    setActiveMetric(`${metric}-G`);
                  }}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                    activeMetric === `${metric}-G`
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {metric.toUpperCase()}
                </button>
              ))}
            </div>
            <div id="plot-G" className="flex-1 w-full" />
          </div>
        </ResizableWindow>

        {/* Russia (R) Satellite Window */}
        <ResizableWindow
          title="R-Satellite (Russia)"
          id="russia"
          visible={visiblePanels.russia}
          onClose={closePanel}
          defaultPosition={DEFAULT_POSITIONS.russia}
          defaultSize={DEFAULT_SIZES.russia}
        >
          <div className="p-3 h-full flex flex-col">
            <div className="flex gap-1 mb-2 flex-wrap">
              {metricButtons.map((metric) => (
                <button
                  key={metric}
                  onClick={() => {
                    drawMiniBar("plot-R", uploadedData.groups?.["R"] || {}, metric);
                    setActiveMetric(`${metric}-R`);
                  }}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                    activeMetric === `${metric}-R`
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {metric.toUpperCase()}
                </button>
              ))}
            </div>
            <div id="plot-R" className="flex-1 w-full" />
          </div>
        </ResizableWindow>

                {/* Europe (E) Satellite Window */}
        <ResizableWindow
          title="E-Satellite (Europe)"
          id="europe"
          visible={visiblePanels.europe}
          onClose={closePanel}
          defaultPosition={DEFAULT_POSITIONS.europe}
          defaultSize={DEFAULT_SIZES.europe}
        >
          <div className="p-3 h-full flex flex-col">
            <div className="flex gap-1 mb-2 flex-wrap">
              {metricButtons.map((metric) => (
                <button
                  key={metric}
                  onClick={() => {
                    drawMiniBar("plot-E", uploadedData.groups?.["E"] || {}, metric);
                    setActiveMetric(`${metric}-E`);
                  }}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                    activeMetric === `${metric}-E`
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {metric.toUpperCase()}
                </button>
              ))}
            </div>
            <div id="plot-E" className="flex-1 w-full" />
          </div>
        </ResizableWindow>

        <ResizableWindow
  title="Data Quality"
  id="dataerror"
  visible={visiblePanels.dataerror}
  onClose={closePanel}
  defaultPosition={DEFAULT_POSITIONS.dataerror}
  defaultSize={DEFAULT_SIZES.dataerror}
>
  <div className="p-3 h-full flex flex-col">

    {/* Metric Buttons */}
    <div className="flex gap-1 mb-2 flex-wrap">
      {["doppler", "residual", "lock"].map((metric) => (
        <button
          key={metric}
          onClick={() => {
            drawMiniBar(
              "plot-dataerror",
              uploadedData.groups?.[selectedConstellation] || {},
              metric as keyof SvMetrics
            );
            setActiveMetric(`${metric}-dataerror`);
          }}
          className={`px-2 py-1 rounded text-xs font-medium transition-all ${
            activeMetric === `${metric}-dataerror`
              ? "bg-secondary text-secondary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {metric.toUpperCase()}
        </button>
      ))}
    </div>

    {/* Dropdown Constellation */}
    <div className="mb-2">
      <select
        value={selectedConstellation}
        onChange={(e) => {
          const val = e.target.value as "G" | "R" | "E";
          setSelectedConstellation(val);
          drawMiniBar(
            "plot-dataerror",
            uploadedData.groups?.[val] || {},
            "doppler"
          );
        }}
        className="px-2 py-1 text-xs rounded bg-muted"
      >
        <option value="G">G-Satellite</option>
        <option value="R">R-Satellite</option>
        <option value="E">E-Satellite</option>
      </select>
    </div>

    {/* Plot */}
    <div id="plot-dataerror" className="flex-1 w-full" />
  </div>
</ResizableWindow>

        {/* Table Window */}
        <ResizableWindow
          title="Data Table"
          id="table"
          visible={visiblePanels.table}
          onClose={closePanel}
          defaultPosition={DEFAULT_POSITIONS.table}
          defaultSize={DEFAULT_SIZES.table}
        >
          <div className="p-3 h-full overflow-auto">
            {uploadedData.raw && uploadedData.raw.length > 0 ? (
              <div className="text-xs">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted">
                      {Object.keys(uploadedData.raw[0]).slice(0, 6).map((key) => (
                        <th key={key} className="border border-border px-2 py-1 text-left font-medium text-card-foreground">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {uploadedData.raw.slice(0, 10).map((row, idx) => (
                      <tr key={idx} className="hover:bg-muted/50">
                        {Object.keys(row).slice(0, 6).map((key) => (
                          <td key={key} className="border border-border px-2 py-1 text-card-foreground">
                            {String(row[key] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-2 text-muted-foreground">Showing 10 of {uploadedData.raw.length} rows</p>
                            {/* Download button */}
            <button
              onClick={handleDownloadCSV}
              className="w-full flex items-center justify-center gap-2 bg-secondary text-secondary-foreground py-2 px-4 rounded-lg hover:bg-secondary/80 transition-colors font-medium text-sm"
            >
              <Download className="w-4 h-4" />
              Download CSV
            </button>
              </div>
            ) : (
              <p className="text-muted-foreground">No CSV data loaded</p>
            )}
          </div>
        </ResizableWindow>
      </div>
    </div>
  );
}
