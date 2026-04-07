function nowNs() {
    return process.hrtime.bigint();
}
export class Stopwatch {
    running = false;
    startedAtNs = null;
    elapsedBeforeNs = 0n;
    lastSplitTotalNs = 0n;
    splits = [];
    isRunning() {
        return this.running;
    }
    toggle() {
        if (this.running) {
            this.pause();
        }
        else {
            this.start();
        }
    }
    start() {
        if (this.running) {
            return;
        }
        this.startedAtNs = nowNs();
        this.running = true;
    }
    pause() {
        if (!this.running || this.startedAtNs === null) {
            return;
        }
        this.elapsedBeforeNs += nowNs() - this.startedAtNs;
        this.startedAtNs = null;
        this.running = false;
    }
    reset() {
        this.running = false;
        this.startedAtNs = null;
        this.elapsedBeforeNs = 0n;
        this.lastSplitTotalNs = 0n;
        this.splits.length = 0;
    }
    elapsedNs() {
        if (!this.running || this.startedAtNs === null) {
            return this.elapsedBeforeNs;
        }
        return this.elapsedBeforeNs + (nowNs() - this.startedAtNs);
    }
    split() {
        if (!this.running) {
            return null;
        }
        const totalNs = this.elapsedNs();
        const deltaNs = totalNs - this.lastSplitTotalNs;
        const entry = {
            index: this.splits.length + 1,
            deltaNs,
            totalNs,
        };
        this.lastSplitTotalNs = totalNs;
        this.splits.push(entry);
        return entry;
    }
    getSplits() {
        return [...this.splits];
    }
}
