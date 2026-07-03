/**
 * ProTable 上下文模块
 *
 * 采用三层 Context 架构实现数据隔离与通信：
 *
 * 1. RootContext（根上下文）
 *    存储全局配置（props、rowKey、事件回调）
 *    组件内部通过 useRootContext() 获取
 *
 * 2. DataContext（数据上下文）
 *    存储 DataStore 状态 + action 操作方法
 *    组件内部通过 useDataContext() 获取
 *
 * 3. ColumnContext（列上下文）
 *    存储列配置、列显隐、密度
 *    组件内部通过 useColumnContext() 获取
 *
 * 4. TableConfigContext（表格配置层）
 *    存储合并后的完整配置
 *    组件内部通过 useTableConfig() 获取
 */

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
