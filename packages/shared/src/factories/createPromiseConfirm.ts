/**
 * @lania-pro-components/shared
 *
 * createPromiseConfirm — Modal.confirm Promise 包装
 *
 * 统一包装 Modal.confirm 为 Promise 形式，消除 ProDialog 中 4 处重复的
 * `Modal.confirm({ onOk: () => resolve(true), onCancel: () => resolve(false) })` 代码。
 *
 * @example
 * ```tsx
 * const confirmed = await createPromiseConfirm({
 *   title: '确认删除',
 *   content: '确定要删除吗？',
 * });
 * if (confirmed) {
 *   // 执行删除
 * }
 * ```
 */
import { Modal } from '@arco-design/web-react';
import type { ModalProps } from '@arco-design/web-react';

/**
 * Confirm 配置选项
 */
export interface PromiseConfirmOptions extends Omit<ModalProps, 'onOk' | 'onCancel'> {
  /** 确认按钮文字 */
  okText?: string;
  /** 取消按钮文字 */
  cancelText?: string;
  /** 确认弹窗内容（文字或 ReactNode） */
  content?: React.ReactNode;
}

/**
 * 将 Modal.confirm 包装为 Promise
 *
 * @param options - 确认弹窗配置
 * @returns Promise<boolean> — true 表示用户点击确认，false 表示取消/关闭
 */
export function createPromiseConfirm(options: PromiseConfirmOptions): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    Modal.confirm({
      title: '确认',
      ...options,
      onOk: () => {
        resolve(true);
      },
      onCancel: () => {
        resolve(false);
      },
    });
  });
}
