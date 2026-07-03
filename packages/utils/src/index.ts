/**
 * @lania-pro-components/utils
 *
 * 公共工具函数包入口文件
 *
 * 本包是 Lania Pro Components 项目的基础工具层，
 * 提供响应式系统、性能优化、格式化、数据操作等通用能力。
 *
 * 所有模块通过 re-export 在此统一对外暴露，
 * 使用者可通过 `import { xxx } from '@lania-pro-components/utils'` 按需引入。
 */

// ======================== 响应式系统 ========================
// 基于 Proxy 的轻量级响应式数据系统
// 导出：reactive, effect, computed, watch, ref, batchUpdate 等
export * from './reactive';

// ======================== 性能优化工具 ========================
// 包含任务队列、批量更新管理器、防抖/节流、记忆化缓存、性能监控等
// 导出：TaskQueue, BatchUpdateManager, debounce, throttle, memoize, LRUCache 等
export * from './performance';

// ======================== 枚举映射工具 ========================
// 用于状态 → 枚举映射的管理，提供 Select/Table 渲染所需的功能
// 导出：defineEnumMap, EnumItem, EnumHelper 等
export * from './defineEnumMap';

// ======================== 对象与路径操作 ========================
// 提供深度合并和嵌套属性访问功能
// 导出：deepMerge, getNestedValue
export * from './object';

// ======================== 格式化工具 ========================
// 数字、货币、百分比、日期的格式化函数
// 导出：formatNumber, formatMoney, formatPercent, formatDate
export * from './format';

// ======================== DOM 工具 ========================
// 浏览器 DOM 操作相关的纯工具函数
// 导出：copyToClipboard
export * from './dom';

// ======================== 文件类型判断 ========================
// 基于扩展名的文件类型识别
// 导出：isVideo, checkFileType
export * from './fileType';

// ======================== 图片处理工具 ========================
// 浏览器端图片处理函数，基于 Canvas API
// 导出：compressImage
export * from './image';

// ======================== 颜色工具 ========================
// 标签颜色映射、状态颜色转换等
// 导出：getTagColor
export * from './color';
