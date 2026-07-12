/**
 * ProForm 高级组件类型定义
 *
 * 定义 ProFormList（动态列表）和 ProFormSteps（分步表单）的 Props 和实例接口。
 */

import type React from 'react';
import type { ProFormSchema } from '../types';

/**
 * 分步表单步骤配置
 */
export interface ProFormStepSchema {
  title: string;
  description?: string;
  schemas: ProFormSchema[];
}

/**
 * 分步表单 Props
 */
export interface ProFormStepsProps {
  steps: ProFormStepSchema[];
  current?: number;
  defaultCurrent?: number;
  onChange?: (current: number) => void;
  onStepChange?: (from: number, to: number) => void;
  prevText?: string;
  nextText?: string;
  submitText?: string;
  validateOnNext?: boolean;
  showSteps?: boolean;
  direction?: 'horizontal' | 'vertical';
  stepsProps?: Record<string, unknown>;
  showButton?: boolean;
  /** 最后一步提交回调（由 submit 按钮或实例 submit() 触发） */
  onFinish?: (values: Record<string, unknown>) => void | Promise<void>;
  /** 是否显示重置按钮（回到第一步） */
  showResetButton?: boolean;
  /** 重置按钮文本 */
  resetText?: string;
  /** 重置回调 */
  onReset?: () => void;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

/**
 * 分步表单实例方法
 */
export interface ProFormStepsInstance {
  /** 上一步 */
  prev: () => void;
  /** 下一步（最后一步时触发提交），返回 Promise 以便等待校验完成 */
  next: () => Promise<void>;
  /** 跳转到指定步骤 */
  goTo: (index: number) => void;
  /** 获取当前步骤索引 */
  getCurrent: () => number;
  /** 获取指定步骤配置 */
  getStep: (index: number) => ProFormStepSchema | undefined;
  /** 获取所有步骤配置 */
  getSteps: () => ProFormStepSchema[];
  /** 校验指定步骤（默认当前步），返回是否通过 */
  validateStep: (index?: number) => Promise<boolean>;
  /** 重置到第一步并清除当前步校验状态 */
  reset: () => void;
  /** 提交表单（触发 onFinish） */
  submit: () => Promise<void>;
}

/**
 * 动态列表操作集合（透传给 itemRender 与实例方法）
 */
export interface ProFormListActions {
  /** 新增一行（可指定初始记录） */
  add: (record?: Record<string, unknown>) => void;
  /** 删除指定索引行 */
  remove: (index: number) => void;
  /** 复制指定索引行并追加到末尾 */
  copy: (index: number) => void;
  /** 上移指定索引行 */
  moveUp: (index: number) => void;
  /** 下移指定索引行 */
  moveDown: (index: number) => void;
  /** 将某行移动到目标索引 */
  move: (from: number, to: number) => void;
  /** 清空所有行（受 min 约束，保留 min 条） */
  clear: () => void;
}

/**
 * 动态列表实例方法
 */
export interface ProFormListInstance extends ProFormListActions {
  /** 获取当前行数组（浅拷贝） */
  getList: () => unknown[];
  /** 获取当前行数 */
  getLength: () => number;
}

/**
 * 动态列表表单 Props
 *
 * 受控模式：提供 value prop，行数组由父组件控制，所有变更通过 onChange 回调通知父组件，
 * 由父组件更新 value 实现同步。此时组件内部不维护状态。
 *
 * 非受控模式：不提供 value prop，行数组由组件内部 state 主导，挂载时从 store 读取初始值
 * （兼容 ProForm initialValues 注入），此后所有变更单向同步回 store。
 */
export interface ProFormListProps {
  name: string;
  label?: string;
  itemTitle?: string | ((index: number) => string);
  schemas: ProFormSchema[];
  min?: number;
  max?: number;
  addText?: string;
  removeText?: string;
  showAddButton?: boolean;
  showRemoveButton?: boolean;
  onAdd?: (index: number) => void;
  onRemove?: (index: number) => void;
  initialValue?: unknown[];
  disabled?: boolean;
  readonly?: boolean;
  card?: boolean;
  cardProps?: Record<string, unknown>;
  /** 复制按钮文本 */
  copyText?: string;
  /** 是否显示复制按钮 */
  showCopyButton?: boolean;
  /** 上移按钮文本 */
  moveUpText?: string;
  /** 下移按钮文本 */
  moveDownText?: string;
  /** 是否显示上移/下移按钮 */
  showMoveButtons?: boolean;
  /** 清空按钮文本 */
  clearText?: string;
  /** 是否显示清空按钮 */
  showClearButton?: boolean;
  /** 新增行时的默认记录（替代空对象 {}） */
  creatorRecord?: Record<string, unknown>;
  /** 复制回调 */
  onCopy?: (index: number) => void;
  /** 移动回调 */
  onMove?: (from: number, to: number) => void;
  /** 清空回调 */
  onClear?: () => void;
  /** 行数组（受控），提供此 prop 时组件进入受控模式 */
  value?: unknown[];
  /** 行数组变更回调，受控模式下必须提供以实现值同步 */
  onChange?: (value: unknown[]) => void;
  /** 自定义单项渲染，接收默认渲染内容、索引与操作集合 */
  itemRender?: (item: React.ReactNode, index: number, actions: ProFormListActions) => React.ReactNode;
  /** 空列表占位内容 */
  emptyText?: React.ReactNode;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
}
