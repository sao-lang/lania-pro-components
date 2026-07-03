/**
 * 表单配置上下文（FormConfigContext）
 *
 * 通过 FormConfigProvider 向子组件树提供表单全局配置。
 * 与 ProFormProvider 配合使用，支持表单实例的注册和全局访问。
 *
 * 使用场景：
 * - 跨组件层级获取表单实例
 * - 表单命名和标识
 */
import React, { createContext, useContext, useRef, useMemo, useCallback } from 'react';
import type { FormStoreAPI } from '../types';

/**
 * 表单配置上下文值
 */
export interface FormConfigContextValue {
  /** 表单名称 */
  formName?: string;
  /** 表单 Store 实例 */
  formStore: FormStoreAPI | null;
  /** 设置表单 Store 实例 */
  setFormStore: (instance: FormStoreAPI) => void;
}

const FormConfigContext = createContext<FormConfigContextValue | null>(null);

/**
 * 表单配置 Provider Props
 */
export interface FormConfigProviderProps {
  children: React.ReactNode;
  formName?: string;
}

/**
 * 表单配置 Provider
 */
export const FormConfigProvider: React.FC<FormConfigProviderProps> = ({ children, formName }) => {
  const formStoreRef = useRef<FormStoreAPI | null>(null);

  const setFormStore = useCallback((instance: FormStoreAPI) => {
    formStoreRef.current = instance;
  }, []);

  const value = useMemo(
    () => ({
      formName,
      formStore: formStoreRef.current,
      setFormStore,
    }),
    [formName, setFormStore],
  );

  return <FormConfigContext.Provider value={value}>{children}</FormConfigContext.Provider>;
};

/**
 * 使用表单配置上下文的 Hook
 */
export const useFormConfig = (): FormConfigContextValue => {
  const context = useContext(FormConfigContext);
  if (!context) {
    throw new Error('useFormConfig must be used within a FormConfigProvider');
  }
  return context;
};

/**
 * 检查是否在 FormConfigProvider 中
 */
export const useFormConfigOptional = (): FormConfigContextValue | null => useContext(FormConfigContext);
