/**
 * @lania-pro-components/utils
 *
 * 通用实例注册中心
 *
 * 提供跨组件的实例注册、查找、订阅能力。
 * 合并自 ProDialog/instanceRegistry（基础版）和 ProForm/registry/instanceRegistry（含 subscribe 版）。
 *
 * 设计要点：
 * - 泛型化：支持任意类型的实例注册
 * - 支持实例变化订阅（subscribe），可在实例注册/注销时收到通知
 * - 提供 createInstanceRegistry 工厂函数创建独立实例
 * - 全局单例通过 createInstanceRegistry() 创建
 *
 * @example
 * ```ts
 * import { createInstanceRegistry, InstanceRegistry } from '@lania-pro-components/utils';
 *
 * interface MyInstance { open(): void; close(): void; }
 * const registry = createInstanceRegistry<MyInstance>();
 *
 * registry.register('my-instance', { open() {}, close() {} });
 * const instance = registry.get('my-instance');
 * registry.has('my-instance'); // true
 * registry.getAll(); // Map<string, MyInstance>
 * registry.unregister('my-instance');
 * registry.clear();
 *
 * // 订阅实例变化
 * const unsubscribe = registry.subscribe((name, instance) => {
 *   console.log(`Instance "${name}" changed:`, instance);
 * });
 * unsubscribe(); // 取消订阅
 * ```
 */

/**
 * 实例变化监听器
 * @param name 实例名称
 * @param instance 变更后的实例（注销时为 undefined）
 */
export type InstanceChangeListener<T> = (name: string, instance: T | undefined) => void;

/**
 * 实例注册中心类
 *
 * 泛型参数 T 为实例类型。
 * 内部使用 Map 存储 name → instance 的映射关系。
 * 支持注册、注销、查询、清空等操作。
 * 新增 subscribe 能力，可在实例注册/注销时收到通知。
 */
export class InstanceRegistry<T> {
  /** 存储实例的 Map */
  private instances = new Map<string, T>();
  /** 全局监听器：监听所有实例的注册/注销 */
  private globalListeners = new Set<InstanceChangeListener<T>>();
  /** 按名称的监听器：监听特定实例的注册/注销 */
  private namedListeners = new Map<string, Set<InstanceChangeListener<T>>>();

  /**
   * 注册实例
   *
   * @param name - 实例名称（唯一标识）
   * @param instance - 实例对象
   */
  register(name: string, instance: T): void {
    if (this.instances.has(name)) {
      console.warn(`InstanceRegistry: instance with name "${name}" already exists, it will be overwritten.`);
    }
    this.instances.set(name, instance);
    this.notify(name, instance);
  }

  /**
   * 注销实例
   *
   * @param name - 实例名称
   */
  unregister(name: string): void {
    this.instances.delete(name);
    this.notify(name, undefined);
  }

  /**
   * 获取指定名称的实例
   *
   * @param name - 实例名称
   * @returns 实例对象，未注册时返回 undefined
   */
  get(name: string): T | undefined {
    return this.instances.get(name);
  }

  /**
   * 检查指定名称的实例是否已注册
   *
   * @param name - 实例名称
   * @returns 是否已注册
   */
  has(name: string): boolean {
    return this.instances.has(name);
  }

  /**
   * 获取所有已注册的实例
   *
   * @returns 所有实例的 Map 副本（修改不影响内部存储）
   */
  getAll(): Map<string, T> {
    return new Map(this.instances);
  }

  /**
   * 获取所有已注册的实例名称
   *
   * @returns 实例名称数组
   */
  getAllNames(): string[] {
    return Array.from(this.instances.keys());
  }

  /**
   * 清空所有已注册的实例
   */
  clear(): void {
    this.instances.clear();
    this.globalListeners.clear();
    this.namedListeners.clear();
  }

  /**
   * 订阅实例变化
   *
   * 支持两种订阅方式：
   * 1. 订阅特定名称的实例变化：`subscribe('my-instance', listener)`
   * 2. 订阅所有实例变化：`subscribe(listener)`
   *
   * @param nameOrListener - 实例名称（可选）或监听器
   * @param listener - 监听器（当第一个参数为名称时需要）
   * @returns 取消订阅函数
   */
  subscribe(nameOrListener: string | InstanceChangeListener<T>, listener?: InstanceChangeListener<T>): () => void {
    // 订阅特定名称的实例变化
    if (typeof nameOrListener === 'string' && listener) {
      const set = this.namedListeners.get(nameOrListener) ?? new Set();
      set.add(listener);
      this.namedListeners.set(nameOrListener, set);
      return () => {
        const current = this.namedListeners.get(nameOrListener);
        if (!current) return;
        current.delete(listener);
        if (current.size === 0) {
          this.namedListeners.delete(nameOrListener);
        }
      };
    }

    // 订阅所有实例变化
    if (typeof nameOrListener === 'function') {
      this.globalListeners.add(nameOrListener);
      return () => {
        this.globalListeners.delete(nameOrListener);
      };
    }

    // 无效参数
    return () => {};
  }

  /**
   * 通知监听器实例变化
   */
  private notify(name: string, instance: T | undefined): void {
    // 通知全局监听器
    this.globalListeners.forEach((fn) => {
      try {
        fn(name, instance);
      } catch {
        // 忽略单个监听器的错误
      }
    });

    // 通知特定名称的监听器
    const namedSet = this.namedListeners.get(name);
    if (namedSet) {
      namedSet.forEach((fn) => {
        try {
          fn(name, instance);
        } catch {
          // 忽略单个监听器的错误
        }
      });
    }
  }
}

/**
 * 创建实例注册中心
 *
 * @returns 新的 InstanceRegistry 实例
 *
 * @example
 * ```ts
 * const registry = createInstanceRegistry<ProDialogInstance>();
 * registry.register('dialog', dialogInstance);
 * ```
 */
export function createInstanceRegistry<T>(): InstanceRegistry<T> {
  return new InstanceRegistry<T>();
}
