/**
 * useSiderCollapsed — Sider 折叠状态管理 hook
 *
 * 支持受控/非受控模式
 * localStorage 持久化（通过 storageKey 区分不同实例）
 * SSR 安全（typeof window === 'undefined' 时返回 false）
 */

import { useState, useEffect, useCallback } from 'react';

export interface UseSiderCollapsedOptions {
  /** 受控值 */
  collapsed?: boolean;
  /** 折叠状态变化回调 */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** localStorage 持久化 key（不传则不持久化） */
  storageKey?: string;
}

export type UseSiderCollapsedReturn = [boolean, (collapsed: boolean) => void];

/**
 * Sider 折叠状态管理 hook
 *
 * @example
 * ```ts
 * const [collapsed, setCollapsed] = useSiderCollapsed({
 *   storageKey: 'admin-sider',
 * });
 * ```
 */
export function useSiderCollapsed(options: UseSiderCollapsedOptions = {}): UseSiderCollapsedReturn {
  const { collapsed: controlled, onCollapsedChange, storageKey } = options;
  const isControlled = controlled !== undefined;

  // 初始值：受控优先，否则从 localStorage 读取，否则 false
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(() => {
    if (isControlled) return controlled!;
    if (storageKey && typeof window !== 'undefined') {
      try {
        return window.localStorage.getItem(`pro-layout-sider-${storageKey}`) === 'true';
      } catch {
        // localStorage 不可用时静默失败
      }
    }
    return false;
  });

  // 受控模式同步
  useEffect(() => {
    if (isControlled) setInternalCollapsed(controlled!);
  }, [isControlled, controlled]);

  // 持久化
  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(`pro-layout-sider-${storageKey}`, String(internalCollapsed));
    } catch {
      // localStorage 不可用时静默失败
    }
  }, [internalCollapsed, storageKey]);

  const setCollapsed = useCallback(
    (c: boolean) => {
      if (!isControlled) setInternalCollapsed(c);
      onCollapsedChange?.(c);
    },
    [isControlled, onCollapsedChange],
  );

  return [internalCollapsed, setCollapsed];
}
