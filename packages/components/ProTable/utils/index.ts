/**
 * ProTable 工具函数模块
 *
 * 提供表格相关的渲染和数据处理工具：
 *
 * 1. 列渲染（columnRender）
 *    - renderColumnByValueType: 根据值类型自动渲染列
 *    - createColumnRender: 创建自定义列渲染
 *    - customRendererRegistry: 自定义单元格渲染器注册表
 *    - registerCellRenderer / getCellRenderer: 注册/获取渲染器
 *
 * 2. 单元格合并（cellMerge）
 *    - createRowMerge: 创建行合并策略
 *    - createColMerge: 创建列合并策略
 *    - combineMerge: 组合多个合并策略
 *    - getCellMergeProps: 获取合并后的单元格属性
 *
 * 3. 格式化工具（re-export from @lania-pro-components/utils）
 *    - formatNumber / formatMoney / formatPercent / formatDate
 *    - getNestedValue / defineEnumMap
 */
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
