/**
 * QueryForm — 表格查询表单
 *
 * 自动从表格列的 search 配置生成查询表单：
 * - 自动识别列类型生成对应的查询控件（Input/Select/DatePicker 等）
 * - 与 ProTable 的 DataStore 双向绑定
 * - 支持展开/收起（collapsible）
 * - 点击查询/重置自动触发数据刷新
 */
/**
 * QueryForm — 表格查询表单组件
 *
 * 根据表格列的 search 配置自动生成查询表单：
 * 1. 遍历 columns，读取 title 和 valueType 生成 ProFormSchema
 * 2. 将 Schema 传递给 ProForm 渲染查询控件
 * 3. 查询/重置操作自动同步到 DataStore
 * 4. 支持展开/收起（collapsible）和折叠行数（collapsedRows）
 * 5. 支持自定义底部渲染（footerRender）
 *
 * 类型映射规则：
 * text → Input | money/number/percent → InputNumber
 * select/tag/enum → Select | date/dateTime → DatePicker
 * switch → Switch 等
 */
import React, { useCallback, useEffect, useRef } from 'react';
import type { ProFormInstance } from '../../ProForm/types';
import { useDataContext, useColumnContext, useRootContext } from '../context';
import { ProQueryForm } from '../../ProQueryForm';

// 4 个纯函数 re-export（保持向后兼容）
export {
  valueTypeToComponent,
  getComponentPropsByValueType,
  convertColumnsToSearchSchema,
  transformSearchParams,
} from '../../ProQueryForm/utils';

export interface QueryFormProps {
  formRef: React.RefObject<ProFormInstance | null>;
}

/**
 * QueryForm - 查询表单组件
 *
 * @deprecated 请直接使用 ProQueryForm 组件
 * 此为 ProTable 内部向后兼容适配器，从 Context 取值转为 ProQueryForm props
 */
export const QueryForm: React.FC<QueryFormProps> = ({ formRef }) => {
  const { setQuery, reset, query, loading } = useDataContext();
  const { columns } = useColumnContext();
  const { props: rootProps } = useRootContext();

  const { search } = rootProps;
  const isSettingFormRef = useRef(false);

  // ✅ 修复：hooks 提到早返回之前
  // 监听 query 变化，同步到表单
  useEffect(() => {
    if (!formRef.current || isSettingFormRef.current) return;
    if (query && Object.keys(query).length > 0) {
      isSettingFormRef.current = true;
      formRef.current.setFieldsValue(query);
      setTimeout(() => {
        isSettingFormRef.current = false;
      }, 0);
    }
  }, [formRef, query]);

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

  // 自定义查询处理：调用 setQuery
  const handleSearch = useCallback(
    (params: Record<string, unknown>) => {
      setQuery(params);
    },
    [setQuery],
  );
  const handleReset = useCallback(() => {
    reset();
  }, [reset]);

  return (
    <ProQueryForm
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
      formRef={formRef}
      formProps={formProps as Record<string, unknown>}
    />
  );
};

export default QueryForm;
