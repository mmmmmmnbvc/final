import { useEffect } from "react";
import Plotly from "plotly.js-dist-min";
import { ResizableWindow } from "@/components/ResizableWindow";
import { GroupedData, SvMetrics } from "@/types/station";
import russiaImg from "@/assets/RUS.jpg";
interface RSatelliteProps {
  visible: boolean;
  groups: GroupedData | null;
  epochIndex: number;
  metricSatellite: string;
  onMetricChange: (metric: string) => void;
  onClose: (id: string) => void;
  onToggleMinimize: (isMinimized: boolean) => void;
}

const DEFAULT_POSITION = { x: 0, y: 450 };//530
const DEFAULT_SIZE = { width: 450, height: 430 };
const metricButtons = ["cn0", "psr"] as const;

export const RSatellite = ({
  visible,
  groups,
  epochIndex,
  metricSatellite,
  onMetricChange,
  onClose,
  onToggleMinimize,
}: RSatelliteProps) => {
  const drawMiniBar = (
    plotId: string,
    groupData: { [SV: string]: SvMetrics },
    metric: keyof SvMetrics | "cn0" | "psr"
  ) => {
    const SVs = Object.keys(groupData).sort();
    const traces: Plotly.Data[] = [];

    const getValue = (arr: (number | null)[]): number => {
      if (!arr.length) return NaN;

      const i = Math.min(epochIndex, arr.length - 1);
      const val = arr[i];

      return val !== null && val !== undefined ? (val as number) : NaN;
    };

    if (SVs.length === 0) {
      Plotly.react(plotId, traces, {
        margin: { t: 10, b: 40, l: 30, r: 10 },
        showlegend: false,
        yaxis: {
          title: "",
          range: [0, 65],
          showticklabels: false,
          fixedrange: true,
        },
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
      y = SVs.map((SV) => getValue(groupData[SV].S1));
    } else if (metric === "psr") {
      y = SVs.map((SV) => getValue(groupData[SV].C1));
    } else if (metric === "doppler") {
      y = SVs.map((SV) => getValue(groupData[SV].doppler));
    } else if (metric === "residual") {
      y = SVs.map((SV) => getValue(groupData[SV].residual));
    } else if (metric === "lock") {
      y = SVs.map((SV) => getValue(groupData[SV].lock));
    }
const colors = y.map((v) => {
  if (metric === "cn0") {
    // ใช้เกณฑ์เดิม
    return v >= 45 ? "#22c55e" : v >= 35 ? "#eab308" : "#ef4444";
  }

  if (metric === "psr") {
    // 👉 กำหนด threshold ใหม่สำหรับ psr
    return v >= 24000000 ? "#22c55e" : v >= 21000000 ? "#eab308" : "#ef4444";
  }


});
    traces.push({
      x,
      y,
      name: metric.toString().toUpperCase(),
      type: "bar",
      marker: { color: colors },
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

  useEffect(() => {
    if (groups && visible) {
      drawMiniBar("plot-R", groups["R"] || {}, metricSatellite as any);
    }
  }, [groups, epochIndex, visible, metricSatellite]);

  return (
    <ResizableWindow
    // title={<span className="text-xl font-bold">4. R-Satellite (Russia)</span>}
          title={
  <div className="flex items-center gap-2">
    <span className="text-xl font-bold">
      4. R-Satellite (Russia)
    </span>
    <img src={russiaImg} alt="Russia" className="w-6 h-6 object-contain" />
  </div>
}
      id="russia"
      visible={visible}
      onClose={onClose}
      onToggleMinimize={onToggleMinimize}
      defaultPosition={DEFAULT_POSITION}
      defaultSize={DEFAULT_SIZE}
    >
      <div className="p-3 h-full flex flex-col">
        <div className="flex gap-1 mb-2 flex-wrap">
          {metricButtons.map((metric) => (
            <button
              key={metric}
              onClick={() => {
                drawMiniBar("plot-R", groups?.["R"] || {}, metric);
                onMetricChange(metric);
              }}
className={`px-3 py-1 text-xl rounded-md border transition ${
  metricSatellite === metric
    ? "bg-blue-500 text-white border-blue-500"
    : "bg-gray-200 text-gray-700 border-gray-300 hover:bg-gray-300"
}`}
            >
              {metric.toUpperCase()}
            </button>
          ))}
        </div>
        <div id="plot-R" className="flex-1 w-full" />

<div className="flex justify-center items-center gap-6 mt-2 py-2 border-t border-border/50 text-xl font-medium uppercase tracking-wider">
  <div className="flex items-center gap-1.5">
    <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm" />
    <span className="text-muted-foreground">High</span>
  </div>
  <div className="flex items-center gap-1.5">
    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-sm" />
    <span className="text-muted-foreground">Mid</span>
  </div>
  <div className="flex items-center gap-1.5">
    <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm" />
    <span className="text-muted-foreground">Weak</span>
  </div>
</div>
      </div>
    </ResizableWindow>
  );
};
