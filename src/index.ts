import blessed from "blessed";
import { renderAscii7 } from "./ascii7.js";
import { loadConfig } from "./config.js";
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
      fg: config.colors.display,
      border: { fg: config.colors.accent },
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
      fg: config.colors.splitValue,
      border: { fg: config.colors.accent },
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
    style: { fg: config.colors.hint },
  });

  screen.append(displayBox);
  screen.append(splitBox);
  screen.append(helpBox);

  const setStatusMessage = (message: string | null): void => {
    statusMessage = message;
  };

  const render = (): void => {
    const clockText = formatClockFromNs(stopwatch.elapsedNs());
    displayBox.setContent(makeClockContent(clockText, config));

    const status = stopwatch.isRunning() ? "RUNNING" : "PAUSED";

    const help = [
      "space/o:toggle",
      "p:split",
      "e:export",
      "r:reset",
      "q:quit",
      `state:${status}`,
    ].join("  |  ");
    helpBox.setContent(statusMessage ? `${help}  |  ${statusMessage}` : help);

    const splits = stopwatch.getSplits();
    const max = Math.max(1, config.layout.maxSplits);
    const visible = splits.slice(-max).reverse();

    const lines = visible.map((s) => {
      const label = `Lap ${String(s.index).padStart(2, "0")}`;
      const delta = `+${formatSplitFromNs(s.deltaNs)}`;
      const total = formatSplitFromNs(s.totalNs);
      return `${label.padEnd(8, " ")}  delta ${delta}  total ${total}`;
    });

    const splitHeader = "#        DELTA        TOTAL";
    splitBox.setContent(lines.length ? `${splitHeader}\n${lines.join("\n")}` : "No splits yet. Press p while running.");

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
  });
  bind(config.keys.export, () => {
    void runExport();
  });
  bind(["r"], () => stopwatch.reset());
  bind(config.keys.quit, handleExit);
  screen.on("resize", () => {
    render();
    screen.render();
  });

  render();
  screen.render();
}
