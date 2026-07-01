import type { ProDialogInstance } from './types';

/**
 * ProDialog 实例注册表
 * 用于管理命名弹窗实例
 */
class InstanceRegistry {
  private instances = new Map<string, ProDialogInstance<any, any, any>>();

  /**
   * 注册实例
   * @param name 实例名称
   * @param instance 弹窗实例
   */
  register(name: string, instance: ProDialogInstance<any, any, any>): void {
    this.instances.set(name, instance);
  }

  /**
   * 注销实例
   * @param name 实例名称
   */
  unregister(name: string): void {
    this.instances.delete(name);
  }

  /**
   * 获取实例
   * @param name 实例名称
   */
  get(name: string): ProDialogInstance<any, any, any> | undefined {
    return this.instances.get(name);
  }

  /**
   * 获取所有实例
   */
  getAll(): Map<string, ProDialogInstance<any, any, any>> {
    return new Map(this.instances);
  }

  /**
   * 清空所有实例
   */
  clear(): void {
    this.instances.clear();
  }

  /**
   * 检查实例是否存在
   * @param name 实例名称
   */
  has(name: string): boolean {
    return this.instances.has(name);
  }
}

export const instanceRegistry = new InstanceRegistry();

/**
 * 获取 ProDialog 实例
 * @param name 实例名称
 */
export function getProDialogInstance(name: string): ProDialogInstance | undefined {
  return instanceRegistry.get(name);
}
