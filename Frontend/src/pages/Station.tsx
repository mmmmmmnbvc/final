  import { useParams } from "react-router-dom";
  import { useEffect, useState, useCallback } from "react";
  import { supabase } from "@/supabaseClient";
  import Papa from "papaparse";
  import { ResizableWindow } from "@/components/ResizableWindow";
  import { DashboardToolbar } from "@/components/DashboardToolbar";
  import { Skyplot } from "@/components/Skyplot";
  import { SignalStrength } from "@/components/SignalStrength";
  import { GSatellite } from "@/components/GSatellite";
  import { RSatellite } from "@/components/RSatellite";
  import { ESatellite } from "@/components/ESatellite";
  import { DataQuality } from "@/components/DataQuality";
  import { DataTable } from "@/components/DataTable";
  import { ChevronUp, ChevronDown } from "lucide-react";
  import {
    CsvRow,
    SvMetrics,
    GroupedData,
    StationData,
    PanelVisibility,
  } from "@/types/station";
  import { computeMetrics } from "@/utils/stationUtils";


  // Helper functions
  const getDayOfYear = (date: Date) => {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const day = Math.floor(diff / oneDay);

    return String(day).padStart(3, "0");
  };

  export default function Station() {
    const { stationCode } = useParams<{ stationCode: string }>();
const [isCsvLoaded, setIsCsvLoaded] = useState(false);

    const [selectedConstellation, setSelectedConstellation] = useState<"G" | "R" | "E">("G");
    const [skyConstellation, setSkyConstellation] =
    useState<"ALL" | "G" | "R" | "E">("ALL");
    const [station, setStation] = useState<StationData | null>(null);
    const [uploadedData, setUploadedData] = useState<{ raw: CsvRow[] | null; groups: GroupedData | null }>({ raw: null, groups: null });
    const [metricSatellite, setMetricSatellite] = useState("cn0")
  const [metricDataQuality, setMetricDataQuality] = useState("doppler")
   const [isPlaying, setIsPlaying] = useState(true);
  const canPlay = isPlaying && isCsvLoaded && !!uploadedData.raw;
  // ✅ ADD ตรงนี้
const [realTimePosition, setRealTimePosition] = useState<{
  lat: number;
  lon: number;
  height: number;
} | null>(null);

const [positionError, setPositionError] = useState<number | null>(null);
    const [epochIndex, setEpochIndex] = useState<number>(0);
    const satelliteCounts = {
    G: Object.keys(uploadedData.groups?.["G"] || {}).length,
    R: Object.keys(uploadedData.groups?.["R"] || {}).length,
    E: Object.keys(uploadedData.groups?.["E"] || {}).length,
    };
 
    const totalSatellites =
      satelliteCounts.G + satelliteCounts.R + satelliteCounts.E;

    const [fileSuffix, setFileSuffix] = useState<string>("a");
    const [selectedTime, setSelectedTime] = useState<string>("01:00:00");
    const [selectedDay, setSelectedDay] = useState<string>("204");
    const [availableDays, setAvailableDays] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

    useEffect(() => {
    if (!selectedDate) return;

    const day = getDayOfYear(selectedDate);

    if (availableDays.includes(day)) {
      setSelectedDay(day);
    }
  }, [selectedDate, availableDays]);

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
    setIsPlaying(false);

    const [h, m, s] = timeValue.split(":").map(Number);

    // ✅ 1. เปลี่ยนไฟล์
    let hourIndex = h - 6;
    if (hourIndex < 0) hourIndex += 24;

    const suffix = timeOptions[hourIndex]?.suffix || "a";
    setFileSuffix(suffix);

    // ✅ 2. ตั้งเวลาใหม่ให้ตรง (สำคัญมาก)
    const newTime =
      `${h.toString().padStart(2, "0")}:` +
      `${m.toString().padStart(2, "0")}:` +
      `${s.toString().padStart(2, "0")}`;

    setSelectedTime(newTime);  // 🔥 ตัวแก้หลัก

    // ✅ 3. sync index กับเวลาในชั่วโมง
    setEpochIndex(m * 60 + s);

  }, [timeOptions]);

  const changeTime = (newHour: number, newMinute: number, newSecond: number) => {

    const newT =
      `${newHour.toString().padStart(2, "0")}:` +
      `${newMinute.toString().padStart(2, "0")}:` +
      `${newSecond.toString().padStart(2, "0")}`;

    handleTimeChange(newT);
  };
const BASE_WIDTH = 3840;
const BASE_HEIGHT = 2160;

const scaleX = (px: number) => (window.innerWidth / BASE_WIDTH) * px;
const scaleY = (px: number) => (window.innerHeight / BASE_HEIGHT) * px;
  useEffect(() => {
    fetch("/day.json")
      .then((res) => res.json())
      .then((data) => {
        console.log("DAY JSON:", data);

        const formatted = data.days.map((d: number | string) =>
          String(d).padStart(3, "0")
        );

        setAvailableDays(formatted);
      });
  }, []);

    // AutoPlay effect - continuously cycle through times
useEffect(() => {
  if (!canPlay) {
    return; // React จะ cleanup timer เดิมให้อยู่แล้ว
  }

  const timer = setInterval(() => {
    setSelectedTime((prevTime) => {
      const [h, m, s] = prevTime.split(":").map(Number);

      let newS = s + 1;
      let newM = m;
      let newH = h;

      if (newS >= 60) {
        newS = 0;
        newM++;
        if (newM >= 60) {
          newM = 0;
          newH = (newH + 1) % 24;
        }
      }

      return `${newH.toString().padStart(2, "0")}:` +
             `${newM.toString().padStart(2, "0")}:` +
             `${newS.toString().padStart(2, "0")}`;
    });
  }, 1000);

  return () => clearInterval(timer);
}, [canPlay]);

useEffect(() => {
  if (!isCsvLoaded) {
    setIsPlaying(false);
  }
}, [isCsvLoaded]);
    // Monitor selectedTime changes during autoplay and update fileSuffix when hour changes
    useEffect(() => {
      if (!isPlaying) return;

      const [h, m, s] = selectedTime.split(":").map(Number);

      // Calculate which file hour this time belongs to
      let hourIndex = h - 6;
      if (hourIndex < 0) hourIndex += 24;

      const newSuffix = timeOptions[hourIndex]?.suffix || "a";

      // If suffix changes (hour boundary crossed), update it
      if (newSuffix !== fileSuffix) {
        setFileSuffix(newSuffix);
      }

      // Update epochIndex based on minutes and seconds
      setEpochIndex(m * 60 + s);

    }, [selectedTime, isPlaying, fileSuffix, timeOptions]);

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

    // Load CSV based on selected time
    useEffect(() => {
      if (!station || !fileSuffix) return;
      if (!availableDays.includes(selectedDay)) {
    console.warn("❌ No CSV for this day");
    setUploadedData({ raw: null, groups: null });
    setIsCsvLoaded(false);
    setIsPlaying(false);
    return;
  }

      const csvPath = `/${selectedDay}/${station.MARKER_NAM}${selectedDay}${fileSuffix}.csv`;

      fetch(csvPath)
        .then((res) => {
          if (!res.ok) throw new Error("File not found: " + csvPath);
          return res.text();
        })
.then((csvText) => {
  Papa.parse<CsvRow>(csvText, {
    header: true,
    complete: (results) => {
      const data = results.data;
      const groups = computeMetrics(data);
      setUploadedData({ raw: data, groups });

      setIsCsvLoaded(true); // ✅ โหลดเสร็จ
    },
  });
})
.catch((err) => {
  console.warn("CSV load failed:", err.message);

  setUploadedData({ raw: null, groups: null }); // 🔥 ตัวแก้หลัก
  setIsCsvLoaded(false);
  setIsPlaying(false); // (แนะนำ) หยุดเลย
});
    }, [station, fileSuffix, selectedDay]);
// ✅ position real time
useEffect(() => {
  if (!station) return;

  // ✅ random offset (fake movement)
  const latOffset = (Math.random() - 0.5) * 0.0002;
  const lonOffset = (Math.random() - 0.5) * 0.0002;
  const heightOffset = (Math.random() - 0.5) * 2;

  const fakeLat = station.LATITUDE + latOffset;
  const fakeLon = station.LONGITUDE + lonOffset;
  const fakeHeight = station.ELL_Height + heightOffset;

  setRealTimePosition({
    lat: fakeLat,
    lon: fakeLon,
    height: fakeHeight,
  });

  // ✅ error คำนวณจาก offset (สมจริงขึ้น)
  const error =
    Math.sqrt(latOffset ** 2 + lonOffset ** 2) * 111000; // meters

  setPositionError(error);

}, [epochIndex, station]);
    if (!station) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-foreground text-lg">⏳ Loading station data...</div>
        </div>
      );
    }

    const [currentHour, currentMinute, currentSecond] =
      selectedTime.split(":").map(Number);

  const imageDisplayHour = currentHour
    .toString()
    .padStart(2, "0");

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

        {/* Dashboard Canvas */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "calc(100vh - 120px)",
          }}
        >
          {/* Skyplot Component */}
          <Skyplot
            visible={visiblePanels.skyplot}
            groups={uploadedData.groups}
            epochIndex={epochIndex}
            skyConstellation={skyConstellation}
            onSkyConstellationChange={setSkyConstellation}
            onClose={closePanel}
            onToggleMinimize={(isMinimized) => {}}
            satelliteCounts={satelliteCounts}
          />

          {/* Station Info Window - Original */}
          <ResizableWindow
          
            title={
  <span className="text-xl font-bold">
    Station: {station?.MARKER_NAM || "Loading..."}
  </span>
}
            id="info"
            visible={visiblePanels.info}
            onClose={closePanel}
            // position size
            defaultPosition={{ x: 0, y: 0 }}
            defaultSize={{ width: 450, height: 430 }}
            
          >
            <div className="p-4 space-y-4 overflow-auto h-full text-xl">
              <div className="space-y-2 ">
                <p>
                  <span className="font-medium text-muted-foreground">Region:</span>{" "}
                  <span className="text-foreground">{station?.REGION || "-"}</span>
                </p>
                <p>
                  <span className="font-medium text-muted-foreground">
                    Latitude:
                  </span>{" "}
                  <span className="text-foreground">
                    {station?.LATITUDE || "-"}
                  </span>
                </p>
                <p>
                  <span className="font-medium text-muted-foreground">
                    Longitude:
                  </span>{" "}
                  <span className="text-foreground">
                    {station?.LONGITUDE || "-"}
                  </span>
                </p>
                <p>
                  <span className="font-medium text-muted-foreground">
                    Ellipsoid Height:
                  </span>{" "}
                  <span className="text-foreground">
                    {station?.ELL_Height || "-"}
                  </span>
                </p>
                {/* ✅ ADD ตรงนี้ */}
<p>
  <span className="font-medium text-muted-foreground">
    Position Real-time:
  </span>{" "}
  <span className="text-foreground">
    {realTimePosition
      ? `${realTimePosition.lat.toFixed(6)}, ${realTimePosition.lon.toFixed(6)}`
      : "-"}
  </span>
</p>

<p>
  <span className="font-medium text-muted-foreground">
    Error:
  </span>{" "}
  <span className="text-foreground">
    {positionError !== null
      ? positionError.toFixed(6)
      : "-"}
  </span>
</p>
                {station?.PROVINCE_TH && (
                  <p>
                    <span className="font-medium text-muted-foreground">
                      Thai Name:
                    </span>{" "}
                    <span className="text-foreground">{station.PROVINCE_TH}</span>
                  </p>
                )}
              </div>

              {/* Day Picker */}
              <div className="border-t border-border pt-4 ">
                <label className=" text-muted-foreground block mb-1 text-xl">
                  Day
                </label>

                <input
                  type="date"
                  className=" text-xl px-2 py-1  rounded border border-border bg-secondary text-primary"
onChange={(e) => {
  const date = new Date(e.target.value);
  const day = getDayOfYear(date);

  setSelectedDate(date);
}}
                />
              </div>

              {/* Time Picker */}
              <div className="border-t border-border pt-4">
                <div className="flex items-center gap-4">
                  {/* Hour */}
                  <div className="text-center">
                    <button
                      onClick={() =>
                        changeTime((currentHour + 1) % 24, currentMinute, currentSecond)
                      }
                      className="w-8 h-6 rounded bg-primary hover:bg-primary/80 transition-colors flex items-center justify-center text-primary-foreground font-bold"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <div className="text-3xl font-bold text-card-foreground my-1">
                      {imageDisplayHour}
                    </div>
                    <button
                      onClick={() =>
                        changeTime(
                          (currentHour - 1 + 24) % 24,
                          currentMinute,
                          currentSecond
                        )
                      }
                      className="w-8 h-6 rounded bg-primary hover:bg-primary/80 transition-colors flex items-center justify-center text-primary-foreground font-bold"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  <span className="text-2xl font-bold text-card-foreground">
                    :
                  </span>

                  {/* Minute */}
                  <div className="text-center">
                    <button
                      onClick={() =>
                        changeTime(
                          currentHour,
                          (currentMinute + 1) % 60,
                          currentSecond
                        )
                      }
                      className="w-8 h-6 rounded bg-primary hover:bg-primary/80 flex items-center justify-center"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>

                    <div className="text-3xl font-bold text-card-foreground my-1">
                      {currentMinute.toString().padStart(2, "0")}
                    </div>

                    <button
                      onClick={() =>
                        changeTime(
                          currentHour,
                          (currentMinute - 1 + 60) % 60,
                          currentSecond
                        )
                      }
                      className="w-8 h-6 rounded bg-primary hover:bg-primary/80 flex items-center justify-center"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  <span className="text-2xl font-bold text-card-foreground">
                    :
                  </span>

                  {/* Second */}
                  <div className="text-center">
                    <button
                      onClick={() =>
                        changeTime(
                          currentHour,
                          currentMinute,
                          (currentSecond + 1) % 60
                        )
                      }
                      className="w-8 h-6 rounded bg-primary hover:bg-primary/80 flex items-center justify-center"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>

                    <div className="text-3xl font-bold text-card-foreground my-1">
                      {currentSecond.toString().padStart(2, "0")}
                    </div>

                    <button
                      onClick={() =>
                        changeTime(
                          currentHour,
                          currentMinute,
                          (currentSecond - 1 + 60) % 60
                        )
                      }
                      className="w-8 h-6 rounded bg-primary hover:bg-primary/80 flex items-center justify-center"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* AM/PM */}
                  <div className="flex flex-col gap-1 ml-2 ">

                    <button
                      onClick={() => setIsPlaying((p) => !p)}
                      className={`px-3 py-1 rounded text-xl font-medium transition-all ${
                        isPlaying
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isPlaying ? "Pause" : "Play"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </ResizableWindow>

          {/* Signal Strength Component */}
          <SignalStrength
            visible={visiblePanels.snr}
            groups={uploadedData.groups}
            epochIndex={epochIndex}
            onClose={closePanel}
            onToggleMinimize={() => {}}
          />

          {/* G-Satellite Component */}
          <GSatellite
            visible={visiblePanels.america}
            groups={uploadedData.groups}
            epochIndex={epochIndex}
            metricSatellite={metricSatellite}
            onMetricChange={setMetricSatellite}
            onClose={closePanel}
            onToggleMinimize={() => {}}
            
          />

          {/* R-Satellite Component */}
          <RSatellite
            visible={visiblePanels.russia}
            groups={uploadedData.groups}
            epochIndex={epochIndex}
            metricSatellite={metricSatellite}
            onMetricChange={setMetricSatellite}
            onClose={closePanel}
            onToggleMinimize={() => {}}
          />

          {/* E-Satellite Component */}
          <ESatellite
            visible={visiblePanels.europe}
            groups={uploadedData.groups}
            epochIndex={epochIndex}
            metricSatellite={metricSatellite}
            onMetricChange={setMetricSatellite}
            onClose={closePanel}
            onToggleMinimize={() => {}}
          />

          {/* Data Quality Component */}
          <DataQuality
            visible={visiblePanels.dataerror}
            groups={uploadedData.groups}
            epochIndex={epochIndex}
            selectedConstellation={selectedConstellation}
            onConstellationChange={setSelectedConstellation}
            metricDataQuality={metricDataQuality}
            onMetricChange={setMetricDataQuality}
            onClose={closePanel}
            onToggleMinimize={() => {}}
          />

          {/* Data Table Component */}
          <DataTable
            visible={visiblePanels.table}
            rawData={uploadedData.raw}
            stationName={station?.MARKER_NAM}
            fileSuffix={fileSuffix}
            selectedDay={selectedDay}
            onClose={closePanel}
          />
        </div>
      </div>
    );
  }
