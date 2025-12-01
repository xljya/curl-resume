// src/index.ts
// Cloudflare Worker 入口文件 - 支持流式动画

import { config } from "./config";
import { streamResume } from "./streamHandler";
import type { LogoContent } from "./types";

export interface Env {
  ENVIRONMENT?: string;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);

    // 获取 User-Agent 检测是否为 curl
    const userAgent = request.headers.get("User-Agent") || "";
    const isCurl = userAgent.toLowerCase().includes("curl");

    // 非 curl 访问 - 显示 HTML 页面
    if (!isCurl) {
      // 从第一个 logo 页面获取信息
      const logoPage = config.pages.find((p) => p.type === "logo");
      const logoContent = logoPage?.content as LogoContent | undefined;
      const title = logoContent?.text || "Terminal Resume";
      const subtitle = logoContent?.subtitle || "";
      const tagline = logoContent?.tagline || "";

      const htmlResponse = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title} - ${subtitle}</title>
  <style>
    body {
      background: #0d1117;
      color: #c9d1d9;
      font-family: 'Fira Code', 'Courier New', monospace;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
    }
    .container { text-align: center; padding: 2rem; }
    h1 { color: #58a6ff; }
    code {
      background: #161b22;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      color: #7ee787;
      display: inline-block;
      margin: 0.5rem;
    }
    .subtitle { color: #8b949e; margin-bottom: 0.5rem; }
    .tagline { color: #f85149; font-style: italic; margin-top: 1rem; }
    .hint { color: #8b949e; font-size: 0.9rem; margin-top: 1rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${title}</h1>
    <p class="subtitle">${subtitle}</p>
    <p class="tagline">${tagline}</p>
    <p>请使用 curl 访问:</p>
    <code>curl -N ${url.host}</code>
    <p class="hint">-N 参数开启流式动画效果</p>
  </div>
</body>
</html>`;
      return new Response(htmlResponse, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // 流式动画模式
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    // 启动异步流式输出
    ctx.waitUntil(
      (async () => {
        try {
          await streamResume(writer);
        } catch (e) {
          console.error("Stream error:", e);
          await writer.abort(e);
        }
      })()
    );

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      },
    });
  },
};
