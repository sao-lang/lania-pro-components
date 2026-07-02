import React, { createContext, useContext, useCallback } from 'react';
import type { ProTableProps } from '../types';

/**
 * RootContext - 全局配置层
 * 管理表格的全局配置和 rowKey 获取函数
 */
export interface RootContextValue<T = any> {
  /** 原始 props */
  props: ProTableProps<T>;
  /** 获取行 key 的函数 */
  getRowKey: (record: T) => string | number;
  /** rowKey 配置 */
  rowKey: string | ((record: T) => string | number);
}

const RootContext = createContext<RootContextValue<any> | null>(null);

export interface RootProviderProps<T = any> {
  children: React.ReactNode;
  props: ProTableProps<T>;
}

export const RootProvider = <T extends Record<string, any>>({ children, props }: RootProviderProps<T>) => {
  const rowKeyProp = props.rowKey ?? 'id';

  // 获取行 key 的函数
  const getRowKey = useCallback(
    (record: T): string | number => {
      if (typeof rowKeyProp === 'function') {
        return rowKeyProp(record);
      }
      return record[rowKeyProp] as string | number;
    },
    [rowKeyProp],
  );

  const value: RootContextValue<T> = {
    props,
    getRowKey,
    rowKey: rowKeyProp,
  };

  return <RootContext.Provider value={value}>{children}</RootContext.Provider>;
};

export const useRootContext = () => {
  const context = useContext(RootContext);
  if (!context) {
    throw new Error('useRootContext must be used within a RootProvider');
  }
  return context;
};
