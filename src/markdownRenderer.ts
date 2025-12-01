// src/markdownRenderer.ts
// Markdown 渲染器 - fallback 实现
// 主要渲染在构建时预处理完成，此处仅作为运行时 fallback

/**
 * 简单的 Markdown 渲染 (fallback)
 * 如果预处理数据不可用，返回原始文本
 */
export function renderMarkdown(markdown: string): string {
  if (!markdown) return "";
  // 作为 fallback，直接返回原始 markdown 文本
  // 实际渲染在构建时通过 marked + marked-terminal 完成
  return markdown;
}

export default { renderMarkdown };
