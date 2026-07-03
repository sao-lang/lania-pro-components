/**
 * ProFormProvider 组件
 *
 * 将表单全局配置通过 React Context 传递给子组件树。
 * 当前支持 formName 配置，用于表单实例的标识和全局访问。
 *
 * @example
 * ```tsx
 * <ProFormProvider formName="user-form">
 *   <FormField ... />
 * </ProFormProvider>
 * ```
 */
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
