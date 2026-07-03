/**
 * TableConfigContext — 表格全局配置上下文
 *
 * 合并用户传入的 props 和系统默认值，提供最终的表格配置。
 * 子组件可通过 useMergedConfig() 获取合并后的配置快照。
 */
import React, { createContext, useContext, useMemo, useCallback } from 'react';
import type { ProTableProps } from '../types';

/**
 * 表格全局配置类型
 */
export interface TableConfig {
  /** 默认分页大小 */
  defaultPageSize?: number;
  /** 分页大小选项 */
  pageSizeOptions?: number[];
  /** 是否显示边框 */
  bordered?: boolean;
  /** 表格密度 */
  density?: 'default' | 'middle' | 'compact';
  /** 是否显示工具栏 */
  showToolbar?: boolean;
  /** 是否显示列设置 */
  showColumnSetting?: boolean;
  /** 是否显示刷新按钮 */
  showRefresh?: boolean;
  /** 是否显示密度按钮 */
  showDensity?: boolean;
  /** 是否显示全屏按钮 */
  showFullscreen?: boolean;
  /** 搜索表单配置 */
  search?: ProTableProps['search'];
  /** 工具栏配置 */
  toolbar?: ProTableProps['toolbar'];
  /** 行选择配置 */
  rowSelection?: ProTableProps['rowSelection'];
  /** 批量操作配置 */
  batchOperation?: ProTableProps['batchOperation'];
  /** 分页配置 */
  pagination?: ProTableProps['pagination'];
  /** 卡片容器配置 */
  cardContainer?: ProTableProps['cardContainer'];
  /** URL 同步配置 */
  urlSync?: ProTableProps['urlSync'];
  /** 查询方案配置 */
  searchSchema?: ProTableProps['searchSchema'];
  /** 编辑配置 */
  editable?: ProTableProps['editable'];
  /** 请求前钩子 */
  beforeRequest?: ProTableProps['beforeRequest'];
  /** 请求后钩子 */
  afterRequest?: ProTableProps['afterRequest'];
  /** 请求错误回调 */
  onRequestError?: ProTableProps['onRequestError'];
  /** 数据格式化 */
  postData?: ProTableProps['postData'];
  /** 防抖时间 */
  debounceTime?: number;
  /** 轮询间隔 */
  polling?: ProTableProps['polling'];
  /** 是否手动触发请求 */
  manual?: boolean;
  /** 是否显示骨架屏 */
  showSkeleton?: boolean;
  /** 是否响应式 */
  responsive?: boolean;
  /** 空状态渲染 */
  emptyRender?: ProTableProps['emptyRender'];
  /** 错误状态渲染 */
  errorRender?: ProTableProps['errorRender'];
  /** 弹窗默认配置 */
  dialogConfig?: ProTableProps['dialogConfig'];
}

/**
 * Context 值类型
 */
interface TableConfigContextValue {
  /** 全局配置 */
  config: TableConfig;
  /** 更新配置 */
  setConfig: (config: Partial<TableConfig>) => void;
  /** 合并配置（组件 props 优先级高于全局配置） */
  mergeConfig: <T extends Record<string, unknown>>(props: T) => T & TableConfig;
}

/**
 * 默认配置
 */
const defaultConfig: TableConfig = {
  defaultPageSize: 20,
  pageSizeOptions: [10, 20, 50, 100],
  bordered: false,
  density: 'default',
  showToolbar: true,
  showColumnSetting: true,
  showRefresh: true,
  showDensity: true,
  showFullscreen: false,
  debounceTime: 300,
  manual: false,
  showSkeleton: false,
  responsive: true,
};

/**
 * 创建 Context
 */
const TableConfigContext = createContext<TableConfigContextValue | null>(null);

/**
 * 配置 Provider Props
 */
export interface TableConfigProviderProps {
  /** 子元素 */
  children: React.ReactNode;
  /** 初始配置 */
  config?: Partial<TableConfig>;
}

/**
 * 表格配置 Provider
 * 用于全局配置所有 ProTable 的默认行为
 */
export const TableConfigProvider: React.FC<TableConfigProviderProps> = ({ children, config: initialConfig = {} }) => {
  // 合并配置
  const config = useMemo(() => ({ ...defaultConfig, ...initialConfig }), [initialConfig]);

  // 更新配置（这里使用静态合并，实际应用中可能需要状态管理）
  const setConfig = useCallback((newConfig: Partial<TableConfig>) => {
    // 在实际应用中，这里应该更新状态
    // 目前仅作为占位符
    console.warn('TableConfigProvider.setConfig is not fully implemented', newConfig);
  }, []);

  // 合并配置（props 优先级高于全局配置）
  const mergeConfig = useCallback(
    <T extends Record<string, unknown>>(props: T): T & TableConfig => ({ ...config, ...props }),
    [config],
  );

  const value = useMemo(
    () => ({
      config,
      setConfig,
      mergeConfig,
    }),
    [config, setConfig, mergeConfig],
  );

  return <TableConfigContext.Provider value={value}>{children}</TableConfigContext.Provider>;
};

/**
 * 使用表格配置的 Hook
 */
export const useTableConfig = (): TableConfigContextValue => {
  const context = useContext(TableConfigContext);
  if (!context) {
    // 如果没有 Provider，返回默认值
    return {
      config: defaultConfig,
      setConfig: () => {},
      mergeConfig: <T extends Record<string, unknown>>(props: T) => ({ ...defaultConfig, ...props }) as T & TableConfig,
    };
  }
  return context;
};

/**
 * 获取合并后的配置
 * 用于在组件内部合并全局配置和组件 props
 */
export function useMergedConfig<T extends Record<string, unknown>>(props: T): T & TableConfig {
  const { mergeConfig } = useTableConfig();
  return mergeConfig(props);
}

export default TableConfigContext;
