/**
 * @lania-pro-components/shared
 *
 * useFieldNavigation — 表单字段键盘导航 Hook
 *
 * 为表单 / 配置面板提供键盘焦点导航能力，提升无障碍体验与录入效率：
 * - Tab / Shift+Tab 顺序导航（可配置为循环或浏览器默认）
 * - 上下方向键导航（适用于纵向表单）
 * - 首字段自动聚焦
 * - 支持分组字段（id 为数组时取第一个作为焦点目标）
 * - 通过 getElement 回调解耦具体 DOM 实现，可对接任意表单库
 *
 * @example
 * ```tsx
 * const { handleKeyDown, focusField, registerFieldFocus } = useFieldNavigation({
 *   items: ['name', 'age', 'email'],
 *   getElement: (id) => document.querySelector(`[data-field="${id}"] input`),
 *   config: { autoFocusFirstField: true, tabBehavior: 'next', arrowKeyNavigation: true },
 *   onFocus: (id) => console.log('focused:', id),
 * });
 *
 * <input onKeyDown={handleKeyDown} />
 * ```
 */
import React, { useRef, useCallback, useEffect } from 'react';

/**
 * 键盘导航配置
 */
export interface KeyboardNavigationConfig {
  /** 是否启用键盘导航（默认 true） */
  enabled?: boolean;
  /** 是否自动聚焦首个字段（默认 true） */
  autoFocusFirstField?: boolean;
  /** Tab 行为：'next' 拦截 Tab 做循环导航，'default' 保持浏览器默认（默认 'default'） */
  tabBehavior?: 'next' | 'default';
  /** 是否启用上下方向键导航（默认 true） */
  arrowKeyNavigation?: boolean;
}

/**
 * 可聚焦项
 *
 * id 为 string 时表示单字段；为 string[] 时表示分组字段，
 * 焦点会落在数组的第一个元素上（常用于「名称-单位」组合字段）。
 */
export interface FocusableItem {
  id: string | string[];
  /** 字段级 focus 回调（优先于全局 onFocus，覆盖时仅调用此项） */
  onFocus?: (id: string) => void;
  /** 字段级 blur 回调（优先于全局 onBlur，覆盖时仅调用此项） */
  onBlur?: (id: string) => void;
}

/**
 * useFieldNavigation 配置
 */
export interface FieldNavigationOptions {
  /** 字段列表：可以是字符串数组或 FocusableItem 数组 */
  items: Array<FocusableItem> | string[];
  /** 根据 id 获取对应 DOM 元素的回调（由使用方实现） */
  getElement: (id: string) => HTMLElement | null;
  /** 键盘导航配置 */
  config?: KeyboardNavigationConfig;
  /** 字段聚焦回调 */
  onFocus?: (id: string) => void;
  /** 字段失焦回调 */
  onBlur?: (id: string) => void;
}

/**
 * useFieldNavigation 返回值
 */
export interface UseFieldNavigationReturn {
  /** 当前聚焦字段 id */
  focusedField: string | undefined;
  /** 主动聚焦指定字段 */
  focusField: (id: string) => void;
  /** 聚焦下一个字段（循环） */
  focusNextField: (currentId?: string) => void;
  /** 聚焦上一个字段（循环） */
  focusPrevField: (currentId?: string) => void;
  /** 键盘事件处理函数，绑定到字段元素上 */
  handleKeyDown: (e: React.KeyboardEvent) => void;
  /** 注册字段聚焦事件，返回取消注册函数 */
  registerFieldFocus: (id: string) => () => void;
  /** 注册字段失焦事件，返回取消注册函数 */
  registerFieldBlur: (id: string) => () => void;
}

/**
 * 表单字段键盘导航 Hook
 *
 * @param options - 配置项
 * @returns 焦点状态与导航方法
 */
export const useFieldNavigation = ({
  items,
  getElement,
  config,
  onFocus,
  onBlur,
}: FieldNavigationOptions): UseFieldNavigationReturn => {
  // 用 ref 持有当前聚焦字段，避免触发重渲染（焦点变化通常不需要重渲染组件树）
  const focusedFieldRef = useRef<string | undefined>(undefined);
  const navigationConfig = config || {};
  const {
    enabled = true,
    autoFocusFirstField = true,
    tabBehavior = 'default',
    arrowKeyNavigation = true,
  } = navigationConfig;

  /**
   * 根据 id 查找对应的 FocusableItem
   *
   * 用于获取 per-item 的 onFocus/onBlur 回调。
   */
  const findItem = useCallback(
    (id: string): FocusableItem | undefined => {
      if (!Array.isArray(items) || items.length === 0) return undefined;
      if (typeof items[0] === 'string') return undefined;
      return (items as FocusableItem[]).find((item) => {
        const itemId = Array.isArray(item.id) ? item.id[0] : item.id;
        return itemId === id;
      });
    },
    [items],
  );

  /**
   * 提取所有可见字段名
   *
   * 统一处理 string[] 和 FocusableItem[] 两种输入格式，
   * 对于分组字段（id 为数组）取第一个作为导航目标。
   */
  const getVisibleFieldNames = useCallback((): string[] => {
    if (Array.isArray(items)) {
      if (items.length === 0) {
        return [];
      }
      if (typeof items[0] === 'string') {
        return items as string[];
      }
      return (items as FocusableItem[])
        .map((item) => (Array.isArray(item.id) ? item.id[0] : item.id))
        .filter((id): id is string => !!id);
    }
    return [];
  }, [items]);

  /**
   * 执行字段失焦逻辑
   *
   * 触发全局 onBlur 和 per-item onBlur 回调。
   */
  const triggerBlur = useCallback(
    (id: string) => {
      onBlur?.(id);
      const item = findItem(id);
      if (item?.onBlur) {
        item.onBlur(id);
      }
    },
    [onBlur, findItem],
  );

  /**
   * 执行字段聚焦逻辑
   *
   * 触发全局 onFocus 和 per-item onFocus 回调。
   */
  const triggerFocus = useCallback(
    (id: string) => {
      onFocus?.(id);
      const item = findItem(id);
      if (item?.onFocus) {
        item.onFocus(id);
      }
    },
    [onFocus, findItem],
  );

  /**
   * 聚焦指定字段
   *
   * 通过 getElement 获取 DOM 并调用 focus()，同时更新当前焦点状态
   * 并触发上一个字段的 blur 回调和当前字段的 focus 回调。
   */
  const focusField = useCallback(
    (id: string) => {
      const prevId = focusedFieldRef.current;
      if (prevId === id) return;

      const element = getElement(id);
      if (element) {
        element.focus();
      }

      focusedFieldRef.current = id;

      // 主动触发回调，不依赖 DOM 事件是否绑定
      if (prevId) {
        triggerBlur(prevId);
      }
      triggerFocus(id);
    },
    [getElement, triggerBlur, triggerFocus],
  );

  /**
   * 聚焦下一个字段（循环导航）
   *
   * @param currentId - 指定当前字段 id，不传则使用 ref 中的最近焦点
   */
  const focusNextField = useCallback(
    (currentId?: string) => {
      const fieldNames = getVisibleFieldNames();
      if (fieldNames.length === 0) {
        return;
      }

      const current = currentId || focusedFieldRef.current;
      let nextIndex = 0;

      if (current) {
        const currentIndex = fieldNames.indexOf(current);
        nextIndex = currentIndex + 1;
        // 越界则循环回首个
        if (nextIndex >= fieldNames.length) {
          nextIndex = 0;
        }
      }

      focusField(fieldNames[nextIndex]);
    },
    [getVisibleFieldNames, focusField],
  );

  /**
   * 聚焦上一个字段（循环导航）
   *
   * @param currentId - 指定当前字段 id，不传则使用 ref 中的最近焦点
   */
  const focusPrevField = useCallback(
    (currentId?: string) => {
      const fieldNames = getVisibleFieldNames();
      if (fieldNames.length === 0) {
        return;
      }

      const current = currentId || focusedFieldRef.current;
      let prevIndex = fieldNames.length - 1;

      if (current) {
        const currentIndex = fieldNames.indexOf(current);
        prevIndex = currentIndex - 1;
        // 越界则循环回末尾
        if (prevIndex < 0) {
          prevIndex = fieldNames.length - 1;
        }
      }

      focusField(fieldNames[prevIndex]);
    },
    [getVisibleFieldNames, focusField],
  );

  /**
   * 键盘事件处理
   *
   * 拦截 Tab / 方向键，触发循环导航。
   * - tabBehavior='next' 时拦截 Tab 并 preventDefault
   * - arrowKeyNavigation=true 时拦截上下方向键
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!enabled) {
        return;
      }

      const { key, shiftKey } = e;

      if (tabBehavior === 'next' && key === 'Tab') {
        e.preventDefault();
        if (shiftKey) {
          focusPrevField();
        } else {
          focusNextField();
        }
        return;
      }

      if (arrowKeyNavigation) {
        if (key === 'ArrowDown') {
          e.preventDefault();
          focusNextField();
        } else if (key === 'ArrowUp') {
          e.preventDefault();
          focusPrevField();
        }
      }
    },
    [enabled, tabBehavior, arrowKeyNavigation, focusNextField, focusPrevField],
  );

  /**
   * 注册字段聚焦事件
   *
   * 供字段元素的 onFocus 使用，记录焦点并触发 focus 回调。
   * 若当前焦点已在此字段上（如主动聚焦已触发过），则跳过避免重复调用。
   * 采用加法模式：全局 onFocus 和 per-item onFocus 都会调用。
   */
  const registerFieldFocus = useCallback(
    (id: string) => {
      // 已聚焦同一字段则跳过（防止 focusField 主动触发后 DOM 事件又触发一次）
      if (focusedFieldRef.current === id) {
        return () => {
          if (focusedFieldRef.current === id) {
            focusedFieldRef.current = undefined;
          }
        };
      }

      const prevId = focusedFieldRef.current;
      focusedFieldRef.current = id;

      if (prevId) {
        triggerBlur(prevId);
      }
      triggerFocus(id);

      return () => {
        if (focusedFieldRef.current === id) {
          focusedFieldRef.current = undefined;
        }
      };
    },
    [triggerBlur, triggerFocus],
  );

  /**
   * 注册字段失焦事件
   *
   * 供字段元素的 onBlur 使用，触发 blur 回调。
   * 若当前焦点已不在此字段上（如主动失焦已触发过），则跳过避免重复调用。
   * 采用加法模式：全局 onBlur 和 per-item onBlur 都会调用。
   */
  const registerFieldBlur = useCallback(
    (id: string) => {
      // 焦点已不在此字段上则跳过
      if (focusedFieldRef.current !== id) {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        return () => {};
      }

      focusedFieldRef.current = undefined;
      triggerBlur(id);

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      return () => {};
    },
    [triggerBlur],
  );

  // 首次挂载自动聚焦首个字段（setTimeout 0 等待 DOM 就绪）
  useEffect(() => {
    if (enabled && autoFocusFirstField) {
      const fieldNames = getVisibleFieldNames();
      if (fieldNames.length > 0) {
        const timer = setTimeout(() => {
          focusField(fieldNames[0]);
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [enabled, autoFocusFirstField, getVisibleFieldNames, focusField]);

  return {
    focusedField: focusedFieldRef.current,
    focusField,
    focusNextField,
    focusPrevField,
    handleKeyDown,
    registerFieldFocus,
    registerFieldBlur,
  };
};
