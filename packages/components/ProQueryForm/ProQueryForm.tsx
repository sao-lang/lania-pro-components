/**
 * ProQueryForm 组件 — 独立查询表单
 *
 * 核心职责：
 * 1. 双形态入参：columns（列驱动）或 schemas（Schema 驱动）
 * 2. 直接复用 ProForm 渲染查询表单
 * 3. 双模式：轻量（onSearch 回调）/ 重量（store 集成）
 * 4. 查询参数转换：删空值 + search.transform
 * 5. URL 同步：useUrlSync（轻量模式用内部 store，重量模式用传入的 store）
 * 6. 查询方案管理：usePresetManager + localStorage 持久化
 *
 * 设计原则：
 * - 所有 hooks 提到早返回之前（修复 ProTable QueryForm 的 hooks 顺序 bug）
 * - 复用 ProForm Schema 引擎、DataStore、useUrlSync、usePresetManager
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

import React, { useMemo, useCallback, useRef, forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import type { ProFormInstance, ProFormSchema } from '../ProForm/types';
import type { ProQueryFormProps, ProQueryFormInstance, LightweightStore, UrlSyncConfig, SearchSchemaConfig } from './types';
import { convertColumnsToSearchSchema, transformSearchParams } from './utils';
import { QueryFormRenderer } from './QueryFormRenderer';
import {
  ProQueryFormRootProvider,
  ProQueryFormSchemaProvider,
  ProQueryFormActionProvider,
} from './ProQueryFormContext';
import { useUrlSync, usePresetManager } from '@lania-pro-components/shared';
import type { PresetItem } from '@lania-pro-components/shared';

function createLightweightStore(): LightweightStore {
  let state = {
    query: {} as Record<string, unknown>,
    pagination: { current: 1, pageSize: 20 },
    sorter: {} as Record<string, unknown>,
    filters: {} as Record<string, unknown>,
  };
  const listeners = new Set<() => void>();

  const notify = () => {
    listeners.forEach((listener) => listener());
  };

  return {
    getState: () => state,
    setQuery: (query) => {
      state = { ...state, query };
      notify();
    },
    setPage: (current) => {
      state = { ...state, pagination: { ...state.pagination, current } };
      notify();
    },
    setPageSize: (pageSize) => {
      state = { ...state, pagination: { ...state.pagination, pageSize } };
      notify();
    },
    setSorter: (field, order) => {
      state = {
        ...state,
        sorter: field ? { field, order } : {},
      };
      notify();
    },
    setFilters: (filters) => {
      state = { ...state, filters };
      notify();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

const parseParamValue = (value: string): unknown => {
  try {
    return JSON.parse(value);
  } catch {
    if (/^\d+$/.test(value)) return parseInt(value, 10);
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  }
};

const filterParams = (params: Record<string, unknown>, config: UrlSyncConfig): Record<string, string> => {
  const { prefix = '', include, exclude } = config;
  const result: Record<string, string> = {};
  Object.entries(params).forEach(([key, value]) => {
    const paramKey = prefix ? `${prefix}${key}` : key;
    if (include && !include.includes(key)) return;
    if (exclude && exclude.includes(key)) return;
    if (value !== undefined && value !== null && value !== '') {
      result[paramKey] = typeof value === 'object' ? JSON.stringify(value) : String(value);
    }
  });
  return result;
};

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
    urlSync,
    searchSchema: searchSchemaConfig,
    formProps,
    formRef: formRefProp,
    schemaProcessOptions,
    className,
    style,
  } = props;

  const internalFormRef = useRef<ProFormInstance | null>(null);
  const formInstanceRef = (formRefProp as React.RefObject<ProFormInstance | null>) || internalFormRef;

  const [internalQuery, setInternalQuery] = useState<Record<string, unknown>>({});

  const lightweightStoreRef = useRef<LightweightStore>(createLightweightStore());

  const effectiveStore = store || lightweightStoreRef.current;

  useEffect(() => {
    if (!store) {
      lightweightStoreRef.current = createLightweightStore();
    }
  }, [store]);

  useEffect(() => {
    if (!store) {
      const unsubscribe = lightweightStoreRef.current.subscribe(() => {
        const state = lightweightStoreRef.current.getState();
        setInternalQuery(state.query);
      });
      return unsubscribe;
    }
  }, [store]);

  useEffect(() => {
    if (!store && Object.keys(internalQuery).length > 0) {
      formInstanceRef.current?.setFieldsValue(internalQuery);
    }
  }, [internalQuery, store]);

  const schemas = useMemo<ProFormSchema[]>(() => {
    if (schemasProp) return schemasProp;
    if (columns) return convertColumnsToSearchSchema(columns);
    return [];
  }, [schemasProp, columns]);

  const urlSyncEnabled = urlSync !== undefined && urlSync !== false;
  const urlSyncConfig = typeof urlSync === 'object' ? urlSync : {};

  useUrlSync({
    enabled: urlSyncEnabled,
    getState: () => effectiveStore.getState(),
    setState: (partial) => {
      const p = partial as Record<string, unknown>;
      if (p.current !== undefined && typeof p.current === 'number') effectiveStore.setPage(p.current);
      if (p.pageSize !== undefined && typeof p.pageSize === 'number') effectiveStore.setPageSize(p.pageSize);
      if (p.sortField !== undefined)
        effectiveStore.setSorter(String(p.sortField), p.sortOrder as 'ascend' | 'descend' | undefined);
      const query: Record<string, unknown> = {};
      Object.entries(p).forEach(([key, value]) => {
        if (key !== 'current' && key !== 'pageSize' && key !== 'sortField' && key !== 'sortOrder') {
          query[key] = value;
        }
      });
      if (Object.keys(query).length > 0) {
        effectiveStore.setQuery(query);
        formInstanceRef.current?.setFieldsValue(query);
      }
    },
    serialize: (state) =>
      filterParams({ current: state.pagination.current, pageSize: state.pagination.pageSize, ...state.query }, urlSyncConfig),
    deserialize: (params) => {
      const state: Record<string, unknown> = {};
      const { prefix = '' } = urlSyncConfig;
      Object.entries(params).forEach(([key, value]) => {
        const stateKey = prefix && key.startsWith(prefix) ? key.slice(prefix.length) : key;
        state[stateKey] = parseParamValue(value);
      });
      return state;
    },
    debounceTime: 300,
  });

  const { presets: searchSchemas, current: currentSearchSchema, save, apply, remove, rename, update } = usePresetManager<Record<string, unknown>>({
    enabled: searchSchemaConfig?.enabled ?? false,
    persistenceKey: searchSchemaConfig?.persistenceKey,
    defaultPreset: searchSchemaConfig?.defaultSchema,
    presets: searchSchemaConfig?.initialSchemas ?? searchSchemaConfig?.schemas,
    maxCount: searchSchemaConfig?.maxCount ?? 10,
  });

  const handleSearch = useCallback(
    (values: Record<string, unknown>) => {
      let params = transformSearchParams(values, columns ?? []);
      if (beforeSearch) {
        params = beforeSearch(params);
      }

      onSearch?.(params);

      if (store) {
        store.setQuery(params);
      } else {
        lightweightStoreRef.current.setQuery(params);
      }
    },
    [columns, beforeSearch, onSearch, store],
  );

  const handleReset = useCallback(() => {
    formInstanceRef.current?.resetFields();
    onReset?.();
    if (store) {
      store.reset();
    } else {
      lightweightStoreRef.current.setQuery({});
      lightweightStoreRef.current.setPage(1);
    }
  }, [onReset, store]);

  const handleSaveSearchSchema = useCallback(
    (name: string, params?: Record<string, unknown>) => {
      const currentParams = params || {
        ...effectiveStore.getState().query,
        ...formInstanceRef.current?.getFieldsValue(),
      };
      save(name, currentParams);
    },
    [save, effectiveStore, formInstanceRef],
  );

  const handleSwitchSearchSchema = useCallback(
    (key: string) => {
      apply(key);
      const schema = searchSchemas.find((s) => s.key === key);
      if (schema) {
        effectiveStore.setQuery(schema.params);
        formInstanceRef.current?.setFieldsValue(schema.params);
        effectiveStore.setPage(1);
      }
    },
    [apply, searchSchemas, effectiveStore, formInstanceRef],
  );

  const handleDeleteSearchSchema = useCallback(
    (key: string) => {
      remove(key);
    },
    [remove],
  );

  const handleRenameSearchSchema = useCallback(
    (key: string, newName: string) => {
      rename(key, newName);
    },
    [rename],
  );

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

      searchSchemas,
      currentSearchSchema,
      saveSearchSchema: handleSaveSearchSchema,
      switchSearchSchema: handleSwitchSearchSchema,
      deleteSearchSchema: handleDeleteSearchSchema,
      renameSearchSchema: handleRenameSearchSchema,
    }),
    [
      handleSearch,
      handleReset,
      formInstanceRef,
      searchSchemas,
      currentSearchSchema,
      handleSaveSearchSchema,
      handleSwitchSearchSchema,
      handleDeleteSearchSchema,
      handleRenameSearchSchema,
    ],
  );

  if (schemas.length === 0) return null;

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