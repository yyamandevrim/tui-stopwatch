import blessed from "blessed";
import { renderAscii7 } from "./ascii7.js";
import { AVAILABLE_THEMES, loadConfig, resolveThemeColors } from "./config.js";
import { formatClockFromNs, formatSplitFromNs } from "./formatter.js";
import { exportSplits } from "./exporter.js";
import { Stopwatch } from "./stopwatch.js";
import { AppConfig } from "./types.js";

function makeClockContent(clockText: string, config: AppConfig): string {
  const rows = renderAscii7(clockText, config.layout.displayStyle);
  return rows
    .map((row) => row.map((chunk) => chunk.text).join(""))
    .join("\n");
}

export function run(): void {
  const { config, warning } = loadConfig();
  const stopwatch = new Stopwatch();
  let statusMessage: string | null = warning ?? null;
  let selectedSplitIndex = 0;
  let currentThemeIndex = Math.max(0, AVAILABLE_THEMES.indexOf(config.theme));
  let currentColors = config.colors;

  const screen = blessed.screen({
    smartCSR: true,
    fullUnicode: false,
    title: "TUI Stopwatch",
    dockBorders: true,
  });

  const displayBox = blessed.box({
    top: 0,
    left: 0,
    width: "100%",
    height: "68%",
    tags: true,
    parseTags: true,
    align: "center",
    valign: "middle",
    content: "",
    border: config.layout.showBorder ? "line" : undefined,
    style: {
      fg: currentColors.display,
      border: { fg: currentColors.accent },
    },
    padding: {
      left: config.layout.paddingX,
      right: config.layout.paddingX,
      top: config.layout.paddingY,
      bottom: config.layout.paddingY,
    },
    label: " Stopwatch ",
  });

  const splitBox = blessed.box({
    top: "68%",
    left: 0,
    width: "100%",
    height: "26%-1",
    tags: true,
    parseTags: true,
    scrollable: true,
    alwaysScroll: true,
    mouse: true,
    keys: true,
    vi: true,
    border: config.layout.showBorder ? "line" : undefined,
    style: {
      fg: currentColors.splitValue,
      border: { fg: currentColors.accent },
    },
    label: " Splits ",
  });

  const helpBox = blessed.box({
    bottom: 0,
    left: 0,
    width: "100%",
    height: 1,
    tags: true,
    parseTags: true,
    content: "",
    style: { fg: currentColors.hint },
  });

  screen.append(displayBox);
  screen.append(splitBox);
  screen.append(helpBox);

  const setStatusMessage = (message: string | null): void => {
    statusMessage = message;
  };

  const applyTheme = (): void => {
    displayBox.style.fg = currentColors.display;
    displayBox.style.border = { fg: currentColors.accent };
    splitBox.style.fg = currentColors.splitValue;
    splitBox.style.border = { fg: currentColors.accent };
    helpBox.style.fg = currentColors.hint;
  };

  const cycleTheme = (): void => {
    currentThemeIndex = (currentThemeIndex + 1) % AVAILABLE_THEMES.length;
    currentColors = resolveThemeColors(AVAILABLE_THEMES[currentThemeIndex]);
    applyTheme();
    setStatusMessage(`theme: ${AVAILABLE_THEMES[currentThemeIndex]}`);
  };

  const render = (): void => {
    const clockText = formatClockFromNs(stopwatch.elapsedNs());
    displayBox.setContent(makeClockContent(clockText, config));

    const status = stopwatch.isRunning() ? "RUNNING" : "PAUSED";

    const help = [
      "space/o:toggle",
      "p:split",
      "e:export",
      "t:theme",
      "up/down,j/k:scroll",
      "r:reset",
      "q:quit",
      `state:${status}`,
    ].join("  |  ");
    helpBox.setContent(statusMessage ? `${help}  |  ${statusMessage}` : help);

    const splits = stopwatch.getSplits();
    const max = Math.max(1, config.layout.maxSplits);
    if (splits.length === 0) {
      selectedSplitIndex = 0;
      splitBox.setContent("No splits yet. Press p while running.");
    } else {
      selectedSplitIndex = Math.min(selectedSplitIndex, splits.length - 1);
      const viewport = Math.min(max, splits.length);
      const maxStart = Math.max(0, splits.length - viewport);
      const idealStart = selectedSplitIndex - Math.floor(viewport / 2);
      const start = Math.min(Math.max(0, idealStart), maxStart);
      const end = start + viewport;

      const lines = splits.slice(start, end).map((split, index) => {
        const absoluteIndex = start + index;
        const selected = absoluteIndex === selectedSplitIndex;
        const label = `Lap ${String(split.index).padStart(2, "0")}`;
        const delta = `+${formatSplitFromNs(split.deltaNs)}`;
        const total = formatSplitFromNs(split.totalNs);
        const line = `${label.padEnd(8, " ")}  delta ${delta}  total ${total}`;
        return selected ? `{inverse}${line}{/inverse}` : line;
      });

      const header = `Splits ${selectedSplitIndex + 1}/${splits.length}`;
      splitBox.setContent(`${header}\n#        DELTA        TOTAL\n${lines.join("\n")}`);
    }

    if (screen.rows < 16) {
      splitBox.hide();
      displayBox.height = "100%-1";
    } else {
      splitBox.show();
      displayBox.height = "68%";
    }

    screen.render();
  };

  const tick = setInterval(render, 30);

  const handleExit = (): void => {
    clearInterval(tick);
    screen.destroy();
    process.exit(0);
  };

  const bind = (keys: string[], fn: () => void): void => {
    screen.key(keys, () => {
      fn();
      render();
      screen.render();
    });
  };

  const moveSelection = (delta: number): void => {
    const splits = stopwatch.getSplits();
    if (splits.length === 0) {
      selectedSplitIndex = 0;
      return;
    }

    selectedSplitIndex = Math.max(0, Math.min(splits.length - 1, selectedSplitIndex + delta));
  };

  const runExport = async (): Promise<void> => {
    setStatusMessage("exporting splits...");
    render();
    screen.render();

    try {
      const result = await exportSplits(stopwatch.getSplits());
      setStatusMessage(`exported to ${result.directory}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatusMessage(`export failed: ${message}`);
    }

    render();
    screen.render();
  };

  bind(config.keys.startPause, () => stopwatch.toggle());
  bind(config.keys.split, () => {
    stopwatch.split();
    selectedSplitIndex = 0;
  });
  bind(config.keys.export, () => {
    void runExport();
  });
  bind(["t"], () => {
    cycleTheme();
  });
  bind(["up", "k"], () => moveSelection(1));
  bind(["down", "j"], () => moveSelection(-1));
  bind(["pageup"], () => moveSelection(5));
  bind(["pagedown"], () => moveSelection(-5));
  bind(["home"], () => {
    selectedSplitIndex = stopwatch.getSplits().length > 0 ? stopwatch.getSplits().length - 1 : 0;
  });
  bind(["end"], () => {
    selectedSplitIndex = 0;
  });
  bind(["r"], () => {
    stopwatch.reset();
    selectedSplitIndex = 0;
  });
  bind(config.keys.quit, handleExit);
  screen.on("resize", () => {
    render();
    screen.render();
  });

  render();
  screen.render();
}
