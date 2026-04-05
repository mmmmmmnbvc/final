import { useState } from "react";
import { MarkerData } from "@/types/marker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Database, ArrowUp, ArrowDown, ArrowUpDown, Check, X } from "lucide-react";

interface MarkerTableProps {
  data: MarkerData[];
  onDelete: (no: number) => void;
  onUpdate: (no: number, field: string, value: string | number) => void;
}

type SortDir = "asc" | "desc" | null;

const columns = [
  { key: "no", label: "No", sortable: true },
  { key: "markerName", label: "MARKER_NAM", sortable: true },
  { key: "latitude", label: "LATITUDE", sortable: true },
  { key: "longitude", label: "LONGITUDE", sortable: true },
  { key: "ellHeight", label: "ELL_Height", sortable: true },
  { key: "province", label: "PROVINCE", sortable: true },
  { key: "region", label: "REGION", sortable: true },
  { key: "provinceTh", label: "PROVINCE_TH", sortable: true },
];

const MarkerTable = ({ data, onDelete, onUpdate }: MarkerTableProps) => {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [editingCell, setEditingCell] = useState<{ no: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDir === "asc") setSortDir("desc");
      else if (sortDir === "desc") { setSortKey(null); setSortDir(null); }
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey || !sortDir) return 0;
    const aVal = a[sortKey as keyof MarkerData];
    const bVal = b[sortKey as keyof MarkerData];
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    }
    return sortDir === "asc"
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  const startEdit = (no: number, field: string, currentValue: string | number) => {
    setEditingCell({ no, field });
    setEditValue(String(currentValue));
  };

  const confirmEdit = () => {
    if (!editingCell) return;
    const { no, field } = editingCell;
    const numFields = ["latitude", "longitude", "ellHeight", "no"];
    const finalValue = numFields.includes(field) ? Number(editValue) : editValue;
    onUpdate(no, field, finalValue);
    setEditingCell(null);
  };

  const cancelEdit = () => setEditingCell(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") confirmEdit();
    if (e.key === "Escape") cancelEdit();
  };

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sortKey !== colKey) return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />;
    if (sortDir === "asc") return <ArrowUp className="h-3.5 w-3.5 text-primary" />;
    return <ArrowDown className="h-3.5 w-3.5 text-primary" />;
  };

  const isEditing = (no: number, field: string) =>
    editingCell?.no === no && editingCell?.field === field;

  return (
    <div className="animate-fade-in">
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">ข้อมูลทั้งหมด</h2>
              <p className="text-sm text-muted-foreground">{data.length} รายการ · คลิกที่ข้อมูลเพื่อแก้ไข</p>
            </div>
          </div>
        </div>

        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Database className="mb-3 h-12 w-12 opacity-30" />
            <p className="text-sm">ยังไม่มีข้อมูล — เพิ่มข้อมูลใหม่ได้ที่ฟอร์มด้านบน</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border bg-table-header hover:bg-table-header">
                  {columns.map((col) => (
                    <TableHead
                      key={col.key}
                      className="text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap cursor-pointer select-none hover:text-foreground transition-colors"
                      onClick={() => handleSort(col.key)}
                    >
                      <div className="flex items-center gap-1.5">
                        {col.label}
                        <SortIcon colKey={col.key} />
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((row, i) => (
                  <TableRow
                    key={row.no}
                    className="border-border hover:bg-table-row-hover transition-colors"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    {columns.map((col) => {
                      const value = row[col.key as keyof MarkerData];
                      const editing = isEditing(row.no, col.key);

                      if (editing) {
                        return (
                          <TableCell key={col.key} className="p-1">
                            <div className="flex items-center gap-1">
                              <Input
                                autoFocus
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="h-8 text-sm border-primary bg-secondary/50 text-foreground"
                              />
                              <Button variant="ghost" size="icon" onClick={confirmEdit} className="h-7 w-7 text-primary hover:bg-primary/10">
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={cancelEdit} className="h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        );
                      }

                      // Style based on column
                      let cellClass = "text-foreground cursor-pointer hover:bg-primary/5 rounded transition-colors";
                      if (col.key === "no") cellClass = "font-mono text-primary cursor-pointer hover:bg-primary/5 rounded transition-colors";
                      else if (col.key === "markerName") cellClass = "font-semibold text-foreground cursor-pointer hover:bg-primary/5 rounded transition-colors";
                      else if (["latitude", "longitude", "ellHeight"].includes(col.key)) cellClass = "font-mono text-secondary-foreground cursor-pointer hover:bg-primary/5 rounded transition-colors";

                      if (col.key === "region") {
                        return (
                          <TableCell
                            key={col.key}
                            className="cursor-pointer"
                            onDoubleClick={() => startEdit(row.no, col.key, value)}
                          >
                            <span className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                              {value}
                            </span>
                          </TableCell>
                        );
                      }

                      return (
                        <TableCell
                          key={col.key}
                          className={cellClass}
                          onDoubleClick={() => startEdit(row.no, col.key, value)}
                        >
                          {value}
                        </TableCell>
                      );
                    })}
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(row.no)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarkerTable;
