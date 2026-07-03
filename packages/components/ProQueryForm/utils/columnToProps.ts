/**
 * getComponentPropsByValueType — 根据 valueType 生成表单组件属性
 *
 * 从 ProTable/features/QueryForm.tsx 迁移
 * 为不同 valueType 生成对应的组件 props（width/format/options/precision/placeholder）
 */

import type { ProColumnType, ProColumnValueType } from '../../ProTable/types';

/**
 * 根据值类型生成表单组件属性
 */
export const getComponentPropsByValueType = (
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
