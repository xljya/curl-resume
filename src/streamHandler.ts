// src/streamHandler.ts
// 流式动画处理器 - 主入口

import { encoder } from "./utils";
import { config } from "./config";
import { renderAllPages } from "./pageRenderer";
import type { PushFunction } from "./types";

/**
 * 流式输出简历 - 基于配置渲染
 */
export async function streamResume(
  writer: WritableStreamDefaultWriter
): Promise<void> {
  const push: PushFunction = (text: string) => writer.write(encoder.encode(text));

  try {
    await renderAllPages(push, config);
  } catch (error) {
    console.error("Render error:", error);
  }

  await writer.close();
}

export default { streamResume };
