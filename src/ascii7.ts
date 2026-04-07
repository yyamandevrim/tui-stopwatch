const CLASSIC_GLYPHS: Record<string, string[]> = {
  "0": [" __ ", "|  |", "|  |", "|  |", "|__|"],
  "1": ["    ", "   |", "   |", "   |", "   |"],
  "2": [" __ ", "   |", " __|", "|   ", "|__ "],
  "3": [" __ ", "   |", " __|", "   |", " __|"],
  "4": ["    ", "|  |", "|__|", "   |", "   |"],
  "5": [" __ ", "|   ", "|__ ", "   |", " __|"],
  "6": [" __ ", "|   ", "|__ ", "|  |", "|__|"],
  "7": [" __ ", "   |", "   |", "   |", "   |"],
  "8": [" __ ", "|  |", "|__|", "|  |", "|__|"],
  "9": [" __ ", "|  |", "|__|", "   |", " __|"],
  ":": ["    ", " .. ", "    ", " .. ", "    "],
  ".": ["    ", "    ", "    ", "    ", " .. "],
  " ": ["    ", "    ", "    ", "    ", "    "],
};

const BLOCK_GLYPHS: Record<string, string[]> = {
  "0": [" === ", "|   |", "|   |", "|   |", " === "],
  "1": ["   | ", "   | ", "   | ", "   | ", "   | "],
  "2": [" === ", "    |", " === ", "|    ", " === "],
  "3": [" === ", "    |", " === ", "    |", " === "],
  "4": ["|   |", "|   |", " === ", "    |", "    |"],
  "5": [" === ", "|    ", " === ", "    |", " === "],
  "6": [" === ", "|    ", " === ", "|   |", " === "],
  "7": [" === ", "    |", "    |", "    |", "    |"],
  "8": [" === ", "|   |", " === ", "|   |", " === "],
  "9": [" === ", "|   |", " === ", "    |", " === "],
  ":": ["    ", " .. ", "    ", " .. ", "    "],
  ".": ["    ", "    ", "    ", "    ", " .. "],
  " ": ["    ", "    ", "    ", "    ", "    "],
};

const HEIGHT = 5;

export interface StyledChunk {
  text: string;
  role: "digit" | "separator";
}

function glyphSetForStyle(style: "classic" | "block"): Record<string, string[]> {
  return style === "block" ? BLOCK_GLYPHS : CLASSIC_GLYPHS;
}

export function renderAscii7(text: string, style: "classic" | "block" = "classic"): StyledChunk[][] {
  const rows: StyledChunk[][] = Array.from({ length: HEIGHT }, () => []);
  const glyphs = glyphSetForStyle(style);
  const separatorGap = style === "block" ? "" : " ";

  for (const char of text) {
    const glyph = glyphs[char] ?? glyphs[" "];
    const role: StyledChunk["role"] = char === ":" || char === "." ? "separator" : "digit";

    for (let r = 0; r < HEIGHT; r += 1) {
      rows[r].push({ text: glyph[r], role });
      rows[r].push({ text: separatorGap, role: "digit" });
    }
  }

  return rows;
}
