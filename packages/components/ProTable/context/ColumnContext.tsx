/**
 * ColumnContext — 表格列上下文（列配置层）
 *
 * 管理表格列配置的响应式状态：
 * - columns: 当前列配置（支持显隐/排序/拖拽）
 * - density: 表格密度（default/middle/small）
 * - 列显隐切换（handleColumnsChange）
 * - 响应式列管理（useResponsive）
 *
 * 子组件通过 useColumnContext() 获取列配置。
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ProColumnType, TableDensity, ProTableProps } from '../types';
import { useResponsive, type Breakpoints } from '@lania-pro-components/shared';

export interface ColumnContextValue<T = Record<string, unknown>> {
  columns: ProColumnType<T>[];
  setColumns: (columns: ProColumnType<T>[]) => void;
  density: TableDensity;
  setDensity: (density: TableDensity) => void;
  handleColumnsChange: (columns: ProColumnType<T>[]) => void;
  handleDensityChange: (density: TableDensity) => void;
  groupColumns?: ProTableProps<T>['groupColumns'];
}

const ColumnContext = createContext<ColumnContextValue<Record<string, unknown>> | null>(null);

export interface ColumnProviderProps<T = Record<string, unknown>> {
  children: React.ReactNode;
  initialColumns: ProColumnType<T>[];
  onColumnsStateChange?: (columns: ProColumnType<T>[]) => void;
  onDensityChange?: (density: TableDensity) => void;
  persistenceKey?: string;
  responsive?: boolean;
  breakpoints?: Breakpoints;
  groupColumns?: ProTableProps<T>['groupColumns'];
}

function getStoredColumns<T>(persistenceKey: string): ProColumnType<T>[] | null {
  try {
    const stored = localStorage.getItem(persistenceKey);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // ignore
  }
  return null;
}

const getStoredDensity = (persistenceKey: string): TableDensity | null => {
  try {
    const stored = localStorage.getItem(`${persistenceKey}_density`);
    if (stored) {
      return JSON.parse(stored) as TableDensity;
    }
  } catch {
    // ignore
  }
  return null;
};

function setStoredColumns<T>(persistenceKey: string, columns: ProColumnType<T>[]) {
  try {
    localStorage.setItem(persistenceKey, JSON.stringify(columns));
  } catch {
    // ignore
  }
}

const setStoredDensity = (persistenceKey: string, density: TableDensity) => {
  try {
    localStorage.setItem(`${persistenceKey}_density`, JSON.stringify(density));
  } catch {
    // ignore
  }
};

export const ColumnProvider = <T extends Record<string, unknown>>({
  children,
  initialColumns,
  onColumnsStateChange,
  onDensityChange,
  persistenceKey,
  responsive,
  breakpoints,
  groupColumns,
}: ColumnProviderProps<T>) => {
  const [columns, setColumnsState] = useState<ProColumnType<T>[]>(() => {
    if (persistenceKey) {
      const stored = getStoredColumns<T>(persistenceKey);
      if (stored && stored.length > 0) {
        return stored;
      }
    }
    return initialColumns;
  });

  const [density, setDensityState] = useState<TableDensity>(() => {
    if (persistenceKey) {
      const stored = getStoredDensity(persistenceKey);
      if (stored) {
        return stored;
      }
    }
    return 'default';
  });

  const { state: responsiveState } = useResponsive({
    enabled: responsive,
    breakpoints,
  });

  const responsiveColumnCount = useCallback(() => {
    const bp = breakpoints || {};
    const map: Record<string, number> = {
      xs: bp.xs ?? 1,
      sm: bp.sm ?? 2,
      md: bp.md ?? 3,
      lg: bp.lg ?? 4,
      xl: bp.xl ?? 4,
      xxl: bp.xxl ?? 6,
    };
    return map[responsiveState.breakpoint] ?? 4;
  }, [responsiveState.breakpoint, breakpoints]);

  useEffect(() => {
    if (!responsive) {
      return;
    }

    const count = responsiveColumnCount();
    const visibleColumns = columns.filter((col) => col.valueType !== 'opr').slice(0, count);
    const visibleDataIndexes = new Set(visibleColumns.map((col) => String(col.dataIndex)));

    setColumnsState(
      columns.map((col) => ({
        ...col,
        hideInTable: col.valueType !== 'opr' && !visibleDataIndexes.has(String(col.dataIndex)),
      })),
    );
  }, [responsive, responsiveColumnCount, columns]);

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
      if (persistenceKey) {
        setStoredColumns(persistenceKey, newColumns);
      }
    },
    [onColumnsStateChange, persistenceKey],
  );

  const handleDensityChange = useCallback(
    (newDensity: TableDensity) => {
      setDensityState(newDensity);
      onDensityChange?.(newDensity);
      if (persistenceKey) {
        setStoredDensity(persistenceKey, newDensity);
      }
    },
    [onDensityChange, persistenceKey],
  );

  const value: ColumnContextValue<T> = {
    columns,
    setColumns,
    density,
    setDensity,
    handleColumnsChange,
    handleDensityChange,
    groupColumns,
  };

  return (
    <ColumnContext.Provider value={value as ColumnContextValue<Record<string, unknown>>}>
      {children}
    </ColumnContext.Provider>
  );
};

export const useColumnContext = <T extends Record<string, unknown> = Record<string, unknown>>() => {
  const context = useContext(ColumnContext);
  if (!context) {
    throw new Error('useColumnContext must be used within a ColumnProvider');
  }
  return context as ColumnContextValue<T>;
};
