/**
 * columnAdapter — ProColumnType[] → ProDescriptionColumn[]
 *
 * 自动过滤操作列和 hideInDescriptions 列
 * Omit 表格专有字段（通过解构实现）
 */

import type { ProColumnType } from '../ProTable/types';
import type { ProDescriptionColumn } from './types';

/**
 * ProColumnType[] → ProDescriptionColumn[]
 * 自动过滤操作列和 hideInDescriptions 列
 */
export function adaptColumns<T>(columns: ProColumnType<T>[] | ProDescriptionColumn<T>[]): ProDescriptionColumn<T>[] {
  return columns
    .filter((col) => col.valueType !== 'opr')
    .filter((col) => !(col as ProDescriptionColumn<T>).hideInDescriptions)
    .map((col) => {
      // Omit 表格专有字段（通过解构丢弃）
      const {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        oprTools,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        actions,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        proTableConfig,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        search,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        hideInSearch,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        order,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        fixed,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        width,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        align,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ellipsis,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        colSpan,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        rowSpan,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        onCell,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        onHeaderCell,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        filterDropdown,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        filterDropdownVisible,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        onFilterDropdownVisibleChange,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        filterDropdownProps,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        onFilter,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        sorter,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        defaultSortOrder,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        sortPriority,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        disableInSetting,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        hideInTable,
        ...descCol
      } = col as ProColumnType<T> & Record<string, unknown>;
      return descCol as unknown as ProDescriptionColumn<T>;
    });
}
