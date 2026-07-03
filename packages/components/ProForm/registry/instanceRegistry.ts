/**
 * ProForm 实例注册中心
 *
 * @deprecated 请优先从 @lania-pro-components/utils 导入 createInstanceRegistry / InstanceRegistry
 * 此文件为向后兼容保留的 re-export 壳
 *
 * 提供表单实例的全局注册和订阅功能。
 * 通过为表单指定 name 属性，可以在应用的任何位置获取表单实例。
 *
 * @example
 * ```ts
 * import { getProFormInstance } from '@/components/ProForm';
 * const form = getProFormInstance('user-form');
 * form?.setValues({ name: 'Alice' });
 * ```
 */
import { createInstanceRegistry } from '@lania-pro-components/utils';
import type { FormStoreAPI } from '../types';

/**
 * 全局 ProForm 实例注册表
 * 用于通过 instance name 获取已注册的 ProForm 实例
 */
class ProFormInstanceRegistry {
  private registry = createInstanceRegistry<FormStoreAPI>();

  /**
   * 注册 ProForm 实例
   * @param name 实例名称
   * @param instance ProForm 实例 (FormStore)
   */
  register(name: string, instance: FormStoreAPI): void {
    this.registry.register(name, instance);
  }

  /**
   * 取消注册 ProForm 实例
   * @param name 实例名称
   */
  unregister(name: string): void {
    this.registry.unregister(name);
  }

  /**
   * 获取 ProForm 实例
   * @param name 实例名称
   * @returns ProForm 实例，如果不存在则返回 undefined
   */
  get(name: string): FormStoreAPI | undefined {
    return this.registry.get(name);
  }

  /**
   * 检查是否存在指定名称的实例
   * @param name 实例名称
   * @returns 是否存在
   */
  has(name: string): boolean {
    return this.registry.has(name);
  }

  /**
   * 获取所有已注册的实例名称
   * @returns 实例名称数组
   */
  getAllNames(): string[] {
    return this.registry.getAllNames();
  }

  /**
   * 清空所有实例
   */
  clear(): void {
    this.registry.clear();
  }

  /**
   * 订阅实例变化
   * @param name 实例名称
   * @param listener 监听器
   * @returns 取消订阅函数
   */
  subscribe(name: string, listener: () => void): () => void {
    return this.registry.subscribe(name, () => {
      const instance = this.registry.get(name);
      listener();
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
 * @returns ProForm 实例，如果不存在则 undefined
 */
export function getProFormInstance(name: string): FormStoreAPI | undefined {
  return instanceRegistry.get(name);
}
