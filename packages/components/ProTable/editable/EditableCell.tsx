/**
 * EditableCell — 可编辑单元格组件
 *
 * 在表格单元格内渲染编辑控件：
 * - 根据字段类型自动选择控件（Input/Select/DatePicker/Switch 等）
 * - 支持自定义控件渲染
 * - 支持编辑模式/预览模式切换
 * - 行验证错误显示
 */
/**
 * EditableCell — 可编辑单元格组件
 *
 * 在表格单元格内渲染编辑控件，根据字段数据类型自动选择合适的编辑器：
 * - Input: text/textarea 类型
 * - InputNumber: number 类型
 * - Select: select/radio 类型
 * - DatePicker: date/dateTime 类型
 * - Switch: boolean 类型
 *
 * 编辑模式下显示控件，非编辑模式下显示原始值，
 * 支持行验证失败的红色边框提示。
 */
import React, { useMemo, useCallback } from 'react';
import { Input, InputNumber, Select, DatePicker, Switch } from '@arco-design/web-react';
import type { EditableCellConfig, EditableTableInstance } from './types';

const { TextArea } = Input;
const { Option } = Select;

export interface EditableCellProps<T = Record<string, unknown>> {
  /** 字段名 */
  dataIndex: string | string[];
  /** 行 key */
  rowKey: string | number;
  /** 行数据 */
  record: T;
  /** 当前值 */
  value: unknown;
  /** 是否正在编辑 */
  isEditing: boolean;
  /** 编辑单元格配置 */
  cellConfig?: EditableCellConfig<T>;
  /** 可编辑表格实例 */
  instance: EditableTableInstance<T>;
  /** 原始渲染 */
  children?: React.ReactNode;
}

/**
 * 根据 valueType 获取默认编辑组件
 */
const getDefaultComponent = (valueType?: string) => {
  switch (valueType) {
    case 'text':
      return Input;
    case 'textarea':
      return TextArea;
    case 'number':
      return InputNumber;
    case 'select':
      return Select;
    case 'date':
      return DatePicker;
    case 'dateRange':
      return DatePicker.RangePicker;
    case 'switch':
      return Switch;
    default:
      return Input;
  }
};

/**
 * 获取嵌套字段值
 */
const getNestedValue = (obj: Record<string, unknown>, path: string | string[]): unknown => {
  if (typeof path === 'string') {
    return obj[path];
  }
  // 处理数组路径
  let result: unknown = obj;
  for (const key of path) {
    if (result && typeof result === 'object') {
      result = (result as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return result;
};

/**
 * 设置嵌套字段值
 */
const setNestedValue = (
  obj: Record<string, unknown>,
  path: string | string[],
  value: unknown,
): Record<string, unknown> => {
  const result = { ...obj };
  if (typeof path === 'string') {
    result[path] = value;
  } else {
    const lastKey = path[path.length - 1];
    const parentPath = path.slice(0, -1);
    let parent = result;
    for (const key of parentPath) {
      if (!(key in parent) || typeof parent[key] !== 'object') {
        parent[key] = {};
      }
      parent = parent[key] as Record<string, unknown>;
    }
    (parent as Record<string, unknown>)[lastKey] = value;
  }
  return result;
};

/**
 * 可编辑单元格
 */
export const EditableCell = <T extends Record<string, unknown>>(props: EditableCellProps<T>): React.ReactElement => {
  const { dataIndex, rowKey, record, value, isEditing, cellConfig, instance, children } = props;

  // 判断是否可编辑
  const canEdit = useMemo(() => {
    if (!cellConfig) {
      return false;
    }
    if (typeof cellConfig.editable === 'function') {
      return cellConfig.editable(value, record, 0);
    }
    return cellConfig.editable !== false;
  }, [cellConfig, value, record]);

  // 处理值变化
  const handleChange = useCallback(
    (newValue: unknown) => {
      const currentData = instance.getEditableRowData(rowKey) || { ...record };
      const updatedData = setNestedValue(currentData, dataIndex, newValue);
      instance.setEditableRowData(rowKey, updatedData as Partial<T>);
    },
    [instance, rowKey, record, dataIndex],
  );

  // 渲染编辑组件
  const renderEditComponent = useMemo(() => {
    if (!cellConfig) {
      return null;
    }

    const { valueType, fieldProps, renderFormItem } = cellConfig;

    // 获取当前编辑值
    const currentData = instance.getEditableRowData(rowKey);
    const editValue = currentData ? getNestedValue(currentData, dataIndex) : getNestedValue(record, dataIndex);

    // 如果提供了自定义渲染函数，使用自定义渲染
    if (renderFormItem) {
      return renderFormItem(value, record, 0, {
        value: editValue,
        onChange: handleChange,
      });
    }

    // 根据 valueType 渲染默认组件
    const Component = getDefaultComponent(valueType);

    if (valueType === 'select') {
      const options = (fieldProps?.options || []) as Array<{
        label: string;
        value: unknown;
      }>;
      return (
        <Select
          {...fieldProps}
          value={editValue as string | number | string[] | number[]}
          onChange={handleChange}
          style={{
            width: '100%',
            ...(fieldProps?.style as React.CSSProperties),
          }}
        >
          {options.map((opt) => (
            <Option key={String(opt.value)} value={opt.value as string | number}>
              {opt.label}
            </Option>
          ))}
        </Select>
      );
    }

    if (valueType === 'switch') {
      return <Switch {...fieldProps} checked={editValue as boolean} onChange={handleChange} />;
    }

    return (
      <Component
        {...fieldProps}
        value={editValue as never}
        onChange={handleChange}
        style={{ width: '100%', ...(fieldProps?.style as React.CSSProperties) }}
      />
    );
  }, [cellConfig, value, record, dataIndex, instance, rowKey, handleChange]);

  // 如果不在编辑状态或不可编辑，显示原始内容
  if (!isEditing || !canEdit) {
    return <>{children}</>;
  }

  return <>{renderEditComponent}</>;
};

export default EditableCell;
