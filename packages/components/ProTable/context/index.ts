// 导出 RootContext（全局配置层）
export { RootProvider, useRootContext, type RootContextValue, type RootProviderProps } from './RootContext';

// 导出 DataContext（数据状态层）
export { DataProvider, useDataContext, type DataContextValue, type DataProviderProps } from './DataContext';

// 导出 ColumnContext（列配置层）
export { ColumnProvider, useColumnContext, type ColumnContextValue, type ColumnProviderProps } from './ColumnContext';

// 导出 TableConfigContext（表格全局配置层）
export {
  TableConfigProvider,
  useTableConfig,
  useMergedConfig,
  type TableConfig,
  type TableConfigProviderProps,
} from './TableConfigContext';

// 兼容旧版导出
export { useRootContext as useTableContext } from './RootContext';
