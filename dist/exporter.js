import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { formatSplitFromNs } from "./formatter.js";
function formatTimestamp(date) {
    const pad = (value) => String(value).padStart(2, "0");
    return [
        date.getFullYear(),
        pad(date.getMonth() + 1),
        pad(date.getDate()),
        "-",
        pad(date.getHours()),
        pad(date.getMinutes()),
        pad(date.getSeconds()),
    ].join("");
}
function splitToJsonEntry(split) {
    return {
        index: split.index,
        delta: formatSplitFromNs(split.deltaNs),
        total: formatSplitFromNs(split.totalNs),
        deltaNs: split.deltaNs.toString(),
        totalNs: split.totalNs.toString(),
    };
}
function buildCsv(splits) {
    const header = "index,delta,total,deltaNs,totalNs";
    const rows = splits.map((split) => {
        const entry = splitToJsonEntry(split);
        return [entry.index, entry.delta, entry.total, entry.deltaNs, entry.totalNs]
            .map((value) => `"${String(value).replaceAll('"', '""')}"`)
            .join(",");
    });
    return [header, ...rows].join("\n");
}
function buildTxt(splits) {
    if (splits.length === 0) {
        return "No splits recorded.";
    }
    return splits
        .map((split) => {
        const index = String(split.index).padStart(2, "0");
        return `Lap ${index}  delta ${formatSplitFromNs(split.deltaNs)}  total ${formatSplitFromNs(split.totalNs)}`;
    })
        .join("\n");
}
export async function exportSplits(splits, cwd = process.cwd()) {
    const directory = join(cwd, "exports");
    await mkdir(directory, { recursive: true });
    const stamp = formatTimestamp(new Date());
    const baseName = `tui-stopwatch-splits-${stamp}`;
    const files = [
        join(directory, `${baseName}.txt`),
        join(directory, `${baseName}.csv`),
        join(directory, `${baseName}.json`),
    ];
    await Promise.all([
        writeFile(files[0], `${buildTxt(splits)}\n`, "utf8"),
        writeFile(files[1], `${buildCsv(splits)}\n`, "utf8"),
        writeFile(files[2], `${JSON.stringify({ exportedAt: new Date().toISOString(), splits: splits.map(splitToJsonEntry) }, null, 2)}\n`, "utf8"),
    ]);
    return {
        directory,
        files,
    };
}
