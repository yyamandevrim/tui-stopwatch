export function nsToCentiseconds(ns) {
    return Number(ns / 10000000n);
}
export function formatClockFromNs(ns) {
    const totalCs = nsToCentiseconds(ns);
    const hours = Math.floor(totalCs / 360000);
    const minutes = Math.floor((totalCs % 360000) / 6000);
    const seconds = Math.floor((totalCs % 6000) / 100);
    const centiseconds = totalCs % 100;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
}
export function formatSplitFromNs(ns) {
    return formatClockFromNs(ns);
}
