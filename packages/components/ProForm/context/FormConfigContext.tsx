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
