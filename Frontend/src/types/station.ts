// Types for Station-related components

export interface CsvRow {
  time: string;
  sv: string;

  C1C?: number | string;
  L1C?: number | string;
  S1C?: number | string;

  C1X?: number | string;
  L1X?: number | string;
  S1X?: number | string;

  C2W?: number | string;
  S2W?: number | string;

  C5X?: number | string;
  S5X?: number | string;

  [key: string]: number | string | null | undefined;
}

export interface SvMetrics {
  tsec: number[];
  C1: (number | null)[];
  S1: (number | null)[];
  P2: (number | null)[];
  S2: (number | null)[];
  C2: (number | null)[];
  C5: (number | null)[];
  S5: (number | null)[];
  L1: (number | null)[];
  doppler: (number | null)[];
  residual: (number | null)[];
  lock: number[];
}

export interface GroupedData {
  [group: string]: {
    [SV: string]: SvMetrics;
  };
}

export interface StationData {
  MARKER_NAM: string;
  REGION: string;
  LATITUDE: number;
  LONGITUDE: number;
  ELL_Height: number;
  PROVINCE_TH?: string;
  [key: string]: unknown;
}

export interface PanelVisibility {
  skyplot: boolean;
  info: boolean;
  snr: boolean;
  america: boolean;
  russia: boolean;
  europe: boolean;
  dataerror: boolean;
  table: boolean;
}
