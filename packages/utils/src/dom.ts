/**
 * DOM 工具
 */

/**
 * 纯粹的剪贴板写入，不包含任何 UI 反馈。
 * 优先使用 navigator.clipboard，不可用或失败时降级到 execCommand。
 * @param text 待复制文本
 * @returns 是否成功写入剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) {
    return false;
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // 降级到 execCommand
    }
  }

  return fallbackCopyToClipboard(text);
}

/**
 * 降级复制方案（兼容旧浏览器 / 非安全上下文）
 */
function fallbackCopyToClipboard(text: string): boolean {
  if (typeof document === 'undefined') {
    return false;
  }

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
    successful = document.execCommand('copy');
  } catch {
    successful = false;
  }

  document.body.removeChild(textArea);
  return successful;
}
