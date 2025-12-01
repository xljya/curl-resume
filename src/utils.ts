// src/utils.ts
// 工具函数

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const encoder = new TextEncoder();

// 获取随机字符 (用于解密效果)
export const getRandomChar = (): string => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*";
  return chars[Math.floor(Math.random() * chars.length)];
};

// ANSI 转义码
export const ANSI = {
  // 控制
  reset: "\x1b[0m",
  clear: "\x1b[2J\x1b[0;0H", // 清屏并移动光标到左上角
  clearLine: "\r\x1b[K", // 清除当前行
  hideCursor: "\x1b[?25l",
  showCursor: "\x1b[?25h",
  cursorUp: (n = 1): string => `\x1b[${n}A`,
  cursorDown: (n = 1): string => `\x1b[${n}B`,
  cursorLeft: (n = 1): string => `\x1b[${n}D`,
  cursorRight: (n = 1): string => `\x1b[${n}C`,
  cursorTo: (x: number, y: number): string => `\x1b[${y};${x}H`,

  // 样式
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  italic: "\x1b[3m",
  underline: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",

  // 颜色 (Standard)
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",

  // 颜色 (Bright / High Intensity)
  brightBlack: "\x1b[90m", // Gray
  brightRed: "\x1b[91m",
  brightGreen: "\x1b[92m",
  brightYellow: "\x1b[93m",
  brightBlue: "\x1b[94m",
  brightMagenta: "\x1b[95m",
  brightCyan: "\x1b[96m",
  brightWhite: "\x1b[97m",

  // 背景颜色
  bgBlack: "\x1b[40m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  bgWhite: "\x1b[47m",

  // 渐变色预设 (简单的彩虹色序列)
  rainbowColors: [
    "\x1b[91m", // Red
    "\x1b[93m", // Yellow
    "\x1b[92m", // Green
    "\x1b[96m", // Cyan
    "\x1b[94m", // Blue
    "\x1b[95m", // Magenta
  ],

  // 256 色
  color256: (code: number): string => `\x1b[38;5;${code}m`,
  bgColor256: (code: number): string => `\x1b[48;5;${code}m`,

  // RGB 真彩色
  rgb: (r: number, g: number, b: number): string =>
    `\x1b[38;2;${r};${g};${b}m`,
  bgRgb: (r: number, g: number, b: number): string =>
    `\x1b[48;2;${r};${g};${b}m`,
} as const;

export default { sleep, encoder, getRandomChar, ANSI };
