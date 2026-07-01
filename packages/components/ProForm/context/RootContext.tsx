import React, { createContext, useContext, ReactNode } from 'react';
import type { FormStatus, ProFormInstance } from '../types';
import type { ArcoFormInstance } from '../hooks/useArcoForm';

/**
 * 表单全局状态
 */
export interface FormState {
  /** 是否为草稿模式 */
  draft: boolean;
  /** 是否为只读模式 */
  readonly: boolean;
  /** 是否为禁用模式 */
  disabled: boolean;
  /** 是否为预览模式 */
  preview: boolean;
  /** 是否正在提交 */
  submitting: boolean;
  /** 当前表单状态 */
  status: FormStatus;
}

/**
 * RootContext 值类型
 */
export interface RootContextValue {
  /** 表单状态 */
  formState: FormState;
  /** 表单实例 */
  formInstance: ProFormInstance;
  /** Arco Form 实例 */
  arcoForm: ArcoFormInstance;
  /** 布局模式 */
  layout: 'horizontal' | 'vertical' | 'inline';
  /** 表单尺寸 */
  size: 'small' | 'default' | 'large';
  /** 表单值变化回调 */
  onValuesChange?: (changedValues: Record<string, unknown>, allValues: Record<string, unknown>) => void;
  /** 表单字段变化回调 */
  onFieldsChange?: (changedFields: unknown, allFields: unknown) => void;
  /** 表单提交回调 */
  onFinish?: (values: Record<string, unknown>) => void | Promise<void>;
  /** 表单提交失败回调 */
  onFinishFailed?: (errorInfo: unknown) => void;
}

/**
 * RootContext 默认值
 */
const defaultRootContext: RootContextValue = {
  formState: {
    draft: false,
    readonly: false,
    disabled: false,
    preview: false,
    submitting: false,
    status: 'edit',
  },
  formInstance: null as unknown as ProFormInstance,
  arcoForm: null as unknown as ArcoFormInstance,
  layout: 'vertical',
  size: 'default',
};

/**
 * RootContext - 全局状态上下文
 */
export const RootContext = createContext<RootContextValue>(defaultRootContext);

/**
 * RootContext Provider 组件
 */
export interface RootContextProviderProps {
  value: RootContextValue;
  children: ReactNode;
}

export const RootContextProvider: React.FC<RootContextProviderProps> = ({ value, children }) => (
  <RootContext.Provider value={value}>{children}</RootContext.Provider>
);

/**
 * 使用 RootContext 的 Hook
 */
export const useRootContext = (): RootContextValue => {
  const context = useContext(RootContext);
  if (!context) {
    throw new Error('useRootContext must be used within RootContextProvider');
  }
  return context;
};

/**
 * 创建表单状态
 */
export function createFormState(
  draft: boolean,
  readonly: boolean,
  disabled: boolean,
  preview: boolean,
  submitting: boolean,
): FormState {
  let status: FormStatus = 'edit';

  if (draft) {
    status = 'draft';
  } else if (preview) {
    status = 'preview';
  } else if (readonly) {
    status = 'readonly';
  } else if (disabled) {
    status = 'disabled';
  }

  return {
    draft,
    readonly,
    disabled,
    preview,
    submitting,
    status,
  };
}
