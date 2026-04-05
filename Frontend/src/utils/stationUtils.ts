import Plotly from "plotly.js-dist-min";
import { CsvRow, SvMetrics, GroupedData } from "@/types/station";

// Helper functions
export const toNum = (v: string | number | null): number | null => {
  const n = parseFloat(v as string);
  return isNaN(n) ? null : n;
};

export const pick = (row: CsvRow, keys: string[]): number | null => {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null && v !== "") {
      const n = parseFloat(v as string);
      if (!isNaN(n)) return n;
    }
  }
  return null;
};

export const rollingMedian = (arr: (number | null)[], window: number): (number | null)[] => {
  const out: (number | null)[] = Array(arr.length).fill(null);
  const w = Math.max(1, window | 0);
  for (let i = 0; i < arr.length; i++) {
    const start = Math.max(0, i - Math.floor(w / 2));
    const end = Math.min(arr.length, start + w);
    const slice = arr.slice(start, end).filter((x): x is number => x !== null);
    if (slice.length > 0) {
      const sorted = slice.slice().sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      out[i] = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }
  }
  return out;
};

export const getEpochRows = (data: CsvRow[], index: number): CsvRow[] => {
  const base = data[index];
  if (!base) return [];

  const t = new Date(base.time).getTime();

  return data.filter((r) => {
    const rt = new Date(r.time).getTime();
    return rt === t;
  });
};

export const computeMetrics = (data: CsvRow[]): GroupedData => {
  const groups: GroupedData = {};
  let t0: number | null = null;

  data.forEach((r) => {
    if (t0 === null) {
      const dt = new Date(r.time + "Z").getTime();
      if (!isNaN(dt)) t0 = dt / 1000;
    }
  });

  if (t0 === null) t0 = 0;

  data.forEach((r, idx) => {
    const SV = (r.sv || "").toString().trim();
    if (!SV) return;

    const grp = SV.charAt(0);

    let tsec: number;
    const dt = new Date(r.time + "Z").getTime();
    if (!isNaN(dt)) tsec = dt / 1000 - t0!;
    else tsec = idx;

    if (!groups[grp]) groups[grp] = {};

    if (!groups[grp][SV]) {
      groups[grp][SV] = {
        tsec: [],
        C1: [],
        S1: [],
        P2: [],
        S2: [],
        C2: [],
        C5: [],
        S5: [],
        L1: [],
        doppler: [],
        residual: [],
        lock: [],
      };
    }

    const s = groups[grp][SV];

    // เลือก signal หลัก
    const C1 = pick(r, ["C1C", "C1X"]);
    const L1 = pick(r, ["L1C", "L1X"]);
    const S1 = pick(r, ["S1C", "S1X"]);

    const C2 = pick(r, ["C2W", "C2X"]);
    const S2 = pick(r, ["S2W", "S2X"]);

    const C5 = pick(r, ["C5X"]);
    const S5 = pick(r, ["S5X"]);

    s.tsec.push(tsec);
    s.C1.push(C1);
    s.S1.push(S1);
    s.P2.push(C2);
    s.S2.push(S2);
    s.C2.push(C2);
    s.C5.push(C5);
    s.S5.push(S5);
    s.L1.push(L1);
  });

  // Doppler
  for (const grp in groups) {
    for (const SV in groups[grp]) {
      const s = groups[grp][SV];

      s.doppler = Array(s.L1.length).fill(null);

      for (let i = 1; i < s.C1.length; i++) {
        const c1a = s.L1[i - 1];
        const c1b = s.L1[i];
        const ta = s.tsec[i - 1];
        const tb = s.tsec[i];

        if (c1a !== null && c1b !== null && tb > ta)
          s.doppler[i] = -(c1b - c1a) / (tb - ta);
      }

      // residual (epoch-based)
      for (let i = 0; i < s.L1.length; i++) {
        const epochValues: number[] = [];

        // หา L1 ของทุก SV ใน epoch เดียวกัน
        for (const g in groups) {
          for (const sv in groups[g]) {
            const val = groups[g][sv].L1[i];
            if (val !== null && val !== undefined) {
              epochValues.push(val);
            }
          }
        }

        if (epochValues.length === 0) continue;

        const mean =
          epochValues.reduce((a, b) => a + b, 0) / epochValues.length;

        if (s.L1[i] !== null) {
          s.residual[i] = s.L1[i]! - mean;
        }
      }

      // lock time
      s.lock = Array(s.tsec.length).fill(0);

      let start: number | null = null;

      for (let i = 0; i < s.tsec.length; i++) {
        const valid = s.C1[i] !== null || s.L1[i] !== null;

        if (valid) {
          if (start === null) start = s.tsec[i];
          s.lock[i] = s.tsec[i] - start;
        } else {
          start = null;
        }
      }
    }
  }

  return groups;
};
