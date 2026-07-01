import React, { createContext, useContext, ReactNode, useMemo, useRef, useCallback } from 'react';

/**
 * 扩展 Context 注册表
 * 用于管理各种扩展 Context（权限、审计、国际化等）
 */
export interface ExtensionRegistry {
  [key: string]: unknown;
}

/**
 * ExtensionContext 值类型
 */
export interface ExtensionContextValue {
  extensions: ExtensionRegistry;
  registerExtension: (name: string, value: unknown) => void;
  unregisterExtension: (name: string) => void;
  getExtension: (name: string) => unknown;
}

/**
 * ExtensionContext - 扩展 Context
 */
export const ExtensionContext = createContext<ExtensionContextValue>({
  extensions: {},
  registerExtension: () => {},
  unregisterExtension: () => {},
  getExtension: () => undefined,
});

/**
 * ExtensionContext Provider 组件 Props
 */
export interface ExtensionContextProviderProps {
  children: ReactNode;
  initialExtensions?: ExtensionRegistry;
}

/**
 * ExtensionContext Provider 组件
 */
export const ExtensionContextProvider: React.FC<ExtensionContextProviderProps> = ({
  children,
  initialExtensions = {},
}) => {
  const extensionsRef = useRef<ExtensionRegistry>(initialExtensions);

  const registerExtension = useCallback((name: string, value: unknown) => {
    extensionsRef.current[name] = value;
  }, []);

  const unregisterExtension = useCallback((name: string) => {
    delete extensionsRef.current[name];
  }, []);

  const getExtension = useCallback((name: string) => extensionsRef.current[name], []);

  const value = useMemo(
    () => ({
      extensions: extensionsRef.current,
      registerExtension,
      unregisterExtension,
      getExtension,
    }),
    [registerExtension, unregisterExtension, getExtension],
  );

  return <ExtensionContext.Provider value={value}>{children}</ExtensionContext.Provider>;
};

/**
 * 使用 ExtensionContext 的 Hook
 */
export const useExtensionContext = (): ExtensionContextValue => {
  const context = useContext(ExtensionContext);
  if (!context) {
    throw new Error('useExtensionContext must be used within ExtensionContextProvider');
  }
  return context;
};

/**
 * 使用特定扩展的 Hook
 */
export const useExtension = <T = unknown,>(name: string): T | undefined => {
  const { getExtension } = useExtensionContext();
  return getExtension(name) as T;
};

// ========== 常用扩展类型定义 ==========

/**
 * 权限扩展 Context
 */
export interface PermissionExtension {
  /** 检查字段是否可见 */
  checkVisible: (fieldName: string) => boolean;
  /** 检查字段是否可编辑 */
  checkEditable: (fieldName: string) => boolean;
  /** 检查字段是否可查看 */
  checkReadable: (fieldName: string) => boolean;
  /** 权限数据 */
  permissions: Record<string, string>;
}

/**
 * 审计扩展 Context
 */
export interface AuditExtension {
  log: (action: string, data: Record<string, unknown>) => void;
  logFieldChange: (fieldName: string, oldValue: unknown, newValue: unknown) => void;
}

/**
 * 国际化扩展 Context
 */
export interface I18nExtension {
  t: (key: string, params?: Record<string, unknown>) => string;
  locale: string;
}
