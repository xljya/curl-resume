// src/effects.ts
// 动画效果库 - 内容动效 & 过渡动画

import { sleep, encoder, ANSI, getRandomChar } from "./utils";
import type { PushFunction, EffectOptions } from "./types";

/**
 * 创建推送函数
 */
export function createPusher(writer: WritableStreamDefaultWriter): PushFunction {
  return (text: string) => writer.write(encoder.encode(text));
}

// ============================================================
// 过渡动画 (Transitions) - 页面切换时的动画
// ============================================================

/**
 * 无过渡
 */
export async function transitionNone(push: PushFunction): Promise<void> {
  // 什么都不做
}

/**
 * 渐隐过渡
 */
export async function transitionFade(push: PushFunction): Promise<void> {
  await sleep(200);
  await push(ANSI.clear);
}

/**
 * 故障过渡
 */
export async function transitionGlitch(push: PushFunction): Promise<void> {
  const glitchChars = "█▓▒░╔╗╚╝║═@#$%&*";
  const width = 50;

  for (let i = 0; i < 3; i++) {
    let line = "";
    for (let j = 0; j < width; j++) {
      line += glitchChars[Math.floor(Math.random() * glitchChars.length)];
    }
    await push(`${ANSI.red}${line}${ANSI.reset}\r`);
    await sleep(50);
    await push(
      `${ANSI.brightGreen}${line.split("").reverse().join("")}${ANSI.reset}\r`
    );
    await sleep(40);
  }
  await push(ANSI.clear);
}

/**
 * 扫描线过渡
 */
export async function transitionScanline(push: PushFunction): Promise<void> {
  const width = 55;

  for (let i = 0; i < 8; i++) {
    await push(`${ANSI.brightCyan}${"▀".repeat(width)}${ANSI.reset}\n`);
    await sleep(15);
  }
  await sleep(50);
  await push(ANSI.clear);
}

/**
 * 获取过渡动画
 */
export function getTransition(
  name: string
): (push: PushFunction) => Promise<void> {
  const transitions: Record<string, (push: PushFunction) => Promise<void>> = {
    none: transitionNone,
    fade: transitionFade,
    glitch: transitionGlitch,
    scanline: transitionScanline,
  };
  return transitions[name] || transitionNone;
}

// ============================================================
// 内容动效 (Effects) - 内容显示时的动画
// ============================================================

/**
 * 无动效 - 直接显示
 */
export async function effectNone(
  push: PushFunction,
  text: string,
  options: EffectOptions = {}
): Promise<void> {
  await push(text);
}

/**
 * 打字机效果
 * 注意：使用 Array.from() 正确处理多字节 Unicode 字符（如 emoji）
 */
export async function effectTyping(
  push: PushFunction,
  text: string,
  options: EffectOptions = {}
): Promise<void> {
  const { speed = 20, pauseSpeed = 100, color = "" } = options;

  // 使用 Array.from 正确分割 Unicode 字符（包括 emoji 等多字节字符）
  const chars = Array.from(text);

  for (const char of chars) {
    await push(color ? `${color}${char}${ANSI.reset}` : char);

    if (char === "\n") {
      await sleep(speed * 2);
    } else if (",.:;，。：；!?！？".includes(char)) {
      await sleep(pauseSpeed);
    } else {
      await sleep(speed);
    }
  }
}

/**
 * 解密效果 - 黑客风格从乱码解析
 * 注意：使用 Array.from() 正确处理多字节 Unicode 字符（如 emoji）
 */
export async function effectDecrypt(
  push: PushFunction,
  text: string,
  options: EffectOptions = {}
): Promise<void> {
  const { speed = 50, cycles = 3, color = ANSI.brightGreen } = options;

  // 使用 Array.from 正确分割 Unicode 字符
  const chars = Array.from(text);

  // 预先填充乱码
  const currentDisplay = chars.map(() => getRandomChar());

  // 逐个字符解析
  for (let i = 0; i < chars.length; i++) {
    const targetChar = chars[i];

    // 乱码闪烁阶段
    for (let k = 0; k < cycles; k++) {
      // 更新当前未解析部分的乱码
      for (let j = i; j < chars.length; j++) {
        if (chars[j] !== " " && chars[j] !== "\n") {
          currentDisplay[j] = getRandomChar();
        } else {
          currentDisplay[j] = chars[j];
        }
      }

      // 输出整行（回车覆盖）
      await push(`\r${color}${currentDisplay.join("")}${ANSI.reset}`);
      await sleep(speed);
    }

    // 锁定当前字符
    currentDisplay[i] = targetChar;
    await push(`\r${color}${currentDisplay.join("")}${ANSI.reset}`);
  }
  await push("\n");
}

/**
 * 故障效果 - 文字抖动
 * 注意：使用 Array.from() 正确处理多字节 Unicode 字符（如 emoji）
 */
export async function effectGlitch(
  push: PushFunction,
  text: string,
  options: EffectOptions = {}
): Promise<void> {
  const { speed = 80, iterations = 5, color = ANSI.brightGreen } = options;
  const lines = text.split("\n");

  // 先快速闪烁几次故障效果
  for (let iter = 0; iter < iterations; iter++) {
    await push(ANSI.clear);

    for (const line of lines) {
      let glitchedLine = "";
      // 使用 Array.from 正确分割 Unicode 字符
      const chars = Array.from(line);
      for (const char of chars) {
        if (Math.random() < 0.3) {
          // 30% 概率显示乱码
          const glitchColor = Math.random() < 0.5 ? ANSI.red : ANSI.brightCyan;
          glitchedLine += `${glitchColor}${getRandomChar()}${ANSI.reset}`;
        } else {
          glitchedLine += `${color}${char}${ANSI.reset}`;
        }
      }
      await push(glitchedLine + "\n");
    }
    await sleep(speed);
  }

  // 最终稳定显示
  await push(ANSI.clear);
  await push(`${color}${text}${ANSI.reset}`);
}

/**
 * Matrix 效果 - 黑客帝国风格下落
 * 注意：使用 Array.from() 正确处理多字节 Unicode 字符（如 emoji）
 */
export async function effectMatrix(
  push: PushFunction,
  text: string,
  options: EffectOptions = {}
): Promise<void> {
  const { speed = 30, color = ANSI.brightGreen } = options;
  const lines = text.split("\n");
  // 使用 Array.from 计算正确的字符数（而非 UTF-16 代码单元数）
  const maxWidth = Math.max(...lines.map((l) => Array.from(l).length));
  const height = lines.length;

  // 从上往下逐行显示
  for (let row = 0; row < height; row++) {
    await push(ANSI.clear);

    // 显示已完成的行
    for (let r = 0; r < row; r++) {
      await push(`${color}${lines[r]}${ANSI.reset}\n`);
    }

    // 当前行 - 带下落效果的乱码
    const currentLine = lines[row] || "";
    // 使用 Array.from 正确分割 Unicode 字符
    const chars = Array.from(currentLine);
    let displayLine = "";
    for (const char of chars) {
      if (Math.random() < 0.7) {
        displayLine += `${ANSI.brightGreen}${getRandomChar()}${ANSI.reset}`;
      } else {
        displayLine += `${color}${char}${ANSI.reset}`;
      }
    }
    await push(displayLine + "\n");

    // 下方的下落字符
    for (let r = row + 1; r < Math.min(row + 4, height + 3); r++) {
      let fallingLine = "";
      const len = Math.floor(Math.random() * maxWidth * 0.5);
      for (let c = 0; c < len; c++) {
        fallingLine += `${ANSI.green}${getRandomChar()}${ANSI.reset}`;
      }
      await push(fallingLine + "\n");
    }

    await sleep(speed);
  }

  // 最终清理并显示完整文本
  await push(ANSI.clear);
  await push(`${color}${text}${ANSI.reset}`);
}

/**
 * 获取内容动效
 */
export function getEffect(
  name: string
): (push: PushFunction, text: string, options?: EffectOptions) => Promise<void> {
  const effects: Record<
    string,
    (push: PushFunction, text: string, options?: EffectOptions) => Promise<void>
  > = {
    none: effectNone,
    typing: effectTyping,
    decrypt: effectDecrypt,
    glitch: effectGlitch,
    matrix: effectMatrix,
  };
  return effects[name] || effectNone;
}

// ============================================================
// 辅助效果 - 用于特定场景
// ============================================================

/**
 * 光波扫过效果 (用于 Logo)
 * 注意：使用 Array.from() 正确处理多字节 Unicode 字符（如 emoji）
 */
export async function lightWaveEffect(
  push: PushFunction,
  lines: string[],
  speed = 40
): Promise<void> {
  const colors = [
    "\x1b[36m", // cyan (暗)
    "\x1b[96m", // bright cyan
    "\x1b[97m", // bright white (光波中心)
    "\x1b[96m", // bright cyan
    "\x1b[36m", // cyan (暗)
  ];

  // 使用 Array.from 计算正确的字符数
  const maxWidth = Math.max(...lines.map((l) => Array.from(l).length));

  for (let wavePos = -4; wavePos <= maxWidth + 4; wavePos += 2) {
    await push(ANSI.clear);

    for (const line of lines) {
      let coloredLine = "";
      // 使用 Array.from 正确分割 Unicode 字符
      const chars = Array.from(line);
      for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        if (char === " " || char === "\n") {
          coloredLine += char;
        } else {
          const dist = Math.abs(i - wavePos);
          let colorIdx: number;
          if (dist <= 1) colorIdx = 2;
          else if (dist <= 3) colorIdx = 1;
          else colorIdx = 0;

          coloredLine += `${colors[colorIdx]}${char}${ANSI.reset}`;
        }
      }
      await push(coloredLine + "\n");
    }
    await sleep(speed);
  }

  // 最后稳定显示
  await push(ANSI.clear);
  for (const line of lines) {
    await push(`${ANSI.brightCyan}${line}${ANSI.reset}\n`);
  }
}

/**
 * 逐行扫描显示 (用于 Logo)
 */
export async function scanDisplay(
  push: PushFunction,
  lines: string[],
  options: { speed?: number; scanChar?: string; color?: string } = {}
): Promise<void> {
  const { speed = 20, scanChar = "▌", color = ANSI.brightCyan } = options;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim()) {
      await push(`${ANSI.brightGreen}${scanChar}${ANSI.reset}`);
      await sleep(speed);
      await push(`\r${color}${line}${ANSI.reset}\n`);
    } else {
      await push("\n");
    }
    await sleep(speed);
  }
}

/**
 * 分隔线动画
 */
export async function animatedLine(
  push: PushFunction,
  options: { width?: number; char?: string; speed?: number } = {}
): Promise<void> {
  const { width = 35, char = "═", speed = 6 } = options;

  await push(`${ANSI.dim}`);
  for (let i = 0; i < width; i++) {
    await push(char);
    await sleep(speed);
  }
  await push(`${ANSI.reset}\n`);
}

/**
 * 结尾光标闪烁
 */
export async function endingBlink(
  push: PushFunction,
  times = 3
): Promise<void> {
  for (let i = 0; i < times; i++) {
    await push(`${ANSI.brightGreen}▌${ANSI.reset}`);
    await sleep(180);
    await push("\b ");
    await sleep(120);
  }
}

/**
 * GIF 动画播放效果
 */
export async function playAsciiAnimation(
  push: PushFunction,
  frames: Array<{ ascii: string; coloredAscii?: string; delay: number }>,
  options: { loops?: number; colored?: boolean } = {}
): Promise<void> {
  const { loops = 1, colored = false } = options;

  for (let loop = 0; loop < loops; loop++) {
    for (const frame of frames) {
      await push(ANSI.clear);
      await push(colored && frame.coloredAscii ? frame.coloredAscii : frame.ascii);
      await sleep(frame.delay);
    }
  }
}

export default {
  createPusher,
  // 过渡
  getTransition,
  transitionNone,
  transitionFade,
  transitionGlitch,
  transitionScanline,
  // 内容动效
  getEffect,
  effectNone,
  effectTyping,
  effectDecrypt,
  effectGlitch,
  effectMatrix,
  // 辅助效果
  lightWaveEffect,
  scanDisplay,
  animatedLine,
  endingBlink,
  playAsciiAnimation,
};
