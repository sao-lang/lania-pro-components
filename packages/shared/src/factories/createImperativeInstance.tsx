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
    /**
     * 打开/挂载一个实例
     *
     * 流程：创建容器 div → createRoot → 首次渲染 → 记录到 instances Map。
     * 返回的句柄支持 close（卸载）和 update（部分更新 props 重渲染）。
     */
    open(props: P) {
      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = createRoot(container);
      const id = `imperative-instance-${++idCounter}`;

      // 渲染函数：接收 props 调用外部传入的 render 回调
      const renderInstance = (instanceProps: P) => {
        root.render(render(instanceProps));
      };

      renderInstance(props);
      instances.set(id, { root, container });

      return {
        /** 关闭当前实例：卸载 React 树并移除 DOM 容器 */
        close: () => {
          if (autoDestroy) {
            root.unmount();
          }
          if (container.parentNode) {
            container.parentNode.removeChild(container);
          }
          instances.delete(id);
        },
        /** 更新当前实例的 props（部分更新，与旧 props 合并后重渲染） */
        update: (newProps: Partial<P>) => {
          renderInstance({ ...props, ...newProps } as P);
        },
      };
    },
    /** 关闭所有实例：遍历卸载并移除 DOM，最后清空 Map */
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
