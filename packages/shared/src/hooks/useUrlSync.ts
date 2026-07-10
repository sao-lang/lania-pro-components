/**
 * @lania-pro-components/shared
 *
 * useUrlSync — URL 双向同步 Hook
 *
 * 泛化自 ProTable/hooks/useUrlSync.ts。
 * 通过 getState/setState 回调与任意状态管理解耦。
 *
 * @example
 * ```tsx
 * // 与 ProTable DataStore 集成
 * const { restoreFromUrl } = useUrlSync({
 *   enabled: true,
 *   getState: () => store.getState(),
 *   setState: (partial) => { if (partial.current) store.setPage(partial.current); },
 *   serialize: (state) => ({ page: String(state.current), q: JSON.stringify(state.query) }),
 *   deserialize: (params) => ({ current: Number(params.page), query: JSON.parse(params.q || '{}') }),
 * });
 * ```
 */
import { useEffect, useCallback, useRef } from 'react';

/**
 * useUrlSync 配置
 */
export interface UseUrlSyncOptions<TState> {
  /** 是否启用 */
  enabled: boolean;
  /** 获取当前状态 */
  getState: () => TState;
  /** 设置部分状态 */
  setState: (partial: Partial<TState>) => void;
  /** 将状态序列化为 URL 参数字典 */
  serialize: (state: TState) => Record<string, string | undefined>;
  /** 从 URL 参数字典反序列化为状态 */
  deserialize: (params: Record<string, string>) => Partial<TState>;
  /** 同步延迟（防抖，毫秒），默认 300 */
  debounceTime?: number;
  /** 使用 replace 而非 push（默认 false） */
  replace?: boolean;
}

/**
 * useUrlSync 返回值
 */
export interface UseUrlSyncReturn {
  /** 同步当前状态到 URL */
  syncToUrl: () => void;
  /** 从 URL 恢复状态 */
  restoreFromUrl: () => void;
}

/**
 * URL 双向同步 Hook
 */
export function useUrlSync<TState>(options: UseUrlSyncOptions<TState>): UseUrlSyncReturn {
  const { enabled, getState, setState, serialize, deserialize, debounceTime = 300, replace = false } = options;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRestoringRef = useRef(false);

  /**
   * 同步当前状态到 URL
   *
   * 流程：getState → serialize → 写入 URL searchParams → pushState/replaceState。
   * 防抖处理避免频繁更新 URL；恢复中（isRestoringRef=true）跳过，避免回环。
   */
  const syncToUrl = useCallback(() => {
    if (!enabled || isRestoringRef.current) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      const state = getState();
      const params = serialize(state);
      if (typeof window === 'undefined') return;
      const url = new URL(window.location.href);
      // 空值删除 key，非空值设置
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === '' || value === null) {
          url.searchParams.delete(key);
        } else {
          url.searchParams.set(key, value);
        }
      });
      if (replace) {
        window.history.replaceState({}, '', url.toString());
      } else {
        window.history.pushState({}, '', url.toString());
      }
    }, debounceTime);
  }, [enabled, getState, serialize, replace, debounceTime]);

  /**
   * 从 URL 恢复状态
   *
   * 流程：读取 location.search → deserialize → setState。
   * 设置 isRestoringRef 标志位 100ms，防止 setState 触发的 syncToUrl 回环。
   */
  const restoreFromUrl = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return;

    isRestoringRef.current = true;
    try {
      const params = new URLSearchParams(window.location.search);
      const raw: Record<string, string> = {};
      params.forEach((v, k) => {
        raw[k] = v;
      });
      const state = deserialize(raw);
      if (Object.keys(state).length > 0) {
        setState(state);
      }
    } finally {
      // 延迟 100ms 解除恢复标志，确保 syncToUrl 防抖窗口内被跳过
      setTimeout(() => {
        isRestoringRef.current = false;
      }, 100);
    }
  }, [enabled, deserialize, setState]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { syncToUrl, restoreFromUrl };
}
