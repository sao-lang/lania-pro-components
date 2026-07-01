import React, { createContext, useContext, ReactNode } from 'react';
import type { FieldStatus, FieldNodeAPI } from '../types';
import type { FormState } from './RootContext';

/**
 * FieldContext 值类型
 * 字段运行时上下文
 */
export interface FieldContextValue {
  // 身份标识
  name: string;
  label?: string;

  // 数据
  value: unknown;
  values: Record<string, unknown>;

  // 状态
  status: FieldStatus;
  focused?: boolean;
  computedBehavior: {
    visible: boolean;
    display: boolean;
    disabled: boolean;
    readonly: boolean;
    preview: boolean;
    required: boolean;
  };
  formState: FormState;
  error?: string;

  // 方法
  setValue: (value: unknown) => void;
  getFieldValue: (name: string) => unknown;
  getFieldsValue: () => Record<string, unknown>;
  validate: () => Promise<void>;
  setError: (error?: string) => void;
  clearError: () => void;

  // 字段节点实例
  fieldNode: FieldNodeAPI;
}

/**
 * FieldContext 默认值
 */
const defaultFieldContext: FieldContextValue = {
  name: '',
  value: undefined,
  values: {},
  status: 'edit',
  focused: false,
  computedBehavior: {
    visible: true,
    display: true,
    disabled: false,
    readonly: false,
    preview: false,
    required: false,
  },
  formState: {
    draft: false,
    readonly: false,
    disabled: false,
    preview: false,
    submitting: false,
    status: 'edit',
  },
  setValue: () => {},
  getFieldValue: () => undefined,
  getFieldsValue: () => ({}),
  validate: async () => {},
  setError: () => {},
  clearError: () => {},
  fieldNode: null as unknown as FieldNodeAPI,
};

/**
 * FieldContext - 字段运行时上下文
 */
export const FieldContext = createContext<FieldContextValue>(defaultFieldContext);

/**
 * FieldContext Provider 组件
 */
export interface FieldContextProviderProps {
  value: FieldContextValue;
  children: ReactNode;
}

export const FieldContextProvider: React.FC<FieldContextProviderProps> = ({ value, children }) => (
  <FieldContext.Provider value={value}>{children}</FieldContext.Provider>
);

/**
 * 使用 FieldContext 的 Hook
 */
export const useFieldContext = (): FieldContextValue => {
  const context = useContext(FieldContext);
  if (!context) {
    throw new Error('useFieldContext must be used within FieldContextProvider');
  }
  return context;
};

/**
 * 使用 FieldContext 的 Hook（可选，可能返回 null）
 */
export const useFieldContextOptional = (): FieldContextValue | null => useContext(FieldContext);
