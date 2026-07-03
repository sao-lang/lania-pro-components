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
import React, { useMemo, useCallback, useEffect, useRef } from 'react';
import { ProForm } from '../../ProForm';
import type { ProFormInstance, ProFormSchema } from '../../ProForm/types';
import { useDataContext, useColumnContext, useRootContext } from '../context';
import type { ProColumnType, ProColumnValueType } from '../types';

export interface QueryFormProps {
  formRef: React.RefObject<ProFormInstance | null>;
}

/**
 * 值类型到表单组件的映射
 */
const valueTypeToComponent: Record<Exclude<ProColumnValueType, 'opr' | 'proTable'>, string> = {
  text: 'Input',
  number: 'InputNumber',
  money: 'InputNumber',
  percent: 'InputNumber',
  date: 'DatePicker',
  dateTime: 'DatePicker',
  time: 'TimePicker',
  dateRange: 'DatePicker.RangePicker',
  dateTimeRange: 'DatePicker.RangePicker',
  select: 'Select',
  radio: 'Radio.Group',
  checkbox: 'Checkbox.Group',
  switch: 'Switch',
  tag: 'Select',
  avatar: 'Input',
  image: 'Input',
  link: 'Input',
  progress: 'InputNumber',
  code: 'Input',
  json: 'Input',
  textarea: 'Input.TextArea',
  enum: 'Select',
};

/**
 * 根据值类型生成表单组件属性
 */
const getComponentPropsByValueType = (
  valueType: ProColumnValueType,
  column: ProColumnType,
): Record<string, unknown> => {
  const { valueEnum, dateFormat } = column;

  switch (valueType) {
    case 'date':
      return { style: { width: '100%' }, format: dateFormat || 'YYYY-MM-DD' };
    case 'dateTime':
      return {
        style: { width: '100%' },
        format: dateFormat || 'YYYY-MM-DD HH:mm:ss',
        showTime: true,
      };
    case 'dateRange':
      return { style: { width: '100%' }, format: dateFormat || 'YYYY-MM-DD' };
    case 'dateTimeRange':
      return {
        style: { width: '100%' },
        format: dateFormat || 'YYYY-MM-DD HH:mm:ss',
        showTime: true,
      };
    case 'select':
    case 'tag':
      return {
        style: { width: '100%' },
        options: valueEnum
          ? Object.entries(valueEnum).map(([key, val]) => ({
              label: val.text,
              value: key,
            }))
          : [],
        allowClear: true,
        placeholder: `请选择${column.title || ''}`,
      };
    case 'radio':
      return {
        options: valueEnum
          ? Object.entries(valueEnum).map(([key, val]) => ({
              label: val.text,
              value: key,
            }))
          : [],
      };
    case 'checkbox':
      return {
        options: valueEnum
          ? Object.entries(valueEnum).map(([key, val]) => ({
              label: val.text,
              value: key,
            }))
          : [],
      };
    case 'number':
    case 'money':
    case 'percent':
      return {
        style: { width: '100%' },
        precision: column.precision ?? (valueType === 'money' ? 2 : 0),
        placeholder: `请输入${column.title || ''}`,
      };
    default:
      return {
        style: { width: '100%' },
        placeholder: `请输入${column.title || ''}`,
        allowClear: true,
      };
  }
};

/**
 * 将列配置转换为搜索表单 Schema
 */
const convertColumnsToSearchSchema = <T extends Record<string, unknown>>(
  columns: ProColumnType<T>[],
): ProFormSchema[] => {
  const searchColumns = columns
    .filter((col): col is ProColumnType<T> & { dataIndex: string | string[] } => {
      if (col.hideInSearch === true) {
        return false;
      }
      if (col.search === false) {
        return false;
      }
      if (col.valueType === 'opr') {
        return false;
      }
      if (!col.dataIndex) {
        return false;
      }
      return true;
    })
    .map((col) => {
      const dataIndex = Array.isArray(col.dataIndex) ? col.dataIndex.join('.') : col.dataIndex;

      const valueType = col.valueType || 'text';
      const component =
        valueType === 'opr' || valueType === 'proTable' ? 'Input' : valueTypeToComponent[valueType] || 'Input';
      const componentProps =
        valueType === 'opr' || valueType === 'proTable'
          ? {}
          : getComponentPropsByValueType(valueType, col as ProColumnType);

      const searchConfig = col.search || {};

      const schema: ProFormSchema = {
        name: dataIndex,
        label: col.title ? String(col.title) : '',
        component: searchConfig.component || component,
        componentProps: {
          ...componentProps,
          ...searchConfig.componentProps,
        },
      };

      // 单独处理 rules，进行类型转换
      if (searchConfig.rules) {
        schema.rules = searchConfig.rules;
      }

      return schema;
    })
    .sort((a, b) => {
      const orderA = (a as ProFormSchema & { order?: number }).order ?? Infinity;
      const orderB = (b as ProFormSchema & { order?: number }).order ?? Infinity;
      return orderA - orderB;
    });

  return searchColumns;
};

/**
 * 转换搜索参数
 */
const transformSearchParams = (params: Record<string, unknown>, columns: ProColumnType[]): Record<string, unknown> => {
  const result: Record<string, unknown> = { ...params };

  columns.forEach((col) => {
    if (!col.dataIndex) {
      return;
    }

    const dataIndex = Array.isArray(col.dataIndex) ? col.dataIndex.join('.') : col.dataIndex;

    const value = result[dataIndex];
    if (value === undefined || value === null || value === '') {
      delete result[dataIndex];
      return;
    }

    const searchConfig = col.search;
    if (searchConfig && typeof searchConfig === 'object' && 'transform' in searchConfig) {
      const transformed = searchConfig.transform?.(value);
      if (transformed !== undefined) {
        if (typeof transformed === 'object' && !Array.isArray(transformed)) {
          Object.assign(result, transformed);
          delete result[dataIndex];
        } else {
          result[dataIndex] = transformed;
        }
      }
    }
  });

  return result;
};

/**
 * QueryForm - 查询表单组件
 * 根据 columns 配置自动生成查询表单，集成 ProForm
 */
export const QueryForm: React.FC<QueryFormProps> = ({ formRef }) => {
  const { setQuery, reset, loading, query } = useDataContext();
  const { columns } = useColumnContext();
  const { props: rootProps } = useRootContext();

  const { search } = rootProps;
  const isSettingFormRef = useRef(false);

  // 如果没有搜索配置，不渲染
  if (!search) {
    return null;
  }

  const searchSchemas = useMemo(() => convertColumnsToSearchSchema(columns), [columns]);

  // 如果没有可搜索的字段，返回 null
  if (searchSchemas.length === 0) {
    return null;
  }

  const configObj = typeof search === 'boolean' ? {} : search;
  const {
    layout = 'horizontal',
    columns: formColumns = 3,
    collapsible = true,
    defaultCollapsed = true,
    collapsedRows = 1,
    formProps = {},
    beforeSearch,
    searchButtonRender,
    resetButtonRender,
  } = configObj;

  // 监听 query 变化，同步到表单
  useEffect(() => {
    if (!formRef.current || isSettingFormRef.current) {
      return;
    }

    if (query && Object.keys(query).length > 0) {
      isSettingFormRef.current = true;
      formRef.current.setFieldsValue(query);
      setTimeout(() => {
        isSettingFormRef.current = false;
      }, 0);
    }
  }, [formRef, query]);

  // 从 formProps 中提取 ProForm 支持的属性
  const {
    labelCol,
    wrapperCol,
    colon,
    labelAlign,
    size,
    disabled,
    readonly,
    draft,
    preview,
    initialValues,
    onFinishFailed,
    onValuesChange,
    onFieldsChange,
    onDraftChange,
    onPreviewChange,
    showButton: formShowButton,
    resetLoading,
    showSubmitButton,
    showResetButton,
    buttonPosition,
    collapsed: formCollapsed,
    onCollapseChange,
    rows,
    buttons,
    buttonList,
    okButtonProps,
    cancelButtonProps,
    rowProps,
    colProps,
    columns: propColumns,
    gutter,
    className: formClassName,
    style: formStyle,
    scrollToFirstError,
    validateTrigger,
    labelColProps,
    wrapperColProps,
    cardContainer: formCardContainer,
    performance,
    schemaProcessOptions,
    ...restFormProps
  } = formProps;

  /**
   * 处理搜索
   */
  const handleSearch = useCallback(
    (values: Record<string, unknown>) => {
      isSettingFormRef.current = true;
      let params = transformSearchParams(values, columns);
      if (beforeSearch) {
        params = beforeSearch(params);
      }
      setQuery(params);
      setTimeout(() => {
        isSettingFormRef.current = false;
      }, 0);
    },
    [columns, beforeSearch, setQuery],
  );

  /**
   * 处理重置
   */
  const handleReset = useCallback(() => {
    formRef.current?.resetFields();
    reset();
  }, [formRef, reset]);

  return (
    <div className='pro-table-query-form' style={{ marginBottom: 16 }}>
      <ProForm
        ref={formRef}
        schemas={searchSchemas}
        layout={layout}
        columns={propColumns ?? formColumns}
        collapsible={collapsible}
        defaultCollapsed={defaultCollapsed}
        collapsedRows={collapsedRows}
        showButton={formShowButton ?? true}
        submitText={searchButtonRender ? undefined : '查询'}
        resetText={resetButtonRender ? undefined : '重置'}
        onFinish={handleSearch}
        onReset={handleReset}
        // 透传 formProps 中的属性
        labelCol={labelCol}
        wrapperCol={wrapperCol}
        colon={colon}
        labelAlign={labelAlign}
        size={size}
        disabled={disabled}
        readonly={readonly}
        draft={draft}
        preview={preview}
        initialValues={initialValues}
        onFinishFailed={onFinishFailed}
        onValuesChange={onValuesChange}
        onFieldsChange={onFieldsChange}
        onDraftChange={onDraftChange}
        onPreviewChange={onPreviewChange}
        submitLoading={loading}
        resetLoading={resetLoading}
        showSubmitButton={showSubmitButton}
        showResetButton={showResetButton}
        buttonPosition={buttonPosition}
        collapsed={formCollapsed}
        onCollapseChange={onCollapseChange}
        rows={rows}
        buttons={buttons}
        buttonList={buttonList}
        okButtonProps={okButtonProps}
        cancelButtonProps={cancelButtonProps}
        rowProps={rowProps}
        colProps={colProps}
        gutter={gutter}
        className={formClassName}
        style={formStyle}
        scrollToFirstError={scrollToFirstError}
        validateTrigger={validateTrigger}
        labelColProps={labelColProps}
        wrapperColProps={wrapperColProps}
        cardContainer={formCardContainer}
        performance={performance}
        schemaProcessOptions={schemaProcessOptions}
        {...restFormProps}
      />
    </div>
  );
};

export default QueryForm;
