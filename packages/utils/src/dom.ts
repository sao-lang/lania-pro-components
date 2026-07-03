/**
 * DOM 工具模块
 *
 * 提供与浏览器 DOM 操作相关的纯工具函数。
 * 这些函数不包含任何 UI 反馈（如弹窗提示），仅执行底层操作，
 * 调用方需自行处理用户交互层面的反馈。
 */

/**
 * 将指定文本复制到系统剪贴板
 *
 * 采用渐进增强策略：
 * 1. 优先使用现代浏览器的 navigator.clipboard.writeText API（异步，安全上下文要求）
 * 2. 不可用或失败时自动降级到 document.execCommand('copy') 方案（兼容旧浏览器）
 *
 * 注意：此函数仅负责写入剪贴板，不弹出任何提示消息。
 * 调用方应在成功/失败后自行处理 UI 反馈（如 Message.success / Message.error）。
 *
 * @param text - 待复制的文本内容，为空字符串时直接返回 false
 * @returns Promise<boolean> - true 表示复制成功，false 表示失败
 *
 * @example
 * ```ts
 * const success = await copyToClipboard('Hello World');
 * if (success) {
 *   message.success('复制成功');
 * } else {
 *   message.error('复制失败');
 * }
 * ```
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // 空文本直接返回失败
  if (!text) {
    return false;
  }

  // 方案1：优先使用现代 Clipboard API（需要安全上下文 HTTPS 或 localhost）
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Clipboard API 失败，降级到方案2
    }
  }

  // 方案2：降级到传统的 execCommand 方式
  return fallbackCopyToClipboard(text);
}

/**
 * 降级复制方案 — 使用 document.execCommand('copy') 方式
 *
 * 原理：
 * 1. 动态创建一个不可见的 textarea 元素
 * 2. 将文本写入 textarea
 * 3. 选中 textarea 内容
 * 4. 执行 document.execCommand('copy')
 * 5. 清理临时创建的 textarea 元素
 *
 * 此方案兼容不支持 Clipboard API 的旧浏览器和非安全上下文环境。
 *
 * @param text - 待复制的文本
 * @returns boolean - 是否复制成功
 */
function fallbackCopyToClipboard(text: string): boolean {
  // 服务端渲染（SSR）环境下无法访问 document，直接返回 false
  if (typeof document === 'undefined') {
    return false;
  }

  // 创建临时 textarea 元素，定位到视口外使其不可见
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  let successful = false;
  try {
    // 执行复制命令，返回 true/false 表示成功与否
    successful = document.execCommand('copy');
  } catch {
    // 某些浏览器可能抛出异常（如 iOS Safari 的某些版本）
    successful = false;
  }

  // 清理：移除临时 textarea 元素，避免 DOM 污染
  document.body.removeChild(textArea);
  return successful;
}
