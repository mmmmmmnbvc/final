import { useEffect, useState } from "react";
import Plotly from "plotly.js-dist-min";
import { ResizableWindow } from "@/components/ResizableWindow";
import { GroupedData, SvMetrics } from "@/types/station";

interface GSatelliteProps {
  visible: boolean;
  groups: GroupedData | null;
  epochIndex: number;
  metricSatellite: string;
  onMetricChange: (metric: string) => void;
  onClose: (id: string) => void;
  onToggleMinimize: (isMinimized: boolean) => void;
}

const DEFAULT_POSITION = { x: 2012, y: 0 }; //y: 520
const DEFAULT_SIZE = { width: 650, height: 580 };
const metricButtons = ["cn0", "psr"] as const;

export const GSatellite = ({
  visible,
  groups,
  epochIndex,
  metricSatellite,
  onMetricChange,
  onClose,
  onToggleMinimize,
}: GSatelliteProps) => {
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
      drawMiniBar("plot-G", groups["G"] || {}, metricSatellite as any);
    }
  }, [groups, epochIndex, visible, metricSatellite]);

  return (
    <ResizableWindow
      title={<span className="text-xl font-bold">4. G-Satellite (America)</span>}
      id="america"
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
                drawMiniBar("plot-G", groups?.["G"] || {}, metric);
                onMetricChange(metric);
              }}
              className={`px-3 py-1 text-xl rounded-md border border-border transition ${
                metricSatellite === metric
                  ? "bg-secondary text-primary"
                  : "bg-secondary/60 text-primary hover:bg-secondary"
              }`}
            >
              {metric.toUpperCase()}
            </button>
          ))}
        </div>
        <div id="plot-G" className="flex-1 w-full" />
      </div>
    </ResizableWindow>
  );
};
