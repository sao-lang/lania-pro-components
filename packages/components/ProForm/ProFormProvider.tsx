import React from 'react';
import { FormConfigProvider } from './context/FormConfigContext';

export interface ProFormProviderProps {
  children: React.ReactNode;
  formName?: string;
}

/**
 * ProForm Provider 组件
 * 用于将表单配置传递给子组件树
 */
export const ProFormProvider: React.FC<ProFormProviderProps> = ({ children, formName }) => (
  <FormConfigProvider formName={formName}>{children}</FormConfigProvider>
);
