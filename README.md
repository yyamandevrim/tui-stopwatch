# TUI Stopwatch

A terminal stopwatch with a 7-segment ASCII display in `HH:MM:SS.CC` format.

## Install

Run directly with npx:

```bash
npx tui-stopwatch
```

Install globally:

```bash
npm install -g tui-stopwatch
tui-stopwatch
```

## Features

- Responsive terminal UI (adapts to window size)
- 7-segment ASCII-style time display
- Start/pause keys: `space` and `o`
- Split key: `p` (stores lap delta + total elapsed)
- Export key: `e` (writes TXT, CSV, JSON files to `exports/`)
- Reset key: `r`
- Quit keys: `q` and `Ctrl+C`
- Project-local config in `.stopwatchrc.json`

## Quick Start

```bash
npm install
npm run dev
```

Build and run compiled output:

```bash
npm run build
npm start
```

Create a package tarball preview:

```bash
npm pack --dry-run
```
```

## Config

Edit `.stopwatchrc.json` to change colors, key bindings, and layout values.

Example:

```json
{
  "colors": {
    "display": "green",
    "separator": "brightBlack",
    "accent": "cyan",
    "splitLabel": "yellow",
    "splitValue": "white",
    "hint": "magenta",
    "status": "blue"
  },
  "layout": {
    "paddingX": 1,
    "paddingY": 1,
    "showBorder": true,
    "maxSplits": 12,
    "displayStyle": "block"
  },
  "keys": {
    "startPause": ["space", "o"],
    "split": ["p"],
    "export": ["e"],
    "quit": ["q", "C-c"]
  }
}
```

Notes:
- Color values are terminal color names supported by Blessed.
- If config is invalid, defaults are used and a warning is shown in-app.
- `layout.displayStyle` supports `classic` and `block`.
