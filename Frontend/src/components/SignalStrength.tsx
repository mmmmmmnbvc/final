import { useEffect } from "react";
import Plotly from "plotly.js-dist-min";
import { ResizableWindow } from "@/components/ResizableWindow";
import { GroupedData, SvMetrics } from "@/types/station";

interface SignalStrengthProps {
  visible: boolean;
  groups: GroupedData | null;
  epochIndex: number;
  onClose: (id: string) => void;
  onToggleMinimize: (isMinimized: boolean) => void;
}

const DEFAULT_POSITION = { x: 1340, y: 0 };//1720
const DEFAULT_SIZE = { width: 650, height: 580 };

export const SignalStrength = ({
  visible,
  groups,
  epochIndex,
  onClose,
  onToggleMinimize,
}: SignalStrengthProps) => {
  const drawSignalStrength = (data: GroupedData) => {
    const plotId = "signalStrengthPlot";

    const SVs: string[] = [];
    const values: number[] = [];

    for (const grp in data) {
      for (const sv in data[grp]) {
        const sData = data[grp][sv];

        const val =
          epochIndex < sData.S1.length ? sData.S1[epochIndex] : null;

        if (val !== null && val !== undefined) {
          SVs.push(sv);
          values.push(val);
        }
      }
    }

    const colors = values.map((v) =>
      v >= 45 ? "#22c55e" : v >= 35 ? "#eab308" : "#ef4444"
    );

    const trace: Plotly.Data = {
      x: SVs,
      y: values,
      type: "bar",
      text: SVs,
      textposition: "outside",
      marker: { color: colors },
      hovertemplate: "<b>%{x}</b><br>SNR %{y}<extra></extra>",
    };

    Plotly.react(
      plotId,
      [trace],
      {
        margin: { t: 30, b: 40, l: 40, r: 10 },
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        yaxis: {
          title: "dB-Hz",
          range: [0, 65],
          fixedrange: true,
        },
        xaxis: {
          tickangle: -45,
          fixedrange: true,
        },
        autosize: true,
      },
      { responsive: true, displayModeBar: false }
    );
  };

  useEffect(() => {
    if (groups && visible) {
      drawSignalStrength(groups);
    }
  }, [groups, epochIndex, visible]);

  return (
    <ResizableWindow
    title={<span className="text-xl font-bold">2. Signal-to-Noise Ratio</span>}
      id="snr"
      visible={visible}
      onClose={onClose}
      onToggleMinimize={onToggleMinimize}
      defaultPosition={DEFAULT_POSITION}
      defaultSize={DEFAULT_SIZE}
    >
      <div className="p-3 h-full flex flex-col bg-card/50 ">
        <div id="signalStrengthPlot" className="flex-1 w-full min-h-[200px]" />

        <div className="flex justify-center items-center gap-6 mt-2 py-2 border-t border-border/50 text-xl font-medium uppercase tracking-wider">
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
  );
};
