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
}

/**
 * 分步表单实例方法
 */
export interface ProFormStepsInstance {
  prev: () => void;
  next: () => void;
  goTo: (index: number) => void;
  getCurrent: () => number;
}

/**
 * 动态列表表单 Props
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
}
