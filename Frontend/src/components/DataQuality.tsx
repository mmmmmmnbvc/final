import { useEffect } from "react";
import Plotly from "plotly.js-dist-min";
import * as math from "mathjs";
import { ResizableWindow } from "@/components/ResizableWindow";
import { GroupedData, SvMetrics } from "@/types/station";

interface DataQualityProps {
  visible: boolean;
  groups: GroupedData | null;
  epochIndex: number;
  selectedConstellation: "G" | "R" | "E";
  onConstellationChange: (constellation: "G" | "R" | "E") => void;
  metricDataQuality: string;
  onMetricChange: (metric: string) => void;
  onClose: (id: string) => void;
  onToggleMinimize: (isMinimized: boolean) => void;
}

const DEFAULT_POSITION = { x: 1340, y: 600 };//1590
const DEFAULT_SIZE = { width: 650, height: 580 };

export const DataQuality = ({
  visible,
  groups,
  epochIndex,
  selectedConstellation,
  onConstellationChange,
  metricDataQuality,
  onMetricChange,
  onClose,
  onToggleMinimize,
}: DataQualityProps) => {

  // =========================
  // ✅ FAKE DOP FROM SKYLOGIC
  // =========================
  const computeFakeDOP = (
    groupData: { [SV: string]: SvMetrics }
  ) => {
    const SVs = Object.keys(groupData);

    if (SVs.length < 4) {
      return { gdop: NaN, pdop: NaN, hdop: NaN, vdop: NaN, tdop: NaN };
    }

    const G: number[][] = [];

    SVs.forEach((SV, idx) => {
      const snr = groupData[SV].S1?.[epochIndex];
      if (!snr) return;

      // mimic skyplot
      let r = (60 - snr) / 40;
      if (r < 0.1) r = 0.1;
      if (r > 1) r = 1;

      const theta = (idx * 137.5 * Math.PI) / 180;

      const x = Math.cos(theta) * r;
      const y = Math.sin(theta) * r;
      const z = Math.sqrt(1 - r * r);

      G.push([x, y, z, 1]);
    });

    if (G.length < 4) {
      return { gdop: NaN, pdop: NaN, hdop: NaN, vdop: NaN, tdop: NaN };
    }

    try {
      const GT = math.transpose(G) as any;
      const GTG = math.multiply(GT, G) as any;
      const Q = math.inv(GTG) as any;

      return {
        gdop: Math.sqrt(Q[0][0] + Q[1][1] + Q[2][2] + Q[3][3]),
        pdop: Math.sqrt(Q[0][0] + Q[1][1] + Q[2][2]),
        hdop: Math.sqrt(Q[0][0] + Q[1][1]),
        vdop: Math.sqrt(Q[2][2]),
        tdop: Math.sqrt(Q[3][3]),
      };
    } catch {
      return { gdop: NaN, pdop: NaN, hdop: NaN, vdop: NaN, tdop: NaN };
    }
  };

  // =========================
  // 📊 DRAW BAR
  // =========================
  const drawMiniBar = (
    plotId: string,
    groupData: { [SV: string]: SvMetrics },
    metric: keyof SvMetrics | "cn0" | "psr" | string
  ) => {
    const SVs = Object.keys(groupData).sort();
    const traces: Plotly.Data[] = [];

    const getValue = (arr: (number | null)[]): number => {
      if (!arr.length) return NaN;
      const i = Math.min(epochIndex, arr.length - 1);
      const val = arr[i];
      return val !== null && val !== undefined ? (val as number) : NaN;
    };

    const barColors: Record<string, string> = {
      cn0: "#3b82f6",
      psr: "#06b6d4",
      doppler: "#a855f7",
      // residual: "#ef4444",
      // lock: "#ec4899",

      gdop: "#f59e0b",
      pdop: "#eab308",
      hdop: "#84cc16",
      vdop: "#22c55e",
      tdop: "#06b6d4",
    };

    let y: number[] = [];

    if (metric === "cn0") {
      y = SVs.map((SV) => getValue(groupData[SV].S1));
    } else if (metric === "psr") {
      y = SVs.map((SV) => getValue(groupData[SV].C1));
    } else if (metric === "doppler") {
      y = SVs.map((SV) => getValue(groupData[SV].doppler));
    } //else if (metric === "residual") {
    //   y = SVs.map((SV) => getValue(groupData[SV].residual));
    // } else if (metric === "lock") {
    //   y = SVs.map((SV) => getValue(groupData[SV].lock));
    // } 
    // ✅ DOP
    else if (["gdop", "pdop", "hdop", "vdop", "tdop"].includes(metric)) {
      const dop = computeFakeDOP(groupData);

      y = SVs.map(() => {
        if (metric === "gdop") return dop.gdop;
        if (metric === "pdop") return dop.pdop;
        if (metric === "hdop") return dop.hdop;
        if (metric === "vdop") return dop.vdop;
        if (metric === "tdop") return dop.tdop;
        return NaN;
      });
    }
const colors = y.map((v) => {
  if (metric === "doppler") {
    const absV = Math.abs(v);

return v >= 2000 ? "#22c55e" : v >= 1 ? "#eab308" : "#ef4444";
  }

  return barColors[metric] || "#3b82f6";
});
    traces.push({
      x: SVs,
      y,
      type: "bar",
      marker: { color: colors },
    });

    Plotly.react(
      plotId,
      traces,
      {
        barmode: "group",
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        margin: { t: 10, b: 40, l: 30, r: 10 },
        showlegend: false,
        yaxis: { showticklabels: true, fixedrange: true },
        xaxis: { tickangle: -45 },
      },
      { responsive: true, displayModeBar: false }
    );
  };

  useEffect(() => {
    if (groups && visible) {
      drawMiniBar(
        "plot-dataerror",
        groups?.[selectedConstellation] || {},
        metricDataQuality
      );
    }
  }, [groups, epochIndex, visible, selectedConstellation, metricDataQuality]);

  return (
    <ResizableWindow
      title={<span className="text-xl font-bold">6. Data Quality</span>}
      id="dataerror"
      visible={visible}
      onClose={onClose}
      onToggleMinimize={onToggleMinimize}
      defaultPosition={DEFAULT_POSITION}
      defaultSize={DEFAULT_SIZE}
    >
      <div className="p-3 h-full flex flex-col">
        <div className="flex gap-1 mb-2 flex-wrap  ">
          {[
            "doppler",
            // "residual",
            // "lock",
            "gdop",
            "pdop",
            "hdop",
            "vdop",
            "tdop",
          ].map((metric) => (
            <button
              key={metric}
              onClick={() => {
                drawMiniBar(
                  "plot-dataerror",
                  groups?.[selectedConstellation] || {},
                  metric
                );
                onMetricChange(metric);
              }}
              className={`px-3 py-1 text-xl rounded-md border border-border ${
                metricDataQuality === metric
                  ? "bg-secondary text-primary"
                  : "bg-secondary/60 text-primary hover:bg-secondary"
              }`}
            >
              {metric.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="mb-2">
          <select
            value={selectedConstellation}
            onChange={(e) => {
              const val = e.target.value as "G" | "R" | "E";
              onConstellationChange(val);
              drawMiniBar(
                "plot-dataerror",
                groups?.[val] || {},
                metricDataQuality
              );
            }}
            className="px-3 py-1 text-xl rounded-md border border-border bg-secondary text-primary"
          >
            <option value="G">G-Satellite</option>
            <option value="R">R-Satellite</option>
            <option value="E">E-Satellite</option>
          </select>
        </div>

        <div id="plot-dataerror" className="flex-1 w-full" />
      </div>
    </ResizableWindow>
  );
};