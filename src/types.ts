export interface SplitEntry {
  index: number;
  deltaNs: bigint;
  totalNs: bigint;
}

export interface ColorConfig {
  display: string;
  separator: string;
  accent: string;
  splitLabel: string;
  splitValue: string;
  hint: string;
  status: string;
}

export interface LayoutConfig {
  paddingX: number;
  paddingY: number;
  showBorder: boolean;
  maxSplits: number;
  displayStyle: "classic" | "block";
}

export interface KeyConfig {
  startPause: string[];
  split: string[];
  quit: string[];
}

export interface AppConfig {
  colors: ColorConfig;
  layout: LayoutConfig;
  keys: KeyConfig;
}
