/**
 * QueryForm — 表格查询表单组件
 *
 * @deprecated 请直接使用 ProQueryForm 组件
 * 此为 ProTable 内部向后兼容适配器，从 Context 取值转为 ProQueryForm props
 *
 * 功能：
 * - 自动从表格列的 search 配置生成查询表单
 * - 与 ProTable 的 DataStore 双向绑定
 * - 支持展开/收起（collapsible）
 * - 点击查询/重置自动触发数据刷新
 * - URL 同步（urlSync）
 * - 查询方案管理（searchSchema）
 */
import React, { useCallback, useEffect, useRef, forwardRef } from 'react';
import type { ProFormInstance } from '../../ProForm/types';
import type { ProQueryFormInstance } from '../../ProQueryForm';
import { useDataContext, useColumnContext, useRootContext } from '../context';
import { ProQueryForm } from '../../ProQueryForm';

export {
  valueTypeToComponent,
  getComponentPropsByValueType,
  convertColumnsToSearchSchema,
  transformSearchParams,
} from '../../ProQueryForm/utils';

export type QueryFormProps = object;

export const QueryForm = forwardRef<ProQueryFormInstance, QueryFormProps>((_props, ref) => {
  const dataContext = useDataContext();
  const { columns } = useColumnContext();
  const { props: rootProps } = useRootContext();

  const { search, urlSync, queryAutoRestore, searchSchema: searchSchemaConfig } = rootProps;
  const formRef = useRef<ProFormInstance | null>(null);
  const isSettingFormRef = useRef(false);

  useEffect(() => {
    if (!formRef.current || isSettingFormRef.current) return;
    if (dataContext.query && Object.keys(dataContext.query).length > 0) {
      isSettingFormRef.current = true;
      formRef.current.setFieldsValue(dataContext.query);
      setTimeout(() => {
        isSettingFormRef.current = false;
      }, 0);
    }
  }, [formRef, dataContext.query]);

  if (!search) return null;

  const configObj = typeof search === 'boolean' ? {} : search;
  const {
    layout = 'horizontal',
    columns: formColumns = 3,
    collapsible = true,
    defaultCollapsed = true,
    collapsedRows = 1,
    formProps = {},
    beforeSearch,
    showSearch,
    showReset,
  } = configObj;

  const handleSearch = useCallback(
    (params: Record<string, unknown>) => {
      dataContext.setQuery(params);
    },
    [dataContext],
  );
  const handleReset = useCallback(() => {
    dataContext.reset();
  }, [dataContext]);

  return (
    <ProQueryForm
      ref={ref}
      columns={columns}
      layout={layout}
      column={formColumns}
      collapsible={collapsible}
      defaultCollapsed={defaultCollapsed}
      collapsedRows={collapsedRows}
      onSearch={handleSearch}
      onReset={handleReset}
      beforeSearch={beforeSearch}
      showSearch={showSearch}
      showReset={showReset}
      formProps={formProps as Record<string, unknown>}
      store={dataContext}
      urlSync={urlSync}
      queryAutoRestore={queryAutoRestore}
      searchSchema={searchSchemaConfig}
    />
  );
});
QueryForm.displayName = 'ProTableQueryForm';
export default QueryForm;
