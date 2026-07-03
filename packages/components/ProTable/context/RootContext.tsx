/**
 * RootContext — 表格根上下文（全局配置层）
 *
 * 存储 ProTable 的全局配置（props、rowKey、事件回调等）。
 * 是所有子 Context 的数据来源，子组件通过 useRootContext() 获取。
 */
import React, { createContext, useContext, useCallback } from 'react';
import type { ProTableProps } from '../types';

export interface RootContextValue<T = Record<string, unknown>> {
  props: ProTableProps<T>;
  getRowKey: (record: T) => string | number;
  rowKey: string | ((record: T) => string | number);
}

const RootContext = createContext<RootContextValue<Record<string, unknown>> | null>(null);

export interface RootProviderProps<T = Record<string, unknown>> {
  children: React.ReactNode;
  props: ProTableProps<T>;
}

export const RootProvider = <T extends Record<string, unknown>>({ children, props }: RootProviderProps<T>) => {
  const rowKeyProp = props.rowKey ?? 'id';

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

  return (
    <RootContext.Provider value={value as RootContextValue<Record<string, unknown>>}>{children}</RootContext.Provider>
  );
};

export const useRootContext = <T extends Record<string, unknown> = Record<string, unknown>>() => {
  const context = useContext(RootContext);
  if (!context) {
    throw new Error('useRootContext must be used within a RootProvider');
  }
  return context as RootContextValue<T>;
};
