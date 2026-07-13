/**
 * convertColumnsToSearchSchema — ProColumnType[] → ProFormSchema[]
 *
 * 从 ProTable/features/QueryForm.tsx 迁移
 * 过滤规则：hideInSearch===true / search===false / valueType==='opr' / 无 dataIndex
 * 支持 search.order 排序
 */

import type { ProColumnType } from '../../ProTable/types';
import type { ProFormSchema } from '../../ProForm/types';
import { valueTypeToComponent } from './valueTypeToComponent';
import { getComponentPropsByValueType } from './columnToProps';

/**
 * 将列配置转换为搜索表单 Schema
 */
export const convertColumnsToSearchSchema = <T extends Record<string, unknown>>(
  columns: ProColumnType<T>[],
): ProFormSchema[] => {
  const searchColumns = columns
    .filter((col): col is ProColumnType<T> & { dataIndex: string | string[] } => {
      if (col.hideInSearch === true) return false;
      if (col.search === false) return false;
      if (col.valueType === 'opr') return false;
      if (!col.dataIndex) return false;
      return true;
    })
    .map((col) => {
      const dataIndex = Array.isArray(col.dataIndex) ? col.dataIndex.join('.') : col.dataIndex;
      const valueType = col.valueType || 'text';
      const component =
        valueType === 'opr' || valueType === 'proTable'
          ? 'Input'
          : valueTypeToComponent[valueType as keyof typeof valueTypeToComponent] || 'Input';
      const componentProps =
        valueType === 'opr' || valueType === 'proTable'
          ? {}
          : getComponentPropsByValueType(valueType, col as ProColumnType);

      const searchConfig = col.search || {};

      const schema: ProFormSchema = {
        ...searchConfig,
        name: dataIndex,
        label: col.title ? String(col.title) : '',
        component: searchConfig.component || component,
        componentProps: {
          ...componentProps,
          ...searchConfig.componentProps,
        },
      };

      if (searchConfig.rules) {
        schema.rules = searchConfig.rules;
      }

      // 支持 search.order 排序
      if (typeof searchConfig === 'object' && 'order' in searchConfig) {
        (schema as ProFormSchema & { order?: number }).order = (searchConfig as { order?: number }).order;
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
