/**
 * ProDialog 实例注册中心
 *
 * 提供弹窗实例的全局注册和管理功能。
 * 通过为弹窗指定 name 属性，可以在应用的任何位置通过 getProDialogInstance(name)
 * 获取到对应的弹窗实例，实现跨组件的弹窗控制。
 *
 * 使用场景：
 * 1. 全局单例弹窗的管理（如全局设置面板）
 * 2. 跨层级组件的弹窗联动
 * 3. 命令式调用已被注册的弹窗
 *
 * @example
 * ```tsx
 * // 注册弹窗实例
 * <ProDialog instance="settings-dialog" ... />
 *
 * // 在任意位置获取并操作
 * import { getProDialogInstance } from '@/components/ProDialog';
 * const dialog = getProDialogInstance('settings-dialog');
 * dialog?.open();
 * dialog?.close();
 * ```
 */

import type { ProDialogInstance } from './types';

/**
 * 实例注册中心类
 *
 * 内部使用 Map 存储 name → ProDialogInstance 的映射关系。
 * 支持注册、注销、查询、清空等操作。
 */
class InstanceRegistry {
  /** 存储弹窗实例的 Map，键为实例名称，值为实例对象 */
  private instances = new Map<string, ProDialogInstance>();

  /**
   * 注册弹窗实例
   *
   * @param name - 实例名称（唯一标识）
   * @param instance - 弹窗实例对象
   */
  register(name: string, instance: ProDialogInstance): void {
    this.instances.set(name, instance);
  }

  /**
   * 注销弹窗实例
   *
   * @param name - 实例名称
   */
  unregister(name: string): void {
    this.instances.delete(name);
  }

  /**
   * 获取指定名称的弹窗实例
   *
   * @param name - 实例名称
   * @returns 弹窗实例，未注册时返回 undefined
   */
  get(name: string): ProDialogInstance | undefined {
    return this.instances.get(name);
  }

  /**
   * 获取所有已注册的弹窗实例
   *
   * @returns 所有弹窗实例的 Map 副本（修改不影响内部存储）
   */
  getAll(): Map<string, ProDialogInstance> {
    return new Map(this.instances);
  }

  /**
   * 清空所有已注册的弹窗实例
   */
  clear(): void {
    this.instances.clear();
  }

  /**
   * 检查指定名称的弹窗实例是否已注册
   *
   * @param name - 实例名称
   * @returns 是否已注册
   */
  has(name: string): boolean {
    return this.instances.has(name);
  }
}

/** 全局弹窗实例注册中心单例 */
export const instanceRegistry = new InstanceRegistry();

/**
 * 获取已注册的弹窗实例
 *
 * 这是实例注册中心的主要对外 API。
 * 通过弹窗的 name 属性获取对应的实例对象，用于跨组件命令式调用。
 *
 * @param name - 弹窗实例名称（与 ProDialog 的 instance prop 对应）
 * @returns 弹窗实例对象，未注册时返回 undefined
 *
 * @example
 * ```tsx
 * const dialog = getProDialogInstance('user-form-dialog');
 * if (dialog) {
 *   dialog.setTitle('编辑用户');
 *   dialog.setFormValues({ name: 'Alice' });
 *   dialog.open();
 * }
 * ```
 */
export function getProDialogInstance(name: string): ProDialogInstance | undefined {
  return instanceRegistry.get(name);
}
