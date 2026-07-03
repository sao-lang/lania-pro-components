/**
 * @lania-pro-components/utils
 *
 * createStore — 轻量级 Store 工厂
 *
 * 提取 DataStore (ProTable) 和 FormStore (ProForm) 中共性的订阅机制，
 * 提供一个可复用的 Store 底座。不强制替换现有 Store，仅作为新 Store 的公共基础。
 *
 * @example
 * ```ts
 * const store = createStore({ count: 0, name: '' });
 *
 * // 订阅状态变化
 * const unsub = store.subscribe((state, prevState) => {
 *   if (state.count !== prevState.count) console.log('count changed');
 * });
 *
 * // 更新状态
 * store.setState({ count: 1 });
 * store.setState((prev) => ({ count: prev.count + 1 }));
 * ```
 */

/**
 * 状态变化监听器
 */
export type StoreListener<TState> = (state: TState, prevState: TState) => void;

/**
 * Store 实例
 */
export interface Store<TState extends Record<string, any>> {
  /** 获取当前状态（浅拷贝） */
  getState: () => TState;
  /** 设置状态（部分更新或函数式更新） */
  setState: (updater: Partial<TState> | ((prev: TState) => Partial<TState>)) => void;
  /** 订阅状态变化 */
  subscribe: (listener: StoreListener<TState>) => () => void;
  /** 重置到初始状态 */
  reset: () => void;
}

/**
 * 创建轻量级 Store
 *
 * @param initialState - 初始状态
 * @returns Store 实例
 */
export function createStore<TState extends Record<string, any>>(initialState: TState): Store<TState> {
  let state: TState = { ...initialState };
  const listeners = new Set<StoreListener<TState>>();

  return {
    getState: () => ({ ...state }),

    setState: (updater) => {
      const prevState = { ...state };
      const partial = typeof updater === 'function' ? (updater as (prev: TState) => Partial<TState>)(state) : updater;
      state = { ...state, ...partial };
      listeners.forEach((fn) => fn(state, prevState));
    },

    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    reset: () => {
      state = { ...initialState };
      listeners.forEach((fn) => fn(state, { ...state }));
    },
  };
}
