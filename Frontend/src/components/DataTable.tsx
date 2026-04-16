  import { useCallback } from "react";
  import Papa from "papaparse";
  import { Download } from "lucide-react";
  import { ResizableWindow } from "@/components/ResizableWindow";
  import { CsvRow } from "@/types/station";

  interface DataTableProps {
    visible: boolean;
    rawData: CsvRow[] | null;
    stationName?: string;
    fileSuffix: string;
    selectedDay: string; // ✅ เพิ่ม
    onClose: (id: string) => void;
  }

  const DEFAULT_POSITION = { x: 1410, y: 450 }; //
  const DEFAULT_SIZE = { width: 450, height: 430 };

  export const DataTable = ({
    visible,
    rawData,
    stationName = "station",
    fileSuffix,
    selectedDay,
    onClose,
  }: DataTableProps) => {
    const handleDownloadCSV = useCallback(() => {
      if (!rawData) {
        alert("No CSV data loaded");
        return;
      }
      const csv = Papa.unparse(rawData);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${stationName}_204${fileSuffix}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    }, [rawData, stationName, fileSuffix]);
const handleDownloadRinex = useCallback(() => {
  if (!stationName || !fileSuffix || !selectedDay) {
    alert("Missing file info");
    return;
  }

  const BASE_URL = "https://covered-telephone-editorials-sheep.trycloudflare.com";

  const fileName = `${stationName}${selectedDay}${fileSuffix}.25o`;
  const filePath = `${BASE_URL}/api/csv?folder=${selectedDay}&file=${fileName}`;

  const link = document.createElement("a");
  link.href = filePath;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

}, [stationName, fileSuffix, selectedDay]);
    return (
      <ResizableWindow
      title={<span className="text-xl font-bold">7. Data Table</span>}
        id="table"
        visible={visible}
        onClose={onClose}
        defaultPosition={DEFAULT_POSITION}
        defaultSize={DEFAULT_SIZE}
      >
        <div className="p-3 h-full overflow-auto">
          {rawData && rawData.length > 0 ? (
            <div className="text-xs">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted">
                    {Object.keys(rawData[0])
                      .slice(1, 5)
                      .map((key) => (
                        <th
                          key={key}
                          className="border border-border px-2 py-1 text-left font-medium text-card-foreground"
                        >
                          {key}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {rawData.slice(0,8).map((row, idx) => (
                    <tr key={idx} className="hover:bg-muted/50">
                      {Object.keys(row)
                        .slice(1, 5)
                        .map((key) => (
                          <td
                            key={key}
                            className="border border-border px-2 py-1 text-card-foreground"
                          >
                            {String(row[key] ?? "")}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-muted-foreground">
                Showing 5 of {rawData.length} rows
              </p>
              <button
                onClick={handleDownloadCSV}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:bg-primary/80 transition-colors font-medium text-sm mt-2"
              >
                <Download className="w-4 h-4" />
                Download CSV
              </button>
              <button
                onClick={handleDownloadRinex}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:bg-primary/80 transition-colors font-medium text-sm mt-2"
              >
                <Download className="w-4 h-4" />
                Download RINEX (.25o)
              </button>
            </div>
          ) : (
            <p className="text-muted-foreground">No CSV data loaded</p>
          )}
        </div>
      </ResizableWindow>
    );
  };
