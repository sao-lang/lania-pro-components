/**
 * ProDialog 实例注册中心
 *
 * @deprecated 请优先从 @lania-pro-components/utils 导入 createInstanceRegistry / InstanceRegistry
 * 此文件为向后兼容保留的 re-export 壳
 *
 * 提供弹窗实例的全局注册和管理功能。
 * 通过为弹窗指定 name 属性，可以在应用的任何位置通过 getProDialogInstance(name)
 * 获取到对应的弹窗实例，实现跨组件的弹窗控制。
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

import { createInstanceRegistry, InstanceRegistry } from '@lania-pro-components/utils';
import type { ProDialogInstance } from './types';

/** 全局弹窗实例注册中心单例 */
export const instanceRegistry = createInstanceRegistry<ProDialogInstance>();

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
