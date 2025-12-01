// src/imageToAscii.ts
// 图片转 ASCII 模块 - 使用纯 Web API 兼容库

// @ts-ignore
import UPNG from "upng-js";
import * as jpeg from "jpeg-js";
// @ts-ignore
import decodeGif from "decode-gif";
import type { AsciiResult, AsciiFrame } from "./types";
import { ANSI } from "./utils";

// ASCII 字符集 (从暗到亮)
const ASCII_CHARS = " .:-=+*#%@";
const ASCII_CHARS_DETAILED =
  " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";

/**
 * RGB 转灰度
 */
function rgbToGray(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * 灰度转 ASCII 字符
 */
function grayToChar(gray: number, detailed = false): string {
  const chars = detailed ? ASCII_CHARS_DETAILED : ASCII_CHARS;
  const index = Math.floor((gray / 255) * (chars.length - 1));
  return chars[index];
}

/**
 * RGB 转 ANSI 真彩色 (24-bit)
 */
function rgbToAnsiTrueColor(r: number, g: number, b: number, type: 'fg' | 'bg' = 'fg'): string {
  return type === 'fg'
    ? `\x1b[38;2;${r};${g};${b}m`
    : `\x1b[48;2;${r};${g};${b}m`;
}

/**
 * RGB 转 ANSI 256 色
 */
function rgbToAnsi256(r: number, g: number, b: number, type: 'fg' | 'bg' = 'fg'): string {
  let code: number;
  if (r === g && g === b) {
    if (r < 8) code = 16;
    else if (r > 248) code = 231;
    else code = Math.round(((r - 8) / 247) * 24) + 232;
  } else {
    const ri = Math.round(r / 51);
    const gi = Math.round(g / 51);
    const bi = Math.round(b / 51);
    code = 16 + 36 * ri + 6 * gi + bi;
  }
  return type === 'fg' ? `\x1b[38;5;${code}m` : `\x1b[48;5;${code}m`;
}

interface RenderOptions {
  width?: number;
  height?: number;
  targetWidth?: number;
  targetHeight?: number;
  colored?: boolean;
  detailed?: boolean;
  trueColor?: boolean;
}

interface ImageData {
  width: number;
  height: number;
  data: Uint8Array;
}

/**
 * 双线性插值缩放图片
 */
function resizeImage(
  src: ImageData,
  targetWidth: number,
  targetHeight: number
): ImageData {
  const dst = new Uint8Array(targetWidth * targetHeight * 4);
  const xRatio = src.width / targetWidth;
  const yRatio = src.height / targetHeight;

  for (let y = 0; y < targetHeight; y++) {
    for (let x = 0; x < targetWidth; x++) {
      const srcX = x * xRatio;
      const srcY = y * yRatio;

      const x1 = Math.floor(srcX);
      const y1 = Math.floor(srcY);
      const x2 = Math.min(x1 + 1, src.width - 1);
      const y2 = Math.min(y1 + 1, src.height - 1);

      const xFrac = srcX - x1;
      const yFrac = srcY - y1;

      const dstIdx = (y * targetWidth + x) * 4;

      for (let c = 0; c < 4; c++) {
        const tl = src.data[(y1 * src.width + x1) * 4 + c];
        const tr = src.data[(y1 * src.width + x2) * 4 + c];
        const bl = src.data[(y2 * src.width + x1) * 4 + c];
        const br = src.data[(y2 * src.width + x2) * 4 + c];

        const top = tl + (tr - tl) * xFrac;
        const bottom = bl + (br - bl) * xFrac;
        dst[dstIdx + c] = Math.round(top + (bottom - top) * yFrac);
      }
    }
  }

  return { width: targetWidth, height: targetHeight, data: dst };
}

/**
 * 使用 Half-Block (▀) 技术渲染
 */
function renderHalfBlock(
  pixels: Uint8Array,
  width: number,
  height: number,
  trueColor: boolean
): string {
  let output = "";

  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x++) {
      const idx1 = (y * width + x) * 4;
      const r1 = pixels[idx1];
      const g1 = pixels[idx1 + 1];
      const b1 = pixels[idx1 + 2];
      const a1 = pixels[idx1 + 3];

      const idx2 = ((y + 1) * width + x) * 4;
      const hasBottom = y + 1 < height;
      const r2 = hasBottom ? pixels[idx2] : 0;
      const g2 = hasBottom ? pixels[idx2 + 1] : 0;
      const b2 = hasBottom ? pixels[idx2 + 2] : 0;
      const a2 = hasBottom ? pixels[idx2 + 3] : 0;

      if (a1 < 128 && a2 < 128) {
        output += `${ANSI.reset} `;
        continue;
      }

      if (trueColor) {
        const fg = a1 >= 128 ? rgbToAnsiTrueColor(r1, g1, b1, 'fg') : '\x1b[39m';
        const bg = a2 >= 128 ? rgbToAnsiTrueColor(r2, g2, b2, 'bg') : '\x1b[49m';
        output += `${fg}${bg}▀`;
      } else {
        const fg = a1 >= 128 ? rgbToAnsi256(r1, g1, b1, 'fg') : '\x1b[39m';
        const bg = a2 >= 128 ? rgbToAnsi256(r2, g2, b2, 'bg') : '\x1b[49m';
        output += `${fg}${bg}▀`;
      }
    }
    output += `${ANSI.reset}\n`;
  }
  return output;
}

/**
 * 标准字符渲染
 */
function renderChar(
  pixels: Uint8Array,
  width: number,
  height: number,
  detailed: boolean
): string {
  let output = "";
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];
      const a = pixels[idx + 3];

      if (a < 128) {
        output += " ";
        continue;
      }

      const gray = rgbToGray(r, g, b);
      output += grayToChar(gray, detailed);
    }
    output += "\n";
  }
  return output;
}

/**
 * 检测图片格式
 */
function detectFormat(data: Uint8Array): 'png' | 'jpeg' | 'gif' | 'unknown' {
  // PNG: 89 50 4E 47
  if (data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4E && data[3] === 0x47) {
    return 'png';
  }
  // JPEG: FF D8 FF
  if (data[0] === 0xFF && data[1] === 0xD8 && data[2] === 0xFF) {
    return 'jpeg';
  }
  // GIF: 47 49 46
  if (data[0] === 0x47 && data[1] === 0x49 && data[2] === 0x46) {
    return 'gif';
  }
  return 'unknown';
}

/**
 * 解码 PNG 图片 (使用 UPNG.js - 纯 JS 实现)
 */
function decodePNG(data: Uint8Array): ImageData {
  const img = UPNG.decode(data);
  const rgba = UPNG.toRGBA8(img)[0];
  return {
    width: img.width,
    height: img.height,
    data: new Uint8Array(rgba),
  };
}

/**
 * 解码 JPEG 图片
 */
function decodeJPEG(data: Uint8Array): ImageData {
  const jpg = jpeg.decode(data, { useTArray: true });
  return {
    width: jpg.width,
    height: jpg.height,
    data: new Uint8Array(jpg.data),
  };
}

/**
 * 解码图片数据
 */
function decodeImage(data: Uint8Array): ImageData {
  const format = detectFormat(data);

  switch (format) {
    case 'png':
      return decodePNG(data);
    case 'jpeg':
      return decodeJPEG(data);
    default:
      throw new Error(`Unsupported image format: ${format}`);
  }
}

/**
 * 图片数据转 ASCII
 */
function imageToAsciiResult(
  image: ImageData,
  options: RenderOptions
): AsciiResult {
  const {
    colored = true,
    detailed = false,
    trueColor = true,
  } = options;

  const targetWidth = options.targetWidth || options.width || 80;
  const aspectRatio = image.height / image.width;

  let resizeH: number;
  if (colored) {
    resizeH = Math.round(targetWidth * aspectRatio);
  } else {
    resizeH = Math.round(targetWidth * aspectRatio * 0.5);
  }

  if (options.targetHeight || options.height) {
    resizeH = options.targetHeight || options.height!;
  }

  // 缩放图片
  const resized = resizeImage(image, targetWidth, resizeH);

  let asciiText = renderChar(resized.data, resized.width, resized.height, detailed);
  let coloredText: string | undefined;

  if (colored) {
    coloredText = renderHalfBlock(resized.data, resized.width, resized.height, trueColor);
  }

  return {
    text: asciiText,
    colored: coloredText,
  };
}

/**
 * 从 URL 获取图片并转换为 ASCII
 */
export async function fetchImageToAscii(
  url: string,
  options: RenderOptions = {}
): Promise<AsciiResult> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);

    const buffer = await response.arrayBuffer();
    const data = new Uint8Array(buffer);

    const image = decodeImage(data);
    return imageToAsciiResult(image, options);
  } catch (e) {
    console.error("Image conversion error:", e);
    throw new Error(`Failed to convert image: ${e instanceof Error ? e.message : String(e)}`);
  }
}

/**
 * 从 URL 获取 GIF 并转换为 ASCII 帧序列
 */
export async function fetchGifToAsciiFrames(
  url: string,
  options: RenderOptions = {}
): Promise<AsciiFrame[]> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch GIF: ${response.status}`);

  const buffer = await response.arrayBuffer();
  const arr = new Uint8Array(buffer);

  // 检测是否为 GIF
  if (detectFormat(arr) !== 'gif') {
    const staticResult = await fetchImageToAscii(url, options);
    return [{ ascii: staticResult.text, coloredAscii: staticResult.colored, delay: 200 }];
  }

  const gif = decodeGif(arr);
  const frames: AsciiFrame[] = [];

  const { colored = true, trueColor = true } = options;
  const targetWidth = options.targetWidth || options.width || 80;
  const aspectRatio = gif.height / gif.width;

  const resizeW = targetWidth;
  const resizeH = colored
    ? Math.round(targetWidth * aspectRatio)
    : Math.round(targetWidth * aspectRatio * 0.5);

  for (const frame of gif.frames) {
    const image: ImageData = {
      width: gif.width,
      height: gif.height,
      data: new Uint8Array(frame.data),
    };

    const resized = resizeImage(image, resizeW, resizeH);

    const frameText = renderChar(resized.data, resized.width, resized.height, options.detailed || false);
    let frameColored = "";

    if (colored) {
      frameColored = renderHalfBlock(resized.data, resized.width, resized.height, trueColor);
    }

    frames.push({
      ascii: frameText,
      coloredAscii: frameColored || undefined,
      delay: frame.delay * 10 || 100,
    });
  }

  return frames;
}

/**
 * 生成测试图案
 */
export function generateTestPattern(width = 40, height = 20): string {
  const chars = "█▓▒░ ";
  let result = "";
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dist = Math.sqrt(Math.pow(x - width / 2, 2) + Math.pow(y - height / 2, 2));
      const maxDist = Math.sqrt(Math.pow(width / 2, 2) + Math.pow(height / 2, 2));
      const charIndex = Math.floor((dist / maxDist) * (chars.length - 1));
      result += chars[charIndex] || " ";
    }
    result += "\n";
  }
  return result;
}

export function generateColorTestPattern(width = 40, height = 20, trueColor = false): string {
  const realW = width;
  const realH = height * 2;
  const pixels = new Uint8Array(realW * realH * 4);

  for (let y = 0; y < realH; y++) {
    for (let x = 0; x < realW; x++) {
      const idx = (y * realW + x) * 4;
      pixels[idx] = Math.floor((x / realW) * 255);
      pixels[idx + 1] = Math.floor((y / realH) * 255);
      pixels[idx + 2] = 128;
      pixels[idx + 3] = 255;
    }
  }

  return renderHalfBlock(pixels, realW, realH, trueColor);
}

export default {
  fetchImageToAscii,
  fetchGifToAsciiFrames,
  generateTestPattern,
  generateColorTestPattern,
};
