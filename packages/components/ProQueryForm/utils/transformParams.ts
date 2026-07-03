/**
 * transformSearchParams — 查询参数转换
 *
 * 从 ProTable/features/QueryForm.tsx 迁移
 * 职责：删空值 + 逐列调用 search.transform
 */

import type { ProColumnType } from '../../ProTable/types';

/**
 * 转换搜索参数
 * 删空值 + 逐列调用 search.transform
 */
export const transformSearchParams = (
  params: Record<string, unknown>,
  columns: ProColumnType[],
): Record<string, unknown> => {
  const result: Record<string, unknown> = { ...params };

  columns.forEach((col) => {
    if (!col.dataIndex) return;

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
