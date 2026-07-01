import type { FormStoreAPI } from '../types';

/**
 * 全局 ProForm 实例注册表
 * 用于通过 instance name 获取已注册的 ProForm 实例
 */
class ProFormInstanceRegistry {
  private instances: Map<string, FormStoreAPI> = new Map();
  private listeners: Map<string, Set<() => void>> = new Map();

  /**
   * 注册 ProForm 实例
   * @param name 实例名称
   * @param instance ProForm 实例 (FormStore)
   */
  register(name: string, instance: FormStoreAPI): void {
    if (this.instances.has(name)) {
      console.warn(`ProForm instance with name "${name}" already exists, it will be overwritten.`);
    }
    this.instances.set(name, instance);
    this.notify(name);
  }

  /**
   * 取消注册 ProForm 实例
   * @param name 实例名称
   */
  unregister(name: string): void {
    this.instances.delete(name);
    this.notify(name);
  }

  /**
   * 获取 ProForm 实例
   * @param name 实例名称
   * @returns ProForm 实例，如果不存在则返回 undefined
   */
  get(name: string): FormStoreAPI | undefined {
    return this.instances.get(name);
  }

  /**
   * 检查是否存在指定名称的实例
   * @param name 实例名称
   * @returns 是否存在
   */
  has(name: string): boolean {
    return this.instances.has(name);
  }

  /**
   * 获取所有已注册的实例名称
   * @returns 实例名称数组
   */
  getAllNames(): string[] {
    return Array.from(this.instances.keys());
  }

  /**
   * 清空所有实例
   */
  clear(): void {
    this.instances.clear();
    this.listeners.clear();
  }

  /**
   * 订阅实例变化
   * @param name 实例名称
   * @param listener 监听器
   * @returns 取消订阅函数
   */
  subscribe(name: string, listener: () => void): () => void {
    const set = this.listeners.get(name) ?? new Set();
    set.add(listener);
    this.listeners.set(name, set);
    return () => {
      const current = this.listeners.get(name);
      if (!current) {
        return;
      }
      current.delete(listener);
      if (current.size === 0) {
        this.listeners.delete(name);
      }
    };
  }

  private notify(name: string): void {
    const set = this.listeners.get(name);
    if (!set) {
      return;
    }
    set.forEach((fn) => {
      try {
        fn();
      } catch {
        // ignore
      }
    });
  }
}

/**
 * 全局单例注册表
 */
export const instanceRegistry = new ProFormInstanceRegistry();

/**
 * 直接获取 ProForm 实例（非 Hook 版本）
 * @param name 实例名称
 * @returns ProForm 实例，如果不存在则返回 undefined
 */
export function getProFormInstance(name: string): FormStoreAPI | undefined {
  return instanceRegistry.get(name);
}
