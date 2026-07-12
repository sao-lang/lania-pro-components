/**
 * ProTable �?基于 Arco Design Table 的高级表格组件�? *
 * 三层架构�? * - useProTable（状态层）：DataStore / useRequest / useEditableTable / useDragSort
 * - ProTableStandalone + ProTableControlled（渲染层）：三层 Context 包裹、Toolbar、分�? * - ProTable（调度层）：检�?table prop，分发到受控/独立模式
 *
 * 使用方式�? * ```tsx
 * // 独立使用
 * <ProTable columns={[...]} request={fetchData} ref={tableRef} />
 *
 * // 配合 useProTable（避免重复实例）
 * const table = useProTable({ columns, request });
 * <ProTable table={table} />
 * ```
 *
 * 核心架构（三�?Context 设计）：
 * - RootContext: 全局配置层（props、rowKey、事件回调）
 * - DataContext: 数据状态层（DataStore + action 方法�? * - ColumnContext: 列配置层（columns、密度、显隐）
 *
 * 功能特性：
 * - 查询表单（QueryForm）与表格联动
 * - 工具栏（Toolbar）按钮组
 * - 行操作按钮列（OprColumn�? * - 批量操作（BatchOperation�? * - 分页（Pagination�? * - 可编辑表格（Editable�? * - 虚拟滚动（VirtualScroll�? * - 拖拽排序（DragSort�? * - URL 参数同步（UrlSync�? * - 卡片视图切换（CardView�? * - ProDialog 命令式弹窗（复用 ProDialog 组件�? * - 自定义列渲染器（columnRender / cellMerge�? */
import React, { useImperativeHandle, forwardRef, useRef, useMemo, useCallback, useState, useEffect } from 'react';
import { Card } from '@arco-design/web-react';
import type { ProTableProps, ProTableActionType, ProTableNEventHandlers } from '../types';
import type { ProFormInstance } from '../../ProForm/types';
import type { ProQueryFormInstance } from '../../ProQueryForm';
import { RootProvider, DataProvider, ColumnProvider } from '../context';
import { QueryForm, TableContent, Toolbar, Pagination, BatchOperation } from './';
import { ProDialog } from '../../ProDialog';
import { useProTable, ProTableContext } from '../hooks/useProTable';
import type { ProTableContextValue } from '../hooks/useProTable';
import type { ProTableInstance } from '../types';
import type { DataStoreImpl } from '../store/DataStore';
import { useDragSort } from '../hooks';
import { useVirtualScroll } from '@lania-pro-components/shared';
import { CardView, ViewModeSwitch, SearchSchemaSelector } from './';

/**
 * ProTable 组件 - 重构版高级表格组�? *
 * 架构设计�? * - RootContext: 全局配置层（props, rowKey�? * - DataContext: 数据状态层（DataStore + action�? * - ColumnContext: 列配置层（columns, density�? *
 * 核心思想�? * ProTable = DataStore + ColumnSchema + QueryForm + TableContent
 */
interface ProTableRendererProps<T = Record<string, unknown>> {
  mergedProps: ProTableProps<T>;
  instance: ProTableInstance<T>;
  store: DataStoreImpl<T>;
}

const ProTableRenderer = forwardRef<
  ProTableActionType<Record<string, unknown>>,
  ProTableRendererProps<Record<string, unknown>>
>(
  (
    { mergedProps, instance, store }: ProTableRendererProps<Record<string, unknown>>,
    ref: React.Ref<ProTableActionType<Record<string, unknown>>>,
  ) => {
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

    const [viewMode, setViewMode] = useState<'table' | 'card'>(propViewMode || 'table');

    const eventHandlers: ProTableNEventHandlers<Record<string, unknown>> = useMemo(
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

    const getRowKey = useCallback(
      (record: Record<string, unknown>): string | number =>
        typeof rowKeyStr === 'function'
          ? (rowKeyStr as (r: Record<string, unknown>) => string | number)(record)
          : ((record as Record<string, unknown>)[rowKeyStr as string] as string | number),
      [rowKeyStr],
    );

    const {
      sortedDataSource: dragSortedDataSource,
      getDragRowProps,
      getDragHandleProps,
      resetSort: resetDragSort,
    } = useDragSort<Record<string, unknown>>({
      dataSource: instance.dataSource,
      config: typeof dragSort === 'object' ? dragSort : undefined,
      enabled: !!dragSort,
      getRowKey,
    });

    const {
      state: virtualScrollState,
      containerRef: virtualScrollContainerRef,
      scrollToIndex,
      scrollToTop: scrollToTopVirtual,
      scrollToBottom: scrollToBottomVirtual,
    } = useVirtualScroll<Record<string, unknown>>(dragSortedDataSource, {
      itemHeight: typeof virtualScrollConfig === 'object' ? (virtualScrollConfig.itemHeight ?? 50) : 50,
      overscan: typeof virtualScrollConfig === 'object' ? (virtualScrollConfig.overscan ?? 5) : 5,
      enabled: !!virtualScroll && viewMode === 'table',
      containerHeight: 400,
    });

    useEffect(() => {
      const form = formRef.current ?? undefined;
      instance.form = form;
      instance.action.getFormInstance = () => form;
    }, [formRef.current]);

    useEffect(() => {
      const originalReset = instance.action.reset;

      Object.assign(instance.action, {
        reset: () => {
          formRef.current?.resetFields();
          originalReset();
        },
        openDialog: ((config: Parameters<typeof ProDialog.open>[0]) => {
          const defaultOpenConfig = dialogConfig?.open || {};
          return ProDialog.open({ ...defaultOpenConfig, ...config } as unknown as Parameters<typeof ProDialog.open>[0]);
        }) as ProTableActionType['openDialog'],
        confirm: (config: Parameters<typeof ProDialog.confirm>[0]) => {
          const defaultConfirmConfig = dialogConfig?.confirm || {};
          return ProDialog.confirm({ ...defaultConfirmConfig, ...config });
        },
        scrollToIndex,
        scrollToTop: scrollToTopVirtual,
        scrollToBottom: scrollToBottomVirtual,
        resetDragSort,
      });
    }, [dialogConfig, scrollToIndex, scrollToTopVirtual, scrollToBottomVirtual, resetDragSort, instance.action]);

    useImperativeHandle(ref, () => instance.action, [instance.action]);

    const renderError = (err: Error) => {
      if (errorRender) {
        return errorRender(err, () => instance.action.reload());
      }
      return (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ color: '#f53f3f', marginBottom: 16 }}>加载失败: {err.message}</div>
          <button onClick={() => instance.action.reload()}>重试</button>
        </div>
      );
    };

    const tableContent = (
      <>
        {headerTitle && (
          <div className='pro-table-header-title' style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
            {headerTitle}
          </div>
        )}

        {search && <QueryForm formRef={formRef} ref={queryFormRef} />}

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
            refreshTable={() => instance.action.reload()}
          />
        )}

        {batchOperation && <BatchOperation />}

        {store.error ? (
          renderError(store.error)
        ) : (
          <>
            {viewMode === 'card' && cardMode ? (
              <CardView
                dataSource={dragSortedDataSource}
                columns={columns}
                cardMode={cardMode}
                action={instance.action}
                loading={store.loading}
                emptyRender={emptyRender}
                getRowKey={getRowKey}
                selectedRowKeys={store.selectedRowKeys}
                onSelect={
                  mergedProps.rowSelection
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
                multiple={
                  typeof mergedProps.rowSelection === 'object' ? mergedProps.rowSelection.type !== 'radio' : true
                }
              />
            ) : (
              <div
                ref={virtualScrollContainerRef}
                style={virtualScroll ? { height: 400, overflow: 'auto' } : undefined}
              >
                {virtualScroll ? (
                  <div style={{ height: virtualScrollState.totalHeight }}>
                    <div
                      style={{
                        transform: `translateY(${virtualScrollState.offsetY}px)`,
                      }}
                    >
                      <TableContent
                        className={className}
                        style={style}
                        emptyRender={emptyRender}
                        dataSource={virtualScrollState.visibleItems}
                        dragSort={!!dragSort}
                        getDragRowProps={getDragRowProps}
                        getDragHandleProps={getDragHandleProps}
                        handlers={eventHandlers as ProTableNEventHandlers}
                        refreshTable={() => instance.action.reload()}
                        showSkeleton={showSkeleton}
                        tableSummary={tableSummary}
                        stickyHeader={stickyHeader}
                        cellMerge={cellMerge}
                      />
                    </div>
                  </div>
                ) : (
                  <TableContent
                    className={className}
                    style={style}
                    emptyRender={emptyRender}
                    dataSource={dragSort ? dragSortedDataSource : store.dataSource}
                    dragSort={!!dragSort}
                    getDragRowProps={getDragRowProps}
                    getDragHandleProps={getDragHandleProps}
                    handlers={eventHandlers as ProTableNEventHandlers}
                    refreshTable={() => instance.action.reload()}
                    showSkeleton={showSkeleton}
                    tableSummary={tableSummary}
                    stickyHeader={stickyHeader}
                    cellMerge={cellMerge}
                  />
                )}
              </div>
            )}

            {propPagination !== false && viewMode === 'table' && <Pagination pageSizeOptions={pageSizeOptions} />}
          </>
        )}
      </>
    );

    const contextValue = useMemo<ProTableContextValue>(
      () => ({
        instance: instance as ProTableInstance<Record<string, unknown>>,
        bindingProps: mergedProps as ProTableProps<Record<string, unknown>>,
        store: store as DataStoreImpl<Record<string, unknown>>,
      }),
      [instance, mergedProps, store],
    );

    return (
      <ProTableContext.Provider value={contextValue}>
        <RootProvider props={mergedProps}>
          <DataProvider
            store={store}
            formRef={formRef}
            action={instance.action}
            onDataSourceChange={onDataSourceChange}
          >
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
  },
);

ProTableRenderer.displayName = 'ProTableRenderer';

const ProTableStandalone = forwardRef<
  ProTableActionType<Record<string, unknown>>,
  ProTableProps<Record<string, unknown>>
>(<T extends Record<string, unknown>>(props: ProTableProps<T>, ref: React.Ref<ProTableActionType<T>>) => {
  const { instance, bindingProps, store } = useProTable<T>({ ...props });
  const mergedProps = { ...props, ...bindingProps } as ProTableProps<T>;
  const Provider = useMemo(() => {
    const P: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <ProTableContext.Provider
        value={{
          instance: instance as ProTableInstance<Record<string, unknown>>,
          bindingProps: bindingProps as ProTableProps<Record<string, unknown>>,
          store: store as DataStoreImpl<Record<string, unknown>>,
        }}
      >
        {children}
      </ProTableContext.Provider>
    );
    return P;
  }, [instance, bindingProps, store]);
  return (
    <Provider>
      <ProTableRenderer
        mergedProps={mergedProps as unknown as ProTableProps<Record<string, unknown>>}
        instance={instance as unknown as ProTableInstance<Record<string, unknown>>}
        store={store as unknown as DataStoreImpl<Record<string, unknown>>}
        ref={ref as React.Ref<ProTableActionType<Record<string, unknown>>>}
      />
    </Provider>
  );
});

ProTableStandalone.displayName = 'ProTableStandalone';

/**
 * ProTableControlled �?受控模式�? *
 * 接收外部 useProTable() 返回�?table 对象�? * 使用 instance.getProps() 获取最新的 bindingProps，直接委托给 ProTableRenderer 渲染�? * 避免在多个位置重复创�?DataStore / useRequest / useEditableTable / useDragSort�? *
 * UI 配置来源优先级：table.bindingProps > 外部 props
 */
const ProTableControlled = forwardRef<
  ProTableActionType<Record<string, unknown>>,
  ProTableProps<Record<string, unknown>>
>(<T extends Record<string, unknown>>(props: ProTableProps<T>, ref: React.Ref<ProTableActionType<T>>) => {
  const instance = props.instance as ProTableInstance<Record<string, unknown>>;
  const bindingProps = instance.getProps();
  const store = (instance as unknown as { store: DataStoreImpl<Record<string, unknown>> }).store;

  const mergedProps = { ...props, ...bindingProps } as ProTableProps<T>;
  const Provider = useMemo(() => {
    const P: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <ProTableContext.Provider
        value={{
          instance: instance as ProTableInstance<Record<string, unknown>>,
          bindingProps: bindingProps as ProTableProps<Record<string, unknown>>,
          store: store as DataStoreImpl<Record<string, unknown>>,
        }}
      >
        {children}
      </ProTableContext.Provider>
    );
    return P;
  }, [instance, bindingProps, store]);
  return (
    <Provider>
      <ProTableRenderer
        mergedProps={mergedProps as unknown as ProTableProps<Record<string, unknown>>}
        instance={instance as unknown as ProTableInstance<Record<string, unknown>>}
        store={store as unknown as DataStoreImpl<Record<string, unknown>>}
        ref={ref as React.Ref<ProTableActionType<Record<string, unknown>>>}
      />
    </Provider>
  );
});

ProTableControlled.displayName = 'ProTableControlled';

// ===== 调度�?=====
const ProTableComponent = forwardRef<
  ProTableActionType<Record<string, unknown>>,
  ProTableProps<Record<string, unknown>>
>(<T extends Record<string, unknown>>(props: ProTableProps<T>, ref: React.Ref<ProTableActionType<T>>) => {
  const commonRef = ref as React.Ref<ProTableActionType<Record<string, unknown>>>;
  const extendedProps = props as unknown as ProTableProps<Record<string, unknown>>;
  if (props.instance) {
    return (
      <ProTableControlled
        instance={props.instance as unknown as ProTableInstance<Record<string, unknown>>}
        {...extendedProps}
        ref={commonRef}
      />
    );
  }
  return <ProTableStandalone {...extendedProps} ref={commonRef} />;
});

ProTableComponent.displayName = 'ProTable';

// 导出组件
export const ProTable = ProTableComponent as unknown as <T extends Record<string, unknown> = Record<string, unknown>>(
  props: ProTableProps<T> & React.RefAttributes<ProTableActionType>,
) => React.ReactElement;

// 默认导出
export default ProTable;
