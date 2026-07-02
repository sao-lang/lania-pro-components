// 列渲染相关
export {
  renderColumnByValueType,
  createColumnRender,
  convertColumns,
  customRendererRegistry,
  registerCellRenderer,
  unregisterCellRenderer,
  registerCellRenderers,
  getCellRenderer,
  hasCellRenderer,
} from './columnRender';

// copyToClipboard 仍是 Arco 感知包装器，从 columnRender 导出
export { copyToClipboard } from './columnRender';

// 迁移到 utils 包的纯函数
export {
  formatNumber,
  formatMoney,
  formatPercent,
  formatDate,
  getNestedValue,
  defineEnumMap,
} from '@lania-pro-components/utils';

export type { CustomCellRenderer, CustomRendererRegistry } from '../types';
export type { EnumItem, EnumHelper } from '@lania-pro-components/utils';

// 单元格合并
export { createRowMerge, createColMerge, combineMerge, calculateMergeState, getCellMergeProps } from './cellMerge';
export type { CellMergeConfig, MergeState } from './cellMerge';
