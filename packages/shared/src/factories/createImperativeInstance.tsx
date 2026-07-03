/**
 * @lania-pro-components/shared
 *
 * createImperativeInstance — 命令式实例工厂
 *
 * 提供通用的命令式渲染能力，通过 ReactDOM.createRoot 动态挂载组件。
 * 从 ProDialog/dialogHolder.tsx 和 ProDialog/useProDialog.tsx 中的 createRoot 模板演化而来。
 *
 * 适用场景：
 * - ProDialog 命令式弹窗
 * - ProDrawer / ProToast 等需要动态挂载的组件
 *
 * @example
 * ```tsx
 * const dialogManager = createImperativeInstance(MyDialogComponent);
 * const instance = dialogManager.open({ title: 'Hello' });
 * instance.close();
 * dialogManager.closeAll();
 * ```
 */
import { createRoot, type Root } from 'react-dom/client';
import type { ReactNode } from 'react';

/**
 * 命令式实例管理器
 */
export interface ImperativeInstanceManager<P extends Record<string, unknown>> {
  /**
   * 打开/挂载一个实例
   * @param props 组件属性
   * @returns 控制句柄（close/update）
   */
  open: (props: P) => {
    close: () => void;
    update: (newProps: Partial<P>) => void;
  };
  /** 关闭所有实例 */
  closeAll: () => void;
}

/**
 * 创建命令式实例管理器
 *
 * @param render - 渲染函数，接收 props 返回 ReactNode
 * @param options - 配置选项
 * @returns ImperativeInstanceManager
 */
export function createImperativeInstance<P extends Record<string, unknown>>(
  render: (props: P) => ReactNode,
  options?: { autoDestroy?: boolean },
): ImperativeInstanceManager<P> {
  const { autoDestroy = true } = options || {};
  const instances = new Map<string, { root: Root; container: HTMLDivElement }>();
  let idCounter = 0;

  return {
    open(props: P) {
      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = createRoot(container);
      const id = `imperative-instance-${++idCounter}`;

      const renderInstance = (instanceProps: P) => {
        root.render(render(instanceProps));
      };

      renderInstance(props);
      instances.set(id, { root, container });

      return {
        close: () => {
          if (autoDestroy) {
            root.unmount();
          }
          if (container.parentNode) {
            container.parentNode.removeChild(container);
          }
          instances.delete(id);
        },
        update: (newProps: Partial<P>) => {
          renderInstance({ ...props, ...newProps } as P);
        },
      };
    },
    closeAll: () => {
      for (const [, { root, container }] of instances) {
        if (autoDestroy) {
          root.unmount();
        }
        if (container.parentNode) {
          container.parentNode.removeChild(container);
        }
      }
      instances.clear();
    },
  };
}
