import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MarkerData } from "@/types/marker";
import { Plus, RotateCcw } from "lucide-react";

interface MarkerFormProps {
  onAdd: (data: MarkerData) => void;
  nextNo: number;
}

const initialForm = {
  markerName: "",
  latitude: "",
  longitude: "",
  ellHeight: "",
  province: "",
  region: "",
  provinceTh: "",
};

const MarkerForm = ({ onAdd, nextNo }: MarkerFormProps) => {
  const [form, setForm] = useState(initialForm);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.markerName) return;
    onAdd({
      no: nextNo,
      ...form,
    });
    setForm(initialForm);
  };

  const handleReset = () => setForm(initialForm);

  const fields = [
    { key: "markerName", label: "Marker Name", placeholder: "e.g. ANGT", type: "text" },
    { key: "latitude", label: "Latitude", placeholder: "e.g. 14.59061155", type: "number" },
    { key: "longitude", label: "Longitude", placeholder: "e.g. 100.4553187", type: "number" },
    { key: "ellHeight", label: "ELL Height", placeholder: "e.g. -19.6093", type: "number" },
    { key: "province", label: "Province", placeholder: "e.g. Ang Thong", type: "text" },
    { key: "region", label: "Region", placeholder: "e.g. CT01", type: "text" },
    { key: "provinceTh", label: "จังหวัด (TH)", placeholder: "e.g. อ่างทอง", type: "text" },
  ];

  return (
    <form onSubmit={handleSubmit} className="animate-fade-in">
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Plus className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">เพิ่มข้อมูล Marker</h2>
            <p className="text-sm text-muted-foreground">กรอกข้อมูลเพื่อเพิ่มจุดสำรวจใหม่</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">No.</Label>
            <Input
              value={nextNo}
              disabled
              className="bg-muted/50 text-muted-foreground border-border"
            />
          </div>

          {fields.map((f) => (
            <div key={f.key} className="space-y-2">
              <Label className="text-sm text-muted-foreground">{f.label}</Label>
              <Input
                type={f.type === "number" ? "text" : "text"}
                inputMode={f.type === "number" ? "decimal" : "text"}
                placeholder={f.placeholder}
                value={form[f.key as keyof typeof form]}
                onChange={(e) => handleChange(f.key, e.target.value)}
                className="border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-primary/20 transition-colors"
              />
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all">
            <Plus className="mr-2 h-4 w-4" />
            เพิ่มข้อมูล
          </Button>
          <Button type="button" variant="outline" onClick={handleReset} className="border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
            <RotateCcw className="mr-2 h-4 w-4" />
            ล้างฟอร์ม
          </Button>
        </div>
      </div>
    </form>
  );
};

export default MarkerForm;
