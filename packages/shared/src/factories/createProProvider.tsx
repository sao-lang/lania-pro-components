/**
 * @lania-pro-components/shared
 *
 * createProProvider — Provider 工厂
 *
 * 统一 ProForm / ProTable 等组件的 Provider 模式：
 * - 自动创建 Context + Provider + useContext
 * - Provider 只暴露引用稳定的 store/instance，不存快照字段（避免过期 bug）
 * - useContext 带强类型校验，未在 Provider 内使用时抛出明确错误
 *
 * 解决了 ProTable 的已知 bug：Provider 在 useMemo 创建时取了快照字段，
 * 依赖列表不全，子组件可能拿到过期值。
 *
 * @example
 * ```tsx
 * const { Provider, useContext: useMyContext, Context } = createProProvider<MyContextType>();
 *
 * // 在父组件中使用
 * <Provider value={contextValue}>
 *   <Child />
 * </Provider>
 *
 * // 在子组件中使用
 * const ctx = useMyContext(); // 强校验，不在 Provider 内会抛错
 * ```
 */
import React, { createContext, useContext } from 'react';

/**
 * createProProvider 返回值
 */
export interface ProProviderResult<TContext> {
  /** React Context */
  Context: React.Context<TContext | null>;
  /** Provider 组件 */
  Provider: React.FC<{ value: TContext; children: React.ReactNode }>;
  /** 消费 Context 的 Hook，带强校验 */
  useContext: () => TContext;
}

/**
 * 创建 Pro 风格的 Provider
 *
 * 提供标准的 Context + Provider + useContext 三元组，
 * 统一 ProForm / ProTable 等组件的 Provider 模式。
 *
 * @param displayName - 可选，Context 的 displayName（便于 DevTools 调试）
 */
export function createProProvider<TContext>(displayName?: string): ProProviderResult<TContext> {
  const Context = createContext<TContext | null>(null);

  if (displayName) {
    Context.displayName = displayName;
  }

  const Provider: React.FC<{ value: TContext; children: React.ReactNode }> = ({ value, children }) => {
    return React.createElement(Context.Provider, { value }, children);
  };

  function useProContext(): TContext {
    const ctx = useContext(Context);
    if (ctx === null) {
      throw new Error(
        `use${displayName || 'Pro'}Context must be used within its corresponding Provider. ` +
          `Make sure the component is wrapped with the Provider.`,
      );
    }
    return ctx;
  }

  return { Context, Provider, useContext: useProContext };
}
