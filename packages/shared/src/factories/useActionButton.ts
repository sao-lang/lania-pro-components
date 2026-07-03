/**
 * @lania-pro-components/shared
 *
 * useActionButton — ActionButton 通用工厂 Hook
 *
 * 消除 8 个 ActionButton 组件（Add/Edit/Delete/View/Batch/Export/Import/Jump）
 * 中重复的 handleClick 模板和 visible 判断逻辑。
 *
 * 重复代码：
 * ```ts
 * const handleClick = useCallback(
 *   (e) => {
 *     onClick?.(e);
 *     void handleXxx();
 *   },
 *   [onClick, handleXxx],
 * );
 * if (!visible) return null;
 * ```
 */
import { useCallback } from 'react';

/**
 * useActionButton 选项
 */
export interface UseActionButtonOptions {
  /** 是否可见 */
  visible?: boolean;
  /** 点击回调（在 onTrigger 之前执行） */
  onClick?: (e: Event) => void;
  /** 触发主体操作 */
  onTrigger: () => void | Promise<void>;
}

/**
 * useActionButton 返回值
 */
export interface UseActionButtonReturn {
  /** 处理点击事件：先执行 onClick，再执行 onTrigger */
  handleClick: (e: Event) => void;
  /** 是否应该渲染（由 visible 控制） */
  shouldRender: boolean;
}

/**
 * ActionButton 通用工厂 Hook
 *
 * 消除 8 个按钮文件中重复的 handleClick 模板和 visible 判断。
 *
 * @example
 * ```tsx
 * const { handleClick, shouldRender } = useActionButton({
 *   visible,
 *   onClick,
 *   onTrigger: handleOpen,
 * });
 *
 * if (!shouldRender) return null;
 * return <Button onClick={handleClick}>{text}</Button>;
 * ```
 */
export function useActionButton(options: UseActionButtonOptions): UseActionButtonReturn {
  const { visible = true, onClick, onTrigger } = options;

  const handleClick = useCallback(
    (e: Event) => {
      onClick?.(e);
      void onTrigger();
    },
    [onClick, onTrigger],
  );

  return {
    handleClick,
    shouldRender: visible,
  };
}
