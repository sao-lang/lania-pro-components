import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ProColumnType, TableDensity } from '../types';

/**
 * ColumnContext - 列配置层
 * 管理列配置和表格密度
 */
export interface ColumnContextValue<T = any> {
  /** 列配置 */
  columns: ProColumnType<T>[];
  /** 设置列配置 */
  setColumns: (columns: ProColumnType<T>[]) => void;
  /** 表格密度 */
  density: TableDensity;
  /** 设置表格密度 */
  setDensity: (density: TableDensity) => void;
  /** 处理列变化 */
  handleColumnsChange: (columns: ProColumnType<T>[]) => void;
  /** 处理密度变化 */
  handleDensityChange: (density: TableDensity) => void;
}

const ColumnContext = createContext<ColumnContextValue<any> | null>(null);

export interface ColumnProviderProps<T = any> {
  children: React.ReactNode;
  initialColumns: ProColumnType<T>[];
  onColumnsStateChange?: (columns: ProColumnType<T>[]) => void;
  onDensityChange?: (density: TableDensity) => void;
}

export const ColumnProvider = <T extends Record<string, any>>({
  children,
  initialColumns,
  onColumnsStateChange,
  onDensityChange,
}: ColumnProviderProps<T>) => {
  const [columns, setColumnsState] = useState<ProColumnType<T>[]>(initialColumns);
  const [density, setDensityState] = useState<TableDensity>('default');

  const setColumns = useCallback((newColumns: ProColumnType<T>[]) => {
    setColumnsState(newColumns);
  }, []);

  const setDensity = useCallback((newDensity: TableDensity) => {
    setDensityState(newDensity);
  }, []);

  const handleColumnsChange = useCallback(
    (newColumns: ProColumnType<T>[]) => {
      setColumnsState(newColumns);
      onColumnsStateChange?.(newColumns);
    },
    [onColumnsStateChange],
  );

  const handleDensityChange = useCallback(
    (newDensity: TableDensity) => {
      setDensityState(newDensity);
      onDensityChange?.(newDensity);
    },
    [onDensityChange],
  );

  const value: ColumnContextValue<T> = {
    columns,
    setColumns,
    density,
    setDensity,
    handleColumnsChange,
    handleDensityChange,
  };

  return <ColumnContext.Provider value={value}>{children}</ColumnContext.Provider>;
};

export const useColumnContext = () => {
  const context = useContext(ColumnContext);
  if (!context) {
    throw new Error('useColumnContext must be used within a ColumnProvider');
  }
  return context;
};
