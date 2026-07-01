import { Form } from '@arco-design/web-react';
import type { FormStore } from '../core/FormStore';

/**
 * Arco Form 实例接口（兼容 ProFormN 使用）
 */
export interface ArcoFormInstance {
  getFieldValue: (name: string) => unknown;
  getFieldsValue: () => Record<string, unknown>;
  setFieldValue: (name: string, value: unknown) => void;
  setFieldsValue: (values: Record<string, unknown>) => void;
  resetFields: (names?: string[]) => void;
  validate: (names?: string[]) => Promise<Record<string, unknown>>;
  submit: () => Promise<Record<string, unknown>>;
  getFieldsError: () => Record<string, string>;
  getFieldError: (name: string) => string | undefined;
  clearFields: () => void;
  scrollToField: (name: string) => void;
  setFieldError: (name: string, error: string | undefined) => void;
  setFields: (fields: Record<string, { value?: unknown; error?: string }>) => void;
  getFields: () => Record<string, { value?: unknown; error?: string }>;
  getInternalHooks: () => Record<string, unknown> | null;
  getInnerMethods: () => Record<string, unknown>;
}

/**
 * 创建与 Arco Form 兼容的 form 实例
 * 底层使用 FormStore，提供 Arco 所需的方法签名
 */
type ArcoFormHook = () => [ArcoFormInstance];

export function useArcoForm(_formStore: FormStore): ArcoFormInstance {
  const [arcoForm] = (Form as { useForm?: ArcoFormHook }).useForm?.() || [null];
  if (!arcoForm) {
    throw new Error('Arco Form useForm hook is not available');
  }
  return arcoForm;
}
