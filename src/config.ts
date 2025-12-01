// src/config.ts
// 用户配置文件 - 每页独立配置

import type { Config } from "./types";

export const config: Config = {
  // ============ 全局设置 ============
  global: {
    // 默认动画速度
    speed: {
      typing: 20, // 打字速度 (ms)
      typingPause: 100, // 标点停顿 (ms)
      transition: 80, // 切换动画速度 (ms)
      effect: 50, // 动效速度 (ms)
    },

    // 颜色主题
    theme: {
      primary: "brightCyan",
      secondary: "green",
      accent: "yellow",
      highlight: "brightGreen",
      error: "red",
    },
  },

  // ============ 页面配置 ============
  // 每个页面独立配置，不依赖全局 name/title
  pages: [
    // // 第一页: Logo
    // {
    //   type: "logo",
    //   content: {
    //     text: "DJJ", // 要转换为ASCII大字的文本
    //     subtitle: "Department of Joke Justice",
    //     tagline: "说烂笑话必遭审判",
    //   },
    //   effect: "glitch", // 内容动效: none | typing | decrypt | glitch | matrix
    //   transition: "none", // 过渡动画: none | fade | glitch | scanline
    // },

    // 1. GIF 演示
    {
      type: "image",
      content: {
        src: "assets/nyoncat.gif",
        width: 50,
        colored: true,
        animated: true,
      },
      effect: "none",
      transition: "fade"
    },
    // 2. 图像演示
    {
      type: "image",
      content: {
        src: "assets/DJJ.png",
        width: 50,
        colored: true,
        animated: false,
      },
      effect: "matrix",
      transition: "fade",
      stayTime: 2000,
    },
    // 3. 纯文本演示
    {
      type: "raw",
      content: {
        text: "反抗吧，朋友！",
      },
      effect: "decrypt", // 解密效果
      transition: "fade",
      stayTime: 1000,
    },
    // 4. Markdown 演示
    {
      type: "markdown",
      content: {
        markdown: `
## About DJJ

"DJJ" 的正确的解读是: Department of Joke Justic (说烂笑话必遭审判) 或者 丁基胶 (一种重要的化工原料)

我喜欢创造的过程和结果. 我憎恶无聊的事情, 我绝对不做只用传教士体位的人.

钓鱼是我最喜欢的活动, 在河边能够感受到一种真正的平静.

钓鱼是付出和等待的艺术, 这是很少有人具备的品质.


## 怎么实现的?

https://github.com/TokenRollAI/curl-resume

---

Follow Me: https://github.com/Disdjj
Connact Me: shuaiqijianhao@qq.com
`,
      },
      effect: "typing", // 打字机效果
      transition: "glitch",
    },
  ],
};

// ============ 页面类型说明 ============
//
// type: "logo"
//   content: {
//     text: string,          // 转换为ASCII大字的文本
//     ascii?: string,        // 或者直接提供ASCII art
//     subtitle?: string,     // 副标题
//     tagline?: string,      // 标语
//   }
//
// type: "markdown"
//   content: {
//     markdown: string,      // Markdown 内容
//   }
//
// type: "image"
//   content: {
//     src: string,           // 图片URL
//     width?: number,        // ASCII宽度 (默认80)
//     height?: number,       // ASCII高度 (自动计算)
//     colored?: boolean,     // 是否使用颜色
//     animated?: boolean,    // 是否为GIF动画
//   }
//
// type: "raw"
//   content: {
//     text: string,          // 原始文本
//   }
//
// ============ 效果说明 ============
//
// effect (内容动效 - 内容构建完成后的动画):
//   - "none":     无动效，直接显示
//   - "typing":   逐字键入
//   - "decrypt":  黑客解密效果
//   - "glitch":   故障抖动
//   - "matrix":   黑客帝国下落效果
//
// transition (过渡动画 - 切换到下一页的动画):
//   - "none":     无过渡
//   - "fade":     渐隐
//   - "glitch":   故障切换
//   - "scanline": 扫描线
//
// stayTime (页面停留时间):
//   - 数值类型，单位为毫秒 (ms)
//   - 页面渲染完成后停留的时间
//   - 例如: stayTime: 2000 表示停留 2 秒
//
// speedMultiplier (动画速度倍率):
//   - 数值类型，默认为 1
//   - 控制页面所有动画的速度倍率
//   - 1 = 正常速度
//   - <1 = 加快 (如 0.5 = 2倍速)
//   - >1 = 减慢 (如 2 = 0.5倍速)
//   - 例如: speedMultiplier: 0.5 表示动画以 2 倍速播放
