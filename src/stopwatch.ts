import { SplitEntry } from "./types.js";

function nowNs(): bigint {
  return process.hrtime.bigint();
}

export class Stopwatch {
  private running = false;
  private startedAtNs: bigint | null = null;
  private elapsedBeforeNs = 0n;
  private lastSplitTotalNs = 0n;
  private readonly splits: SplitEntry[] = [];

  public isRunning(): boolean {
    return this.running;
  }

  public toggle(): void {
    if (this.running) {
      this.pause();
    } else {
      this.start();
    }
  }

  public start(): void {
    if (this.running) {
      return;
    }
    this.startedAtNs = nowNs();
    this.running = true;
  }

  public pause(): void {
    if (!this.running || this.startedAtNs === null) {
      return;
    }
    this.elapsedBeforeNs += nowNs() - this.startedAtNs;
    this.startedAtNs = null;
    this.running = false;
  }

  public reset(): void {
    this.running = false;
    this.startedAtNs = null;
    this.elapsedBeforeNs = 0n;
    this.lastSplitTotalNs = 0n;
    this.splits.length = 0;
  }

  public elapsedNs(): bigint {
    if (!this.running || this.startedAtNs === null) {
      return this.elapsedBeforeNs;
    }
    return this.elapsedBeforeNs + (nowNs() - this.startedAtNs);
  }

  public split(): SplitEntry | null {
    if (!this.running) {
      return null;
    }

    const totalNs = this.elapsedNs();
    const deltaNs = totalNs - this.lastSplitTotalNs;
    const entry: SplitEntry = {
      index: this.splits.length + 1,
      deltaNs,
      totalNs,
    };

    this.lastSplitTotalNs = totalNs;
    this.splits.push(entry);
    return entry;
  }

  public getSplits(): SplitEntry[] {
    return [...this.splits];
  }
}
