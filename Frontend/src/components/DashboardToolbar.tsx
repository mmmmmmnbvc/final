import { Eye, EyeOff, RotateCcw, Sun, Moon } from "lucide-react";

interface PanelVisibility {
  skyplot: boolean;
  info: boolean;
  snr: boolean;
  america: boolean;
  russia: boolean;
  europe: boolean;
  dataerror: boolean;
  table: boolean;
}

interface DashboardToolbarProps {
  visiblePanels: PanelVisibility;
  togglePanel: (id: keyof PanelVisibility) => void;
  resetAllPanels: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const panels: { id: keyof PanelVisibility; label: string }[] = [
  { id: 'skyplot', label: 'Sky Plot' },
  { id: 'info', label: 'Station' },
  { id: 'snr', label: 'SNR' },
  { id: 'america', label: 'G-Satellite' },
  { id: 'russia', label: 'R-Satellite' },
  { id: 'europe', label: 'E-Satellite' },
  { id: 'dataerror', label: 'Data Quality' },
  { id: 'table', label: 'Table' },
];

export const DashboardToolbar = ({ 
  visiblePanels, 
  togglePanel, 
  resetAllPanels,
  isDarkMode,
  toggleTheme
}: DashboardToolbarProps) => {
  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-card/50 backdrop-blur-sm rounded-lg border border-border mb-4">
      <button
        onClick={toggleTheme}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all"
        title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        {isDarkMode ? (
          <Sun className="w-4 h-4" />
        ) : (
          <Moon className="w-4 h-4" />
        )}
      </button>
      
      <span className="text-sm font-medium text-muted-foreground mr-2">Windows:</span>
      
      {panels.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => togglePanel(id)}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all
            ${visiblePanels[id] 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }
          `}
        >
          {visiblePanels[id] ? (
            <Eye className="w-3 h-3" />
          ) : (
            <EyeOff className="w-3 h-3" />
          )}
          {label}
        </button>
      ))}
      
      <div className="flex-1" />
      
      <button
        onClick={resetAllPanels}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all"
      >
        <RotateCcw className="w-3 h-3" />
        Reset All
      </button>
    </div>
  );
};
