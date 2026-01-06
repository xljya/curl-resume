// src/types.ts
// 类型定义

// ============ 页面类型 ============

export type PageType = "logo" | "markdown" | "image" | "raw";

export type EffectType =
  | "none"
  | "typing"
  | "cursorTyping"
  | "decrypt"
  | "glitch"
  | "matrix";

export type TransitionType = "none" | "fade" | "glitch" | "scanline";

// ============ 页面内容类型 ============

export interface LogoContent {
  text?: string;
  ascii?: string;
  subtitle?: string;
  tagline?: string;
}

export interface MarkdownContent {
  markdown: string;
}

export interface ImageContent {
  src: string;           // 图片URL或base64
  width?: number;        // ASCII 宽度 (默认 80)
  height?: number;       // ASCII 高度 (自动计算)
  colored?: boolean;     // 是否使用颜色
  animated?: boolean;    // 是否为GIF动画
  frameDelay?: number;   // GIF帧延迟 (ms)
}

export interface RawContent {
  text: string;
}

export type PageContent = LogoContent | MarkdownContent | ImageContent | RawContent;

// ============ 页面配置 ============

export interface PageConfig {
  type: PageType;
  content: PageContent;
  effect?: EffectType;
  transition?: TransitionType;
  speed?: SpeedConfig;
  stayTime?: number;  // 页面停留时间 (ms)，渲染完成后在此页面停留的时间
  speedMultiplier?: number;  // 动画速度倍率，1=正常速度，<1加快，>1减慢
}

// ============ 全局配置 ============

export interface SpeedConfig {
  typing?: number;
  typingPause?: number;
  transition?: number;
  effect?: number;
}

export interface ThemeConfig {
  primary?: string;
  secondary?: string;
  accent?: string;
  highlight?: string;
  error?: string;
}

export interface GlobalConfig {
  speed?: SpeedConfig;
  theme?: ThemeConfig;
}

export interface Config {
  global?: GlobalConfig;
  pages: PageConfig[];
}

// ============ 图片处理类型 ============

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface GifFrame {
  pixels: RGB[][];
  delay: number;
}

export interface AsciiResult {
  text: string;
  colored?: string;
}

export interface AsciiFrame {
  ascii: string;
  coloredAscii?: string;
  delay: number;
}

// ============ 推送函数类型 ============

export type PushFunction = (text: string) => Promise<void>;

// ============ 效果选项 ============

export interface EffectOptions {
  speed?: number;
  pauseSpeed?: number;
  color?: string;
  cycles?: number;
  iterations?: number;
}
