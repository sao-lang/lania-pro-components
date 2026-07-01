import React, { useImperativeHandle, forwardRef, useRef, useMemo, useCallback, useState, useEffect } from 'react';
import { Card } from '@arco-design/web-react';
import type { ProTableProps, ProTableActionType, ProTableRequest, ProTableNEventHandlers } from './types';
import type { ProFormInstance } from '../ProFormN/types';
import { RootProvider, DataProvider, ColumnProvider } from './context';
import { createDataStore } from './store/DataStore';
import { useRequest } from './request/useRequest';
import { QueryForm, TableRenderer, Toolbar, Pagination, BatchOperation } from './features';
import { openDialog, confirm } from './features/TableDialog';
import { useUrlSync, useSearchSchema, useProTable, useVirtualScroll, useDragSort, useCache } from './hooks';
import { useEditableTable } from './editable';
import { CardView, ViewModeSwitch, SearchSchemaSelector } from './components';

/**
 * ProTableN 组件 - 重构版高级表格组件
 *
 * 架构设计：
 * - RootContext: 全局配置层（props, rowKey）
 * - DataContext: 数据状态层（DataStore + action）
 * - ColumnContext: 列配置层（columns, density）
 *
 * 核心思想：
 * ProTable = DataStore + ColumnSchema + QueryForm + TableRenderer
 */
const ProTableComponent = forwardRef<ProTableActionType, ProTableProps<any>>(
  <T extends Record<string, any>>(props: ProTableProps<T>, ref: React.Ref<ProTableActionType>) => {
    const {
      columns,
      dataSource: propDataSource,
      request,
      params: propParams,
      defaultPageSize = 20,
      rowKey = 'id',
      search,
      toolbar,
      batchOperation,
      pagination: propPagination,
      pageSizeOptions = [10, 20, 50, 100],
      className,
      style,
      containerClassName,
      containerStyle,
      emptyRender,
      errorRender,
      cardContainer,
      onColumnsStateChange,
      onDensityChange,
      beforeRequest,
      afterRequest,
      onRequestError,
      postData,
      manual = false,
      debounceTime = 300,
      polling,
      urlSync,
      searchSchema: searchSchemaConfig,
      editable: editableConfig,
      defaultExpandAllRows,
      defaultExpandedRowKeys,
      expandedRowKeys: propExpandedRowKeys,
      expandedRowRender,
      // 第三批功能配置
      virtualScroll,
      virtualScrollConfig,
      dragSort,
      cardMode,
      viewMode: propViewMode,
      onViewModeChange,
      cache,
      cacheKey,
      // ActionButton 事件处理器
      onCreate,
      onEdit,
      onView,
      onDelete,
      onExport,
      onImport,
    } = props;

    const formRef = useRef<ProFormInstance | null>(null);

    // 展开行状态
    const [expandedRowKeys, setExpandedRowKeys] = useState<(string | number)[]>(defaultExpandedRowKeys || []);

    // 视图模式状态（表格/卡片）
    const [viewMode, setViewMode] = useState<'table' | 'card'>(propViewMode || 'table');

    // 组合事件处理器
    const eventHandlers: ProTableNEventHandlers = useMemo(
      () => ({
        onCreate,
        onEdit,
        onView,
        onDelete,
        onExport,
        onImport,
      }),
      [onCreate, onEdit, onView, onDelete, onExport, onImport],
    );

    // 同步外部 viewMode 变化
    useEffect(() => {
      if (propViewMode && propViewMode !== viewMode) {
        setViewMode(propViewMode);
      }
    }, [propViewMode]);

    // 视图模式变化回调
    const handleViewModeChange = useCallback(
      (mode: 'table' | 'card') => {
        setViewMode(mode);
        onViewModeChange?.(mode);
      },
      [onViewModeChange],
    );

    // 创建 DataStore
    const store = useMemo(
      () =>
        createDataStore<T>({
          initialData: propDataSource || [],
          initialQuery: propParams || {},
          initialPagination: {
            current: 1,
            pageSize: defaultPageSize,
          },
        }),
      [propDataSource, propParams, defaultPageSize],
    );

    // 使用缓存 Hook
    const cacheHookResult = useCache<{
      data: T[];
      total: number;
    }>({
      maxAge: typeof cache === 'object' ? cache.maxAge : undefined,
      maxSize: typeof cache === 'object' ? cache.maxSize : undefined,
    });

    // 使用请求 Hook
    const { fetchData, startPolling, stopPolling } = useRequest<T>({
      store,
      request: request as ProTableRequest<T>,
      manual,
      debounceTime,
      polling,
      beforeRequest,
      afterRequest,
      onRequestError,
      postData,
      cache: cache ? cacheHookResult : undefined,
      cacheKey,
      cacheEnabled: !!cache,
    });

    // 获取行 key 的函数
    const getRowKey = useCallback(
      (record: T): string | number => {
        if (typeof rowKey === 'function') {
          return rowKey(record);
        }
        return (record as Record<string, unknown>)[rowKey] as string | number;
      },
      [rowKey],
    );

    // 使用可编辑表格 Hook
    const {
      instance: editableInstance,
      startEditable,
      cancelEditable,
      saveEditable,
      deleteEditable,
    } = useEditableTable<Record<string, unknown>>({
      config: editableConfig as unknown as import('./editable/types').EditableConfig<Record<string, unknown>>,
      getRowKey: (record: Record<string, unknown>) => getRowKey(record as T),
      dataSource: store.dataSource,
    });

    // 使用 URL 同步 Hook
    useUrlSync({
      enabled: urlSync === true,
      store: store,
      config: typeof urlSync === 'object' ? urlSync : undefined,
    });

    // 使用查询方案 Hook
    const {
      schemas: searchSchemas,
      currentSchema: currentSearchSchema,
      saveSchema: saveSearchSchema,
      switchSchema: switchSearchSchema,
      deleteSchema: deleteSearchSchema,
      renameSchema: renameSearchSchema,
    } = useSearchSchema({
      enabled: searchSchemaConfig?.enabled ?? false,
      persistenceKey: searchSchemaConfig?.persistenceKey,
      defaultSchema: searchSchemaConfig?.defaultSchema,
      initialSchemas: searchSchemaConfig?.schemas,
    });

    // 切换查询方案时应用参数
    const handleSwitchSearchSchema = useCallback(
      (key: string) => {
        switchSearchSchema(key);
        const schema = searchSchemas.find((s) => s.key === key);
        if (schema) {
          store.setQuery(schema.params);
          formRef.current?.setFieldsValue(schema.params);
          store.setPage(1);
          store.reload();
        }
      },
      [switchSearchSchema, searchSchemas, store],
    );

    // 保存当前查询方案
    const handleSaveSearchSchema = useCallback(
      (name: string) => {
        const currentParams = {
          ...store.query,
          ...formRef.current?.getFieldsValue(),
        };
        saveSearchSchema(name, currentParams);
      },
      [saveSearchSchema, store.query, formRef],
    );

    // 使用 ProTable 实例管理 Hook
    useProTable<Record<string, unknown>>({
      store: store as unknown as import('./store/DataStore').DataStoreImpl<Record<string, unknown>>,
      editableInstance,
      expandedRowKeys,
      setExpandedRowKeys,
      getRowKey: (record: Record<string, unknown>) => getRowKey(record as T),
      dataSource: store.dataSource,
    });

    // 使用拖拽排序 Hook
    const {
      sortedDataSource: dragSortedDataSource,
      getDragRowProps,
      getDragHandleProps,
      resetSort: resetDragSort,
    } = useDragSort<T>({
      dataSource: store.dataSource,
      config: typeof dragSort === 'object' ? dragSort : undefined,
      enabled: !!dragSort,
      getRowKey,
    });

    // 使用虚拟滚动 Hook
    const {
      state: virtualScrollState,
      containerRef: virtualScrollContainerRef,
      onScroll: onVirtualScroll,
      scrollToIndex,
      scrollToTop: scrollToTopVirtual,
      scrollToBottom: scrollToBottomVirtual,
    } = useVirtualScroll<T>({
      dataSource: dragSortedDataSource,
      config: virtualScrollConfig || undefined,
      enabled: !!virtualScroll && viewMode === 'table',
      containerHeight: typeof virtualScrollConfig === 'object' ? virtualScrollConfig.itemHeight : 400,
    });

    // 默认展开所有行
    useEffect(() => {
      if (defaultExpandAllRows && store.dataSource.length > 0) {
        const allKeys = store.dataSource.map((record: T) => getRowKey(record));
        setExpandedRowKeys(allKeys);
      }
    }, [defaultExpandAllRows, store.dataSource, getRowKey]);

    // 构建 action 对象
    const action = useMemo<ProTableActionType>(
      () => ({
        // 重新加载
        reload: (resetPageIndex?: boolean) => {
          if (resetPageIndex) {
            store.setPage(1);
          }
          store.reload();
        },

        // 刷新并重置
        reloadAndRest: () => {
          store.reset();
          store.reload();
        },

        // 重置
        reset: () => {
          formRef.current?.resetFields();
          store.reset();
          store.reload();
        },

        // 清空选择
        clearSelected: () => {
          store.clearSelected();
        },

        // 设置选中行
        setSelectedRows: (rows: Record<string, unknown>[]) => {
          const keys = rows.map((row) => getRowKey(row as T));
          store.setSelectedRows(keys, rows as T[]);
        },

        // 设置选中行 keys
        setSelectedRowKeys: (keys: (string | number)[]) => {
          const rows = store.dataSource.filter((row: T) => keys.includes(getRowKey(row)));
          store.setSelectedRows(keys, rows);
        },

        // 获取选中行
        getSelectedRows: () => store.selectedRows,

        // 获取选中行 keys
        getSelectedRowKeys: () => store.selectedRowKeys,

        // 编辑相关
        startEditable,
        cancelEditable,
        saveEditable,
        deleteEditable,

        // 分页相关
        getPagination: () => ({
          current: store.pagination.current,
          pageSize: store.pagination.pageSize,
          total: store.total,
        }),

        setPagination: ({ current, pageSize }) => {
          if (current !== undefined) {
            store.setPage(current);
          }
          if (pageSize !== undefined) {
            store.setPageSize(pageSize);
          }
        },

        // 参数相关
        getParams: () => store.query,

        setParams: (params) => {
          store.setQuery(params);
        },

        // 表单实例
        getFormInstance: () => formRef.current ?? undefined,

        // 轮询相关
        startPolling,
        stopPolling,
        getPollingStatus: () => ({
          isPolling: store.isPolling,
          interval: store.pollingInterval,
        }),

        // 防抖请求
        debouncedFetchData: () => {
          fetchData();
        },

        // 弹窗相关
        openDialog: openDialog as unknown as ProTableActionType['openDialog'],
        confirm: confirm,

        // 第三批功能：虚拟滚动
        scrollToIndex,
        scrollToTop: scrollToTopVirtual,
        scrollToBottom: scrollToBottomVirtual,

        // 第三批功能：拖拽排序
        resetDragSort,

        // 第三批功能：缓存
        clearCache: cacheHookResult.clearCache,
      }),
      [
        store,
        getRowKey,
        fetchData,
        startPolling,
        stopPolling,
        startEditable,
        cancelEditable,
        saveEditable,
        deleteEditable,
        scrollToIndex,
        scrollToTopVirtual,
        scrollToBottomVirtual,
        resetDragSort,
        cacheHookResult.clearCache,
      ],
    );

    // 暴露 ref
    useImperativeHandle(ref, () => action, [action]);

    // 渲染错误状态
    const renderError = (err: Error) => {
      if (errorRender) {
        return errorRender(err, () => action.reload());
      }
      return (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ color: '#f53f3f', marginBottom: 16 }}>加载失败: {err.message}</div>
          <button onClick={() => action.reload()}>重试</button>
        </div>
      );
    };

    // 表格内容
    const tableContent = (
      <>
        {/* 查询表单 */}
        {search && <QueryForm formRef={formRef} />}

        {/* 工具栏 - 添加视图切换和查询方案选择器 */}
        {toolbar && (
          <Toolbar
            extraRender={
              <>
                {searchSchemaConfig?.enabled && (
                  <SearchSchemaSelector
                    schemas={searchSchemas}
                    currentSchema={currentSearchSchema}
                    onSwitch={handleSwitchSearchSchema}
                    onSave={handleSaveSearchSchema}
                    onDelete={deleteSearchSchema}
                    onRename={renameSearchSchema}
                    getCurrentParams={() => ({
                      ...store.query,
                      ...formRef.current?.getFieldsValue(),
                    })}
                  />
                )}
                {cardMode && <ViewModeSwitch viewMode={viewMode} onChange={handleViewModeChange} />}
              </>
            }
            handlers={eventHandlers}
            refreshTable={() => action.reload()}
          />
        )}

        {/* 批量操作 */}
        {batchOperation && <BatchOperation />}

        {/* 错误状态 */}
        {store.error ? (
          renderError(store.error)
        ) : (
          <>
            {/* 根据视图模式渲染表格或卡片 */}
            {viewMode === 'card' && cardMode ? (
              <CardView
                dataSource={dragSortedDataSource}
                columns={columns}
                cardMode={cardMode}
                action={action}
                loading={store.loading}
                emptyRender={emptyRender}
                getRowKey={getRowKey}
                selectedRowKeys={store.selectedRowKeys}
                onSelect={
                  props.rowSelection
                    ? (record, selected) => {
                        const key = getRowKey(record);
                        if (selected) {
                          const newKeys = [...store.selectedRowKeys, key];
                          const newRows = [...store.selectedRows, record];
                          store.setSelectedRows(newKeys, newRows);
                        } else {
                          const newKeys = store.selectedRowKeys.filter((k) => k !== key);
                          const newRows = store.selectedRows.filter((r) => getRowKey(r) !== key);
                          store.setSelectedRows(newKeys, newRows);
                        }
                      }
                    : undefined
                }
                multiple={typeof props.rowSelection === 'object' ? props.rowSelection.type !== 'radio' : true}
              />
            ) : (
              <div
                ref={virtualScrollContainerRef}
                onScroll={onVirtualScroll}
                style={virtualScroll ? { height: 400, overflow: 'auto' } : undefined}
              >
                {virtualScroll ? (
                  <div style={{ height: virtualScrollState.totalHeight }}>
                    <div
                      style={{
                        transform: `translateY(${virtualScrollState.offsetY}px)`,
                      }}
                    >
                      <TableRenderer
                        className={className}
                        style={style}
                        emptyRender={emptyRender}
                        dataSource={virtualScrollState.visibleItems}
                        dragSort={!!dragSort}
                        getDragRowProps={getDragRowProps}
                        getDragHandleProps={getDragHandleProps}
                        handlers={eventHandlers}
                        refreshTable={() => action.reload()}
                      />
                    </div>
                  </div>
                ) : (
                  <TableRenderer
                    className={className}
                    style={style}
                    emptyRender={emptyRender}
                    dataSource={dragSort ? dragSortedDataSource : store.dataSource}
                    dragSort={!!dragSort}
                    getDragRowProps={getDragRowProps}
                    getDragHandleProps={getDragHandleProps}
                    handlers={eventHandlers}
                    refreshTable={() => action.reload()}
                  />
                )}
              </div>
            )}

            {/* 分页 */}
            {propPagination !== false && viewMode === 'table' && <Pagination pageSizeOptions={pageSizeOptions} />}
          </>
        )}
      </>
    );

    return (
      <RootProvider props={props}>
        <DataProvider store={store} formRef={formRef} action={action}>
          <ColumnProvider
            initialColumns={columns}
            onColumnsStateChange={onColumnsStateChange}
            onDensityChange={onDensityChange}
          >
            {cardContainer ? (
              <Card
                title={typeof cardContainer === 'object' ? cardContainer.title : undefined}
                extra={typeof cardContainer === 'object' ? cardContainer.extra : undefined}
                bordered={typeof cardContainer === 'object' ? cardContainer.bordered : true}
                style={typeof cardContainer === 'object' ? cardContainer.style : undefined}
                className={typeof cardContainer === 'object' ? cardContainer.className : undefined}
                bodyStyle={typeof cardContainer === 'object' ? cardContainer.bodyStyle : undefined}
              >
                {tableContent}
              </Card>
            ) : (
              <div className={containerClassName} style={containerStyle}>
                {tableContent}
              </div>
            )}
          </ColumnProvider>
        </DataProvider>
      </RootProvider>
    );
  },
);

ProTableComponent.displayName = 'ProTableN';

// 导出组件
export const ProTableN = ProTableComponent as unknown as <T extends Record<string, any> = Record<string, any>>(
  props: ProTableProps<T> & React.RefAttributes<ProTableActionType>,
) => React.ReactElement;

// 导出类型
export type {
  ProTableProps,
  ProTableActionType,
  ProColumnType,
  ProColumnValueType,
  ProTableRequest,
  ProTableRequestParams,
  ProTableRequestResponse,
  ProTableToolbarConfig,
  ProTableBatchOperationConfig,
  ProTableRowSelectionConfig,
  TableDensity,
  OpenDialogConfig,
  ConfirmDialogConfig,
  DialogReturnProps,
  ProTableNEventHandlers,
  OprActionButtonConfig,
  ToolbarActionButtonConfig,
  OprColumnConfig,
  ToolbarActionConfig,
} from './types';

// 导出 Context
export {
  RootProvider,
  DataProvider,
  ColumnProvider,
  TableConfigProvider,
  useRootContext,
  useDataContext,
  useColumnContext,
  useTableConfig,
  useMergedConfig,
  useRootContext as useTableContext,
} from './context';

export type { TableConfig, TableConfigProviderProps } from './context';

// 导出 Store
export { createDataStore } from './store/DataStore';
export type { DataStoreState, DataStoreActions, CreateDataStoreOptions } from './store/types';

// 导出 Request
export { createRequestEngine } from './request/RequestEngine';
export type { RequestEngine, RequestEngineOptions } from './request/RequestEngine';

// 导出 Features
export { QueryForm, TableRenderer, Toolbar, Pagination, BatchOperation, openDialog, confirm } from './features';

// 导出 Hooks
export {
  useUrlSync,
  useSearchSchema,
  useProTable,
  useVirtualScroll,
  useDragSort,
  useCache,
  getGlobalCache,
  removeGlobalCache,
  clearAllGlobalCaches,
  useResponsive,
  useResponsiveColumns,
} from './hooks';

export type {
  ProTableInstance,
  UseProTableOptions,
  UseProTableReturn,
  UrlSyncConfig,
  SearchSchema,
  VirtualScrollConfig,
  VirtualScrollState,
  UseVirtualScrollReturn,
  DragSortConfig,
  DragState,
  UseDragSortReturn,
  CacheConfig,
  UseCacheReturn,
  ResponsiveConfig,
  ResponsiveState,
  Breakpoints,
  Breakpoint,
  UseResponsiveReturn,
} from './hooks';

// 导出 Editable
export { useEditableTable, EditableActions, EditableCell } from './editable';

export type { EditableConfig, EditableRowState, EditableCellConfig, EditableTableInstance } from './editable';

// 导出 Components
export {
  CardView,
  ViewModeSwitch,
  SkeletonTable,
  SkeletonCard,
  SearchSchemaSelector,
  DragSortTable,
} from './components';

export type {
  CardViewProps,
  CardModeConfig,
  CardGridConfig,
  ViewModeSwitchProps,
  SkeletonTableProps,
  SkeletonCardProps,
  SearchSchemaSelectorProps,
  DragSortTableProps,
} from './components';

// 导出工具函数
export {
  renderColumnByValueType,
  createColumnRender,
  convertColumns,
  customRendererRegistry,
  registerCellRenderer,
  unregisterCellRenderer,
  registerCellRenderers,
  getCellRenderer,
  hasCellRenderer,
  formatNumber,
  formatMoney,
  formatPercent,
  formatDate,
  getNestedValue,
  copyToClipboard,
  defineEnumMap,
  createRowMerge,
  createColMerge,
  combineMerge,
  calculateMergeState,
  getCellMergeProps,
} from './utils';

export type {
  CustomCellRenderer,
  CustomRendererRegistry,
  EnumItem,
  EnumHelper,
  CellMergeConfig,
  MergeState,
} from './utils';

// 默认导出
export default ProTableN;
