/**
 * ProDescriptions 组件 barrel 导出
 */

export { ProDescriptions } from './ProDescriptions';
export type { ProDescriptionsProps, ProDescriptionColumn, DescriptionCellProps } from './types';

// 子组件
export { DescriptionCell } from './DescriptionCell';
export type { DescriptionCell as DescriptionCellType } from './DescriptionCell';
export { CopyButton } from './CopyButton';
export type { CopyButtonProps } from './CopyButton';
export { EmptyValue } from './EmptyValue';
export type { EmptyValueProps } from './EmptyValue';

// 适配器
export { adaptColumns } from './columnAdapter';

// Context
export { useDescriptionsRootContext, useDescriptionsColumnContext } from './DescriptionsContext';
export type { DescriptionsRootContextValue, DescriptionsColumnContextValue } from './DescriptionsContext';
