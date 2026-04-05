import { useEffect, useState } from "react";
import Plotly from "plotly.js-dist-min";
import { ResizableWindow } from "@/components/ResizableWindow";
import { GroupedData, SvMetrics } from "@/types/station";

interface SkyplotProps {
  visible: boolean;
  groups: GroupedData | null;
  epochIndex: number;
  skyConstellation: "ALL" | "G" | "R" | "E";
  onSkyConstellationChange: (value: "ALL" | "G" | "R" | "E") => void;
  onClose: (id: string) => void;
  onToggleMinimize: (isMinimized: boolean) => void;
  satelliteCounts: { G: number; R: number; E: number };
}

const DEFAULT_POSITION = { x: 670, y: 0 };
const DEFAULT_SIZE = { width: 650, height: 580 };

export const Skyplot = ({
  visible,
  groups,
  epochIndex,
  skyConstellation,
  onSkyConstellationChange,
  onClose,
  onToggleMinimize,
  satelliteCounts,
}: SkyplotProps) => {
  const totalSatellites =
    satelliteCounts.G + satelliteCounts.R + satelliteCounts.E;

  const drawPolar = (data: GroupedData, filter: "ALL" | "G" | "R" | "E"): void => {
    const plotDiv = document.getElementById("polarPlot");
    if (!plotDiv) return;

    let traces: Plotly.Data[] = [];
    let allSatellites: string[] = [];
    const avgSNRValues: { [SV: string]: number } = {};

    for (const grp in data) {
      if (filter !== "ALL" && grp !== filter) continue;
      for (const SV in data[grp]) {
        const SVData: SvMetrics = data[grp][SV];
        const val =
          epochIndex < SVData.S1.length ? SVData.S1[epochIndex] : null;

        if (val !== null && val !== undefined) {
          allSatellites.push(SV);
          avgSNRValues[SV] = val;
        }
      }
    }

    allSatellites.sort().forEach((SV: string, idx: number) => {
      const snr: number = avgSNRValues[SV];

      const svType = SV.charAt(0);
      let color: string;
      if (svType === "G") color = "#3B82F6";
      else if (svType === "R") color = "#EF4444";
      else if (svType === "E") color = "#22C55E";
      else color = "#8B5CF6";

      let r_value: number = (60 - snr) / 40;
      if (r_value < 0.1) r_value = 0.1;
      if (r_value > 1) r_value = 1;

      const svNum = parseInt(SV.substring(1));

      let theta_value: number;

      if (svType === "G") theta_value = (svNum * 11) % 360;
      else if (svType === "R") theta_value = (svNum * 15 + 180) % 360;
      else theta_value = (idx * 137.5) % 360;

      traces.push({
        type: "scatterpolar",
        r: [r_value * 10],
        theta: [theta_value],
        mode: "markers+text",
        text: [SV],
        textposition: "top center",
        name: SV,

        marker: {
          size: 12,
          color: color,

          symbol:
            SV.startsWith("G")
              ? "circle"
              : SV.startsWith("R")
                ? "square"
                : SV.startsWith("E")
                  ? "triangle-up"
                  : "circle",

          line: {
            color: "white",
            width: 1,
          },
        },

        hovertemplate: `SV: ${SV}<br>Avg SNR: ${snr.toFixed(2)} dB-Hz<extra></extra>`,
      } as Plotly.Data);
    });

    Plotly.newPlot(
      "polarPlot",
      traces,
      {
        polar: {
          radialaxis: {
            visible: true,
            range: [0, 10],
            showticklabels: false,
            gridcolor: "#444",
          },
          angularaxis: {
            direction: "clockwise",
            rotation: 90,
            gridcolor: "#444",
          },
          bgcolor: "rgba(0,0,0,0)",
        },
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        margin: { t: 30, b: 30, l: 30, r: 30 },
        showlegend: false,
        autosize: true,
      },
      { responsive: true, displayModeBar: false }
    );
  };

  useEffect(() => {
    if (groups && visible) {
      drawPolar(groups, skyConstellation);
    }
  }, [groups, epochIndex, visible, skyConstellation]);

  return (
    <ResizableWindow
      title={<span className="text-xl font-bold">1. Sky Plot</span>}
      id="skyplot"
      visible={visible}
      onClose={onClose}
      onToggleMinimize={onToggleMinimize}
      defaultPosition={DEFAULT_POSITION}
      defaultSize={DEFAULT_SIZE}
      lockAspectRatio={true}
    >
      <div className="p-3 h-full flex flex-col ">
        <div className="mb-2  ">
          <select
            value={skyConstellation}
            onChange={(e) =>
              onSkyConstellationChange(e.target.value as "ALL" | "G" | "R" | "E")
            }
            className="px-3 py-1 text-xl rounded-md border border-border bg-secondary text-primary hover:bg-secondary/80"
          >
            <option value="ALL">All ({totalSatellites})</option>
            <option value="G">G-Satellite ({satelliteCounts.G})</option>
            <option value="R">R-Satellite ({satelliteCounts.R})</option>
            <option value="E">E-Satellite ({satelliteCounts.E})</option>
          </select>
        </div>

        <div id="polarPlot" className="flex-1 w-full" />
      </div>
    </ResizableWindow>
  );
};
