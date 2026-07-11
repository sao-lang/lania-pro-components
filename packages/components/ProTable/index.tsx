/**
 * ProTable — 基于 Arco Design Table 的高级表格组件。
 *
 * 三层架构：
 * - useProTable（状态层）：DataStore / useRequest / useEditableTable / useDragSort
 * - ProTableStandalone + ProTableControlled（渲染层）：三层 Context 包裹、Toolbar、分页
 * - ProTable（调度层）：检测 table prop，分发到受控/独立模式
 *
 * 使用方式：
 * ```tsx
 * // 独立使用
 * <ProTable columns={[...]} request={fetchData} ref={tableRef} />
 *
 * // 配合 useProTable（避免重复实例）
 * const table = useProTable({ columns, request });
 * <ProTable table={table} />
 * ```
 *
 * 核心架构（三层 Context 设计）：
 * - RootContext: 全局配置层（props、rowKey、事件回调）
 * - DataContext: 数据状态层（DataStore + action 方法）
 * - ColumnContext: 列配置层（columns、密度、显隐）
 *
 * 功能特性：
 * - 查询表单（QueryForm）与表格联动
 * - 工具栏（Toolbar）按钮组
 * - 行操作按钮列（OprColumn）
 * - 批量操作（BatchOperation）
 * - 分页（Pagination）
 * - 可编辑表格（Editable）
 * - 虚拟滚动（VirtualScroll）
 * - 拖拽排序（DragSort）
 * - URL 参数同步（UrlSync）
 * - 卡片视图切换（CardView）
 * - TableDialog 命令式弹窗
 * - 自定义列渲染器（columnRender / cellMerge）
 */
import React, { useImperativeHandle, forwardRef, useRef, useMemo, useCallback, useState, useEffect } from 'react';
import { Card } from '@arco-design/web-react';
import type { ProTableProps, ProTableActionType, ProTableNEventHandlers } from './types';
import type { ProFormInstance } from '../ProForm/types';
import type { ProQueryFormInstance } from '../ProQueryForm';
import { RootProvider, DataProvider, ColumnProvider } from './context';
import { QueryForm, TableRenderer, Toolbar, Pagination, BatchOperation } from './components';
import { openDialog, confirm } from './components/TableDialog';
import { useProTable, ProTableContext } from './hooks/useProTable';
import type { ProTableInstance, ProTableContextValue } from './hooks/useProTable';
import type { DataStoreImpl } from './store/DataStore';
import { useDragSort } from './hooks';
import { useVirtualScroll } from '@lania-pro-components/shared';
import { CardView, ViewModeSwitch, SearchSchemaSelector } from './components';

/**
 * ProTable 组件 - 重构版高级表格组件
 *
 * 架构设计：
 * - RootContext: 全局配置层（props, rowKey）
 * - DataContext: 数据状态层（DataStore + action）
 * - ColumnContext: 列配置层（columns, density）
 *
 * 核心思想：
 * ProTable = DataStore + ColumnSchema + QueryForm + TableRenderer
 */
const ProTableStandalone = forwardRef<
  ProTableActionType<Record<string, unknown>>,
  ProTableProps<Record<string, unknown>>
>(<T extends Record<string, unknown>>(props: ProTableProps<T>, ref: React.Ref<ProTableActionType<T>>) => {
  // ===== 状态层：委托 useProTable 管理全部状态 =====
  const { instance, bindingProps, store } = useProTable<T>({ ...props });
  const mergedProps = { ...props, ...bindingProps } as ProTableProps<T>;

  const {
    columns,
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
    searchSchema: searchSchemaConfig,
    virtualScroll,
    virtualScrollConfig,
    dragSort,
    cardMode,
    viewMode: propViewMode,
    onViewModeChange,
    onCreate,
    onEdit,
    onView,
    onDelete,
    onExport,
    onImport,
    onDataSourceChange,
    headerTitle,
    dialogConfig,
    columnsStatePersistenceKey,
    showSkeleton,
    responsive,
    breakpoints,
    groupColumns,
    tableSummary,
    stickyHeader,
    cellMerge,
  } = mergedProps;

  const rowKeyStr = mergedProps.rowKey || 'id';

  const formRef = useRef<ProFormInstance | null>(null);
  const queryFormRef = useRef<ProQueryFormInstance>(null);

  // 视图模式状态（表格/卡片）
  const [viewMode, setViewMode] = useState<'table' | 'card'>(propViewMode || 'table');

  // 组合事件处理器
  const eventHandlers: ProTableNEventHandlers<T> = useMemo(
    () => ({ onCreate, onEdit, onView, onDelete, onExport, onImport }),
    [onCreate, onEdit, onView, onDelete, onExport, onImport],
  );

  useEffect(() => {
    if (propViewMode && propViewMode !== viewMode) setViewMode(propViewMode);
  }, [propViewMode]);

  const handleViewModeChange = useCallback(
    (mode: 'table' | 'card') => {
      setViewMode(mode);
      onViewModeChange?.(mode);
    },
    [onViewModeChange],
  );

  // 获取行 key
  const getRowKey = useCallback(
    (record: T): string | number =>
      typeof rowKeyStr === 'function'
        ? (rowKeyStr as (r: T) => string | number)(record)
        : ((record as Record<string, unknown>)[rowKeyStr as string] as string | number),
    [rowKeyStr],
  );

  // ===== 渲染层：拖拽排序 + 虚拟滚动 =====
  const {
    sortedDataSource: dragSortedDataSource,
    getDragRowProps,
    getDragHandleProps,
    resetSort: resetDragSort,
  } = useDragSort<T>({
    dataSource: instance.dataSource,
    config: typeof dragSort === 'object' ? dragSort : undefined,
    enabled: !!dragSort,
    getRowKey,
  });

  const {
    state: virtualScrollState,
    containerRef: virtualScrollContainerRef,
    onScroll: onVirtualScroll,
    scrollToIndex,
    scrollToTop: scrollToTopVirtual,
    scrollToBottom: scrollToBottomVirtual,
  } = useVirtualScroll<T>(dragSortedDataSource, {
    itemHeight: typeof virtualScrollConfig === 'object' ? (virtualScrollConfig.itemHeight ?? 50) : 50,
    overscan: typeof virtualScrollConfig === 'object' ? (virtualScrollConfig.overscan ?? 5) : 5,
    enabled: !!virtualScroll && viewMode === 'table',
    containerHeight: 400,
  });

  // 构建 action 对象（基于 instance 暴露给 ref）
  const action = useMemo<ProTableActionType<T>>(
    () => ({
      ...instance,
      clearSelected: () => instance.clearSelection(),
      getSelectedRows: () => instance.selectedRows,
      getSelectedRowKeys: () => instance.selectedRowKeys,
      setSelectedRows: (rows: T[]) => {
        const keys = rows.map((r) => getRowKey(r));
        instance.setSelectedRows(keys, rows);
      },
      reloadAndRest: () => {
        instance.reset();
      },
      reset: () => {
        formRef.current?.resetFields();
        instance.reset();
      },
      setSelectedRowKeys: (keys: (string | number)[]) => {
        const rows = instance.dataSource.filter((r: T) => keys.includes(getRowKey(r)));
        instance.setSelectedRows(keys, rows);
      },
      getPagination: () => instance.pagination,
      getParams: () => instance.query,
      setParams: (params: Record<string, unknown>) => instance.setQueryParams(params),
      getFormInstance: () => formRef.current ?? undefined,
      getPollingStatus: () => ({ isPolling: instance.isPolling, interval: instance.pollingInterval }),
      debouncedFetchData: () => {
        instance.fetchData();
      },
      openDialog: ((config: Parameters<typeof openDialog>[0]) => {
        const defaultOpenConfig = dialogConfig?.open || {};
        return openDialog({ ...defaultOpenConfig, ...config } as unknown as Parameters<typeof openDialog>[0]);
      }) as unknown as ProTableActionType['openDialog'],
      confirm: (config: Parameters<typeof confirm>[0]) => {
        const defaultConfirmConfig = dialogConfig?.confirm || {};
        return confirm({ ...defaultConfirmConfig, ...config });
      },
      scrollToIndex,
      scrollToTop: scrollToTopVirtual,
      scrollToBottom: scrollToBottomVirtual,
      resetDragSort,
    }),
    [
      instance,
      formRef,
      getRowKey,
      dialogConfig,
      scrollToIndex,
      scrollToTopVirtual,
      scrollToBottomVirtual,
      resetDragSort,
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
      {/* 表格标题 */}
      {headerTitle && (
        <div className='pro-table-header-title' style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
          {headerTitle}
        </div>
      )}

      {/* 查询表单 */}
      {search && <QueryForm formRef={formRef} ref={queryFormRef} />}

      {/* 工具栏 - 添加视图切换和查询方案选择器 */}
      {toolbar && (
        <Toolbar
          extraRender={
            <>
              {searchSchemaConfig?.enabled && queryFormRef.current && (
                <SearchSchemaSelector
                  schemas={queryFormRef.current.searchSchemas ?? []}
                  currentSchema={queryFormRef.current.currentSearchSchema}
                  onSwitch={queryFormRef.current.switchSearchSchema ?? (() => {})}
                  onSave={queryFormRef.current.saveSearchSchema ?? (() => {})}
                  onDelete={queryFormRef.current.deleteSearchSchema ?? (() => {})}
                  onRename={queryFormRef.current.renameSearchSchema}
                  getCurrentParams={() => ({
                    ...store.query,
                    ...formRef.current?.getFieldsValue(),
                  })}
                />
              )}
              {cardMode && <ViewModeSwitch viewMode={viewMode} onChange={handleViewModeChange} />}
            </>
          }
          handlers={eventHandlers as ProTableNEventHandlers}
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
                      handlers={eventHandlers as ProTableNEventHandlers}
                      refreshTable={() => action.reload()}
                      showSkeleton={showSkeleton}
                      tableSummary={tableSummary}
                      stickyHeader={stickyHeader}
                      cellMerge={cellMerge}
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
                  handlers={eventHandlers as ProTableNEventHandlers}
                  refreshTable={() => action.reload()}
                  showSkeleton={showSkeleton}
                  tableSummary={tableSummary}
                  stickyHeader={stickyHeader}
                  cellMerge={cellMerge}
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

  // ProTableContext 值
  const contextValue = useMemo<ProTableContextValue>(
    () => ({
      instance: instance as ProTableInstance<Record<string, unknown>>,
      bindingProps: bindingProps as ProTableProps<Record<string, unknown>>,
      store: store as DataStoreImpl<Record<string, unknown>>,
    }),
    [instance, bindingProps, store],
  );

  return (
    <ProTableContext.Provider value={contextValue}>
      <RootProvider props={props}>
        <DataProvider store={store} formRef={formRef} action={action} onDataSourceChange={onDataSourceChange}>
          <ColumnProvider
            initialColumns={columns}
            onColumnsStateChange={onColumnsStateChange}
            onDensityChange={onDensityChange}
            persistenceKey={columnsStatePersistenceKey}
            responsive={responsive}
            breakpoints={breakpoints}
            groupColumns={groupColumns}
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
    </ProTableContext.Provider>
  );
});

ProTableStandalone.displayName = 'ProTableStandalone';

/**
 * ProTableControlled — 受控模式。
 *
 * 接收外部 useProTable() 返回的 table 对象，
 * 将 bindingProps（数据层配置）合并到外部 props 后，委托给 ProTableStandalone 渲染。
 * 避免在多个位置重复创建 DataStore / useRequest / useEditableTable / useDragSort。
 *
 * UI 配置来源优先级：table.bindingProps > 外部 props
 */
const ProTableControlled = forwardRef<
  ProTableActionType<Record<string, unknown>>,
  ProTableProps<Record<string, unknown>>
>(<T extends Record<string, unknown>>(props: ProTableProps<T>, ref: React.Ref<ProTableActionType<T>>) => {
  const instance = props.table as ProTableInstance<T>;
  const { table: _omit, ...rest } = props;
  void _omit;

  // 将 instance 的状态作为 props 传入，useProTable 会通过 dataSource/loading/pagination 接管
  const mergedProps = {
    ...rest,
    dataSource: instance.dataSource,
    loading: instance.loading,
    pagination: instance.pagination,
  } as unknown as ProTableProps<Record<string, unknown>>;

  return <ProTableStandalone {...mergedProps} ref={ref as React.Ref<ProTableActionType<Record<string, unknown>>>} />;
});

ProTableControlled.displayName = 'ProTableControlled';

// ===== 调度层 =====
const ProTableComponent = forwardRef<
  ProTableActionType<Record<string, unknown>>,
  ProTableProps<Record<string, unknown>>
>(<T extends Record<string, unknown>>(props: ProTableProps<T>, ref: React.Ref<ProTableActionType<T>>) => {
  const commonRef = ref as React.Ref<ProTableActionType<Record<string, unknown>>>;
  const extendedProps = props as unknown as ProTableProps<Record<string, unknown>>;
  if (props.table) {
    return <ProTableControlled {...extendedProps} ref={commonRef} />;
  }
  return <ProTableStandalone {...extendedProps} ref={commonRef} />;
});

ProTableComponent.displayName = 'ProTable';

// 导出组件
export const ProTable = ProTableComponent as unknown as <T extends Record<string, unknown> = Record<string, unknown>>(
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

// 导出 Components（原 features/ 已合并到 components/）
export { QueryForm, TableRenderer, Toolbar, Pagination, BatchOperation, openDialog, confirm } from './components';

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
export default ProTable;
