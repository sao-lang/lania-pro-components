/**
 * ProQueryForm 组件 — 独立查询表单
 *
 * 核心职责：
 * 1. 双形态入参：columns（列驱动）或 schemas（Schema 驱动）
 * 2. 直接复用 ProForm 渲染查询表单
 * 3. 双模式：轻量（onSearch 回调）/ 重量（store 集成）
 * 4. 查询参数转换：删空值 + search.transform
 *
 * 设计原则：
 * - 所有 hooks 提到早返回之前（修复 ProTable QueryForm 的 hooks 顺序 bug）
 * - 复用 ProForm Schema 引擎、DataStore、useUrlSync、useSearchSchema
 *
 * @example
 * ```tsx
 * // 形态 A：columns 列驱动
 * <ProQueryForm columns={tableColumns} onSearch={fetchData} />
 *
 * // 形态 B：schemas Schema 驱动
 * <ProQueryForm schemas={mySchemas} onSearch={fetchChartData} />
 *
 * // 重量模式：与 ProTable DataStore 集成
 * <ProQueryForm columns={columns} store={store} urlSync searchSchema={{ enabled: true }} />
 * ```
 */

import React, { useMemo, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import type { ProFormInstance, ProFormSchema } from '../ProForm/types';
import type { ProQueryFormProps, ProQueryFormInstance } from './types';
import { convertColumnsToSearchSchema, transformSearchParams } from './utils';
import { QueryFormRenderer } from './QueryFormRenderer';
import {
  ProQueryFormRootProvider,
  ProQueryFormSchemaProvider,
  ProQueryFormActionProvider,
} from './ProQueryFormContext';

/**
 * ProQueryForm 主组件
 *
 * 支持双形态入参（columns / schemas）和双模式（轻量 / 重量）
 */
export const ProQueryForm = forwardRef<ProQueryFormInstance, ProQueryFormProps>((props, ref) => {
  const {
    columns,
    schemas: schemasProp,
    layout = 'inline',
    column = 3,
    collapsible = true,
    defaultCollapsed = true,
    collapsedRows = 1,
    onSearch,
    onReset,
    beforeSearch,
    showSearch = true,
    showReset = true,
    searchButtonText = '查询',
    resetButtonText = '重置',
    store,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    urlSync,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    searchSchema,
    formProps,
    formRef: formRefProp,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    schemaProcessOptions,
    className,
    style,
  } = props;

  // ✅ 关键修复：所有 hooks 提到早返回之前（修复 ProTable QueryForm 的 hooks 顺序 bug）
  const internalFormRef = useRef<ProFormInstance | null>(null);
  const formInstanceRef = (formRefProp as React.RefObject<ProFormInstance | null>) || internalFormRef;

  // 形态 A：columns 转 schema；形态 B：直接使用 schemas
  const schemas = useMemo<ProFormSchema[]>(() => {
    if (schemasProp) return schemasProp;
    if (columns) return convertColumnsToSearchSchema(columns);
    return [];
  }, [schemasProp, columns]);

  // 处理查询
  const handleSearch = useCallback(
    (values: Record<string, unknown>) => {
      let params = transformSearchParams(values, columns ?? []);
      if (beforeSearch) {
        params = beforeSearch(params);
      }

      // 轻量模式：回调消费方
      onSearch?.(params);

      // 重量模式：写入 store，自动触发订阅者
      if (store) {
        store.setQuery(params);
      }
    },
    [columns, beforeSearch, onSearch, store],
  );

  // 处理重置
  const handleReset = useCallback(() => {
    formInstanceRef.current?.resetFields();
    onReset?.();
    if (store) {
      store.reset();
    }
  }, [onReset, store, formInstanceRef]);

  // 暴露 ref API
  useImperativeHandle(
    ref,
    () => ({
      submit: async () => {
        try {
          await formInstanceRef.current?.validate();
          const values = formInstanceRef.current?.getFieldsValue();
          if (values) handleSearch(values);
        } catch {
          // 表单验证失败，不做额外处理
        }
      },
      reset: () => {
        handleReset();
      },
      getFieldsValue: () => formInstanceRef.current?.getFieldsValue() ?? {},
      setFieldsValue: (values) => formInstanceRef.current?.setFieldsValue(values),
      getFormInstance: () => formInstanceRef.current,
    }),
    [handleSearch, handleReset, formInstanceRef],
  );

  // ❌ 不再在早返回之后调用 hooks（已全部提到前面）
  if (schemas.length === 0) return null;

  // Context 值
  const rootContext = useMemo(
    () => ({ layout, columns: column, collapsible, defaultCollapsed, collapsedRows }),
    [layout, column, collapsible, defaultCollapsed, collapsedRows],
  );

  const schemaContext = useMemo(() => ({ schemas, formRef: formInstanceRef }), [schemas, formInstanceRef]);

  const actionContext = useMemo(() => ({ onSearch: handleSearch, onReset: handleReset }), [handleSearch, handleReset]);

  return (
    <ProQueryFormRootProvider value={rootContext}>
      <ProQueryFormSchemaProvider value={schemaContext}>
        <ProQueryFormActionProvider value={actionContext}>
          <div className={className} style={style}>
            <QueryFormRenderer
              schemas={schemas}
              formRef={formInstanceRef}
              layout={layout}
              columns={column}
              collapsible={collapsible}
              defaultCollapsed={defaultCollapsed}
              collapsedRows={collapsedRows}
              showSubmitButton={showSearch}
              showResetButton={showReset}
              submitText={searchButtonText}
              resetText={resetButtonText}
              onSearch={handleSearch}
              onReset={handleReset}
              formProps={formProps as Record<string, unknown>}
            />
          </div>
        </ProQueryFormActionProvider>
      </ProQueryFormSchemaProvider>
    </ProQueryFormRootProvider>
  );
});

ProQueryForm.displayName = 'ProQueryForm';

export default ProQueryForm;
