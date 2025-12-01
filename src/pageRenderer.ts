// src/pageRenderer.ts
// 页面渲染器 - 根据配置渲染不同类型的页面

import { generateAscii } from "./asciiGenerator";
import * as effects from "./effects";
import { ANSI, sleep } from "./utils";
import { renderMarkdown } from "./markdownRenderer";
import { fetchImageToAscii, fetchGifToAsciiFrames, generateTestPattern } from "./imageToAscii";
import type {
  Config,
  PageConfig,
  PushFunction,
  SpeedConfig,
  LogoContent,
  MarkdownContent,
  ImageContent,
  RawContent,
  AsciiResult,
  AsciiFrame,
} from "./types";

// 导入预处理数据 (构建时生成)
// @ts-ignore - 该文件在构建时生成
import { preprocessedData as preprocessedDataRaw } from "./preprocessed-data";
const preprocessedData: Record<string, PreprocessedData> = preprocessedDataRaw || {};

interface PreprocessedImage {
  type: "static";
  result: AsciiResult;
}

interface PreprocessedGif {
  type: "animated";
  frames: AsciiFrame[];
}

interface PreprocessedMarkdown {
  type: "markdown";
  rendered: string;
}

type PreprocessedData = PreprocessedImage | PreprocessedGif | PreprocessedMarkdown;

/**
 * 获取页面速度配置（应用速度倍率）
 */
function getSpeed(page: PageConfig, globalConfig: Config): SpeedConfig {
  const baseSpeed = { ...(globalConfig.global?.speed || {}), ...(page.speed || {}) };
  const multiplier = page.speedMultiplier ?? 1;

  // 应用速度倍率到所有速度值
  return {
    typing: baseSpeed.typing ? Math.round(baseSpeed.typing * multiplier) : undefined,
    typingPause: baseSpeed.typingPause ? Math.round(baseSpeed.typingPause * multiplier) : undefined,
    transition: baseSpeed.transition ? Math.round(baseSpeed.transition * multiplier) : undefined,
    effect: baseSpeed.effect ? Math.round(baseSpeed.effect * multiplier) : undefined,
  };
}

/**
 * 获取速度倍率
 */
function getSpeedMultiplier(page: PageConfig): number {
  return page.speedMultiplier ?? 1;
}

/**
 * 渲染 Logo 页面
 */
async function renderLogoPage(
  push: PushFunction,
  page: PageConfig,
  config: Config
): Promise<void> {
  const content = page.content as LogoContent;
  const speed = getSpeed(page, config);

  // 生成 Logo ASCII
  let logoText: string;
  if (content.ascii) {
    logoText = content.ascii;
  } else if (content.text) {
    logoText = generateAscii(content.text);
  } else {
    logoText = generateAscii("HELLO");
  }

  // 添加副标题和标语
  let fullContent = logoText;
  if (content.subtitle) {
    fullContent += `\n\n> ${content.subtitle}`;
  }
  if (content.tagline) {
    fullContent += `\n> ${content.tagline}`;
  }

  const logoLines = fullContent.split("\n");

  // 使用扫描显示效果渲染 Logo
  await effects.scanDisplay(push, logoLines, {
    speed: speed.typing || 15,
    color: ANSI.brightCyan,
  });

  await sleep(300);

  // 光波效果
  await effects.lightWaveEffect(push, logoLines, speed.transition || 40);

  await sleep(500);
}

/**
 * 渲染 Markdown 页面
 * 优先使用预处理数据，否则实时渲染
 */
async function renderMarkdownPage(
  push: PushFunction,
  page: PageConfig,
  config: Config,
  pageIndex: number
): Promise<void> {
  const content = page.content as MarkdownContent;
  const speed = getSpeed(page, config);

  // 检查是否有预处理数据
  const preprocessedKey = `markdown:${pageIndex}`;
  const preprocessed = preprocessedData[preprocessedKey];

  let renderedText: string;
  if (preprocessed && preprocessed.type === "markdown") {
    // 使用预处理数据
    renderedText = preprocessed.rendered;
  } else {
    // 实时渲染（fallback）
    renderedText = renderMarkdown(content.markdown || "");
  }

  // 应用内容动效
  const effect = effects.getEffect(page.effect || "none");
  await effect(push, renderedText, {
    speed: speed.typing || 20,
    pauseSpeed: speed.typingPause || 100,
  });

  await push("\n");
}

/**
 * 渲染 Image 页面 (图片转 ASCII)
 * 优先使用预处理数据，否则实时处理
 */
async function renderImagePage(
  push: PushFunction,
  page: PageConfig,
  config: Config
): Promise<void> {
  const content = page.content as ImageContent;
  const speed = getSpeed(page, config);

  try {
    // 检查是否有预处理数据
    const preprocessed = preprocessedData[content.src];

    if (content.animated) {
      // GIF 动画
      let frames: AsciiFrame[];

      if (preprocessed && preprocessed.type === "animated") {
        // 使用预处理数据
        frames = preprocessed.frames;
      } else {
        // 实时处理
        frames = await fetchGifToAsciiFrames(content.src, {
          width: content.width || 60,
          colored: content.colored,
        });
      }

      // 应用速度倍率到帧延迟
      const multiplier = getSpeedMultiplier(page);
      const adjustedFrames = frames.map(frame => ({
        ...frame,
        delay: Math.round(frame.delay * multiplier),
      }));

      await effects.playAsciiAnimation(push, adjustedFrames, {
        loops: 2,
        colored: content.colored,
      });
    } else {
      // 静态图片
      let result: AsciiResult;

      if (preprocessed && preprocessed.type === "static") {
        // 使用预处理数据
        result = preprocessed.result;
      } else {
        // 实时处理
        result = await fetchImageToAscii(content.src, {
          width: content.width || 80,
          height: content.height,
          colored: content.colored,
        });
      }

      const asciiText = content.colored && result.colored ? result.colored : result.text;

      // 应用内容动效
      const effect = effects.getEffect(page.effect || "none");
      await effect(push, asciiText, {
        speed: speed.effect || 10,
      });
    }
  } catch (error) {
    // 图片加载失败，显示测试图案
    console.error("Image load failed:", error);
    const fallback = generateTestPattern(content.width || 60, 20);
    await push(`${ANSI.dim}[图片加载失败: ${content.src}]${ANSI.reset}\n\n`);
    await push(`${ANSI.brightCyan}${fallback}${ANSI.reset}`);
  }

  await push("\n");
}

/**
 * 渲染 Raw 页面 (原始文本)
 */
async function renderRawPage(
  push: PushFunction,
  page: PageConfig,
  config: Config
): Promise<void> {
  const content = page.content as RawContent;
  const speed = getSpeed(page, config);

  const text = content.text || "";

  // 应用内容动效
  const effect = effects.getEffect(page.effect || "none");
  await effect(push, text, {
    speed: speed.effect || 50,
    color: `${ANSI.red}${ANSI.bold}`,
  });

  // await effects.endingBlink(push);
  // await push("\n\n");
}

/**
 * 渲染所有页面
 */
export async function renderAllPages(
  push: PushFunction,
  config: Config
): Promise<void> {
  const pages = config.pages || [];
  let markdownIndex = 0;  // 追踪 markdown 页面索引

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];

    // 渲染页面
    switch (page.type) {
      case "logo":
        await renderLogoPage(push, page, config);
        break;
      case "markdown":
        await renderMarkdownPage(push, page, config, markdownIndex);
        markdownIndex++;
        break;
      case "image":
        await renderImagePage(push, page, config);
        break;
      case "raw":
        await renderRawPage(push, page, config);
        break;
      default:
        await renderRawPage(push, page, config);
    }

    // 页面停留时间
    if (page.stayTime && page.stayTime > 0) {
      await sleep(page.stayTime);
    }

    // 执行过渡动画（除了最后一页）
    if (i < pages.length - 1 && page.transition) {
      const transition = effects.getTransition(page.transition);
      await transition(push);
    }
  }
}

export default { renderAllPages };
