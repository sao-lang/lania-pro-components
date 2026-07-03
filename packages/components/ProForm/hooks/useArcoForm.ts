/**
 * Arco Form 实例获取 Hook
 *
 * 获取 Arco Design Form 实例，用于与 ProForm 的 FormStore 对接。
 * 是 ProForm 内部连接 Arco Form 和自定义 FormStore 的桥梁。
 *
 * @param _formStore - ProForm 的 FormStore 实例（当前未使用，保留为后续扩展预留）
 * @returns Arco Design 的 FormInstance 实例
 */
import { Form } from '@arco-design/web-react';
import type { FormInstance } from '@arco-design/web-react/es/Form/interface';
import type { FormStore } from '../core/FormStore';

export type ArcoFormInstance = FormInstance<Record<string, unknown>, unknown, string>;

export function useArcoForm(_formStore: FormStore): ArcoFormInstance {
  const [arcoForm] = Form.useForm?.() || [];
  if (!arcoForm) {
    throw new Error('Arco Form useForm hook is not available');
  }
  return arcoForm as ArcoFormInstance;
}
