import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { AppConfig } from "./types.js";

export const DEFAULT_CONFIG: AppConfig = {
  colors: {
    display: "green",
    separator: "brightblack",
    accent: "cyan",
    splitLabel: "yellow",
    splitValue: "white",
    hint: "magenta",
    status: "blue",
  },
  layout: {
    paddingX: 1,
    paddingY: 1,
    showBorder: true,
    maxSplits: 12,
    displayStyle: "classic",
  },
  keys: {
    startPause: ["space", "o"],
    split: ["p"],
    export: ["e"],
    quit: ["q", "C-c"],
  },
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function mergeConfig(input: unknown): AppConfig {
  if (!isObject(input)) {
    return DEFAULT_CONFIG;
  }

  const next = structuredClone(DEFAULT_CONFIG);

  if (isObject(input.colors)) {
    for (const key of Object.keys(next.colors) as Array<keyof AppConfig["colors"]>) {
      const v = input.colors[key];
      if (typeof v === "string" && v.trim().length > 0) {
        next.colors[key] = v;
      }
    }
  }

  if (isObject(input.layout)) {
    const numericLayoutKeys: Array<"paddingX" | "paddingY" | "maxSplits"> = ["paddingX", "paddingY", "maxSplits"];
    for (const key of numericLayoutKeys) {
      const v = input.layout[key];
      if (typeof v === "number" && Number.isFinite(v)) {
        next.layout[key] = Math.max(0, Math.floor(v));
      }
    }

    const displayStyle = input.layout.displayStyle;
    if (displayStyle === "classic" || displayStyle === "block") {
      next.layout.displayStyle = displayStyle;
    }

    const showBorder = input.layout.showBorder;
    if (typeof showBorder === "boolean") {
      next.layout.showBorder = showBorder;
    }
  }

  if (isObject(input.keys)) {
    for (const key of Object.keys(next.keys) as Array<keyof AppConfig["keys"]>) {
      const v = input.keys[key];
      if (Array.isArray(v)) {
        const values = v.filter((x): x is string => typeof x === "string" && x.length > 0);
        if (values.length > 0) {
          next.keys[key] = values;
        }
      }
    }
  }

  return next;
}

export function loadConfig(cwd: string = process.cwd()): { config: AppConfig; warning: string | null } {
  const configPath = join(cwd, ".stopwatchrc.json");
  if (!existsSync(configPath)) {
    return { config: DEFAULT_CONFIG, warning: null };
  }

  try {
    const raw = readFileSync(configPath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return { config: mergeConfig(parsed), warning: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      config: DEFAULT_CONFIG,
      warning: `Invalid .stopwatchrc.json, using defaults: ${message}`,
    };
  }
}
