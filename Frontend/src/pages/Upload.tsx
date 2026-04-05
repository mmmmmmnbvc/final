import { useEffect, useState } from "react";
import { MarkerData } from "@/types/marker";
import MarkerForm from "@/components/MarkerForm";
import MarkerTable from "@/components/MarkerTable";
import { MapPin } from "lucide-react";
import { supabase } from "@/supabaseClient";



const Upload = () => {
  const [data, setData] = useState<MarkerData[]>([]);
useEffect(() => {
  fetchData();
}, []);

const fetchData = async () => {
  const { data, error } = await supabase
    .from("G")
    .select("*")
    .order("No", { ascending: true });

  if (error) {
    console.error(error);
  } else if (data) {
    const mapped = data.map((d) => ({
      no: d.No,
      markerName: d.MARKER_NAM,
      latitude: d.LATITUDE,
      longitude: d.LONGITUDE,
      ellHeight: d.ELL_Height,
      province: d.PROVINCE,
      region: d.REGION,
      provinceTh: d.PROVINCE_TH,
    }));

    setData(mapped);
  }
};
const handleAdd = async (newItem: MarkerData) => {
  const { error } = await supabase.from("G").insert([
    {
      No: newItem.no,
      MARKER_NAM: newItem.markerName,
      LATITUDE: newItem.latitude,
      LONGITUDE: newItem.longitude,
      ELL_Height: newItem.ellHeight,
      PROVINCE: newItem.province,
      REGION: newItem.region,
      PROVINCE_TH: newItem.provinceTh,
    },
  ]);

  if (!error) {
    fetchData();
  } else {
    console.error(error);
  }
};

const handleDelete = async (no: number) => {
  const { error } = await supabase
    .from("G")
    .delete()
    .eq("No", no);

  if (!error) {
    fetchData();
  }
};

const handleUpdate = async (
  no: number,
  field: string,
  value: string | number
) => {
  const columnMap: any = {
    markerName: "MARKER_NAM",
    latitude: "LATITUDE",
    longitude: "LONGITUDE",
    ellHeight: "ELL_Height",
    province: "PROVINCE",
    region: "REGION",
    provinceTh: "PROVINCE_TH",
  };

  const { error } = await supabase
    .from("G")
    .update({ [columnMap[field]]: value })
    .eq("No", no);

  if (!error) {
    fetchData();
  }
};

  const nextNo = data.length > 0 ? Math.max(...data.map((d) => d.no)) + 1 : 1;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex items-center gap-3 px-6 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">GNSS  Marker Manager</h1>
            <p className="text-xs text-muted-foreground">ระบบจัดการข้อมูล GNSS</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto space-y-6 px-6 py-8">
        <MarkerForm onAdd={handleAdd} nextNo={nextNo} />
        <MarkerTable data={data} onDelete={handleDelete} onUpdate={handleUpdate} />
      </main>
    </div>
  );
};

export default Upload;
