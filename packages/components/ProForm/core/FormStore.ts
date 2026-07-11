/**
 * FormStore — 响应式表单状态管理
 *
 * 基于 @lania-pro-components/utils 的响应式系统（reactive / batchUpdate / watch）
 * 实现表单级别的状态管理，与 UI 框架解耦。
 *
 * 管理的状态：
 * - values: 表单所有字段的值
 * - fields: 已注册的字段实例
 * - errors: 字段错误信息
 * - touched: 字段触摸状态
 * - reactions: 字段联动规则
 *
 * 核心功能：
 * - 字段注册/注销
 * - 值读写（单个/批量）
 * - 值变化通知（Listner 模式）
 * - 字段联动（dependencies → reactions）
 * - 字段验证
 * - 重置（单个/全部）
 */

import type { FormStoreAPI, FieldNodeAPI, FieldReaction } from '../types';
import { reactive, batchUpdate, watch } from '@lania-pro-components/utils';

/**
 * 值变化监听器类型
 */
type ValueChangeListener = (changedField: string, value: unknown, allValues: Record<string, unknown>) => void;

/**
 * 字段变化监听器类型
 */
type FieldChangeListener = (changedField: string, field: FieldNodeAPI | undefined) => void;

/**
 * 表单状态结构
 */
interface FormState {
  values: Record<string, unknown>;
  fields: Record<string, FieldNodeAPI>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  reactions: Record<string, FieldReaction[]>;
}

/**
 * 表单级约束
 */
interface FormConstraints {
  preview: boolean;
  readonly: boolean;
  disabled: boolean;
}

/**
 * FormStore 实现
 * 基于 Proxy 响应式系统的表单状态管理
 */
export class FormStore implements FormStoreAPI {
  // 响应式状态
  private state: FormState;

  // 表单级约束（响应式，用于 FieldNode._effectiveStatus 计算）
  private formConstraints = reactive<FormConstraints>({
    preview: false,
    readonly: false,
    disabled: false,
  });

  // 监听器（非响应式）
  private valueListeners: Set<ValueChangeListener> = new Set();
  private fieldListeners: Set<FieldChangeListener> = new Set();

  // 字段值变化的 effect 清理函数映射
  private valueEffectCleanups: Map<string, () => void> = new Map();

  constructor() {
    // 创建响应式状态
    this.state = reactive<FormState>({
      values: {},
      fields: {},
      errors: {},
      touched: {},
      reactions: {},
    });
  }

  /**
   * 设置表单级约束
   */
  setFormConstraints(constraints: { preview?: boolean; readonly?: boolean; disabled?: boolean }): void {
    if (constraints.preview !== undefined) this.formConstraints.preview = constraints.preview;
    if (constraints.readonly !== undefined) this.formConstraints.readonly = constraints.readonly;
    if (constraints.disabled !== undefined) this.formConstraints.disabled = constraints.disabled;
  }

  /**
   * 获取表单级约束
   */
  getFormConstraints(): { preview: boolean; readonly: boolean; disabled: boolean } {
    return { ...this.formConstraints };
  }

  /**
   * 获取所有值
   */
  getValues(): Record<string, unknown> {
    return { ...this.state.values };
  }

  /**
   * 获取单个值
   */
  getValue(name: string): unknown {
    return this.state.values[name];
  }

  /**
   * 设置值
   */
  setValue(name: string, value: unknown): void {
    const oldValue = this.state.values[name];

    batchUpdate(() => {
      this.state.values[name] = value;
      this.state.touched[name] = true;
    });

    // 通知监听器
    this.notifyValueChange(name, value);

    // 触发字段生命周期
    const field = this.state.fields[name];
    if (field?.schema.lifecycle?.onValueChange) {
      field.schema.lifecycle.onValueChange(value, oldValue, field, this);
    }
  }

  /**
   * 批量设置值
   */
  setValues(values: Record<string, unknown>): void {
    batchUpdate(() => {
      Object.entries(values).forEach(([name, value]) => {
        this.state.values[name] = value;
        this.state.touched[name] = true;
      });
    });

    // 批量通知
    Object.entries(values).forEach(([name, value]) => {
      this.notifyValueChange(name, value);

      const field = this.state.fields[name];
      if (field?.schema.lifecycle?.onValueChange) {
        field.schema.lifecycle.onValueChange(value, undefined, field, this);
      }
    });
  }

  /**
   * 通知值变化
   */
  private notifyValueChange(name: string, value: unknown): void {
    const allValues = this.getValues();
    this.valueListeners.forEach((listener) => listener(name, value, allValues));
  }

  /**
   * 获取字段实例
   */
  getField(name: string | string[]): FieldNodeAPI | undefined {
    // 数组类型使用第一个字段名查找
    const fieldName = Array.isArray(name) ? name[0] : name;
    return this.state.fields[fieldName];
  }

  /**
   * 注册字段
   */
  registerField(field: FieldNodeAPI): void {
    // 数组类型使用第一个字段名作为主键
    const fieldName = Array.isArray(field.name) ? field.name[0] : field.name;

    batchUpdate(() => {
      this.state.fields[fieldName] = field;

      // 初始化值
      if (field.schema.initialValue !== undefined && !(fieldName in this.state.values)) {
        this.state.values[fieldName] = field.schema.initialValue;
      }

      // 注册联动规则
      if (field.schema.reactions) {
        this.state.reactions[fieldName] = field.schema.reactions;
      }
    });

    // 通知字段监听器
    this.fieldListeners.forEach((listener) => listener(fieldName, field));

    // 设置字段值监听（用于联动）
    this.setupFieldValueWatch(field, fieldName);

    // 触发初始化生命周期
    if (field.schema.lifecycle?.onInit) {
      field.schema.lifecycle.onInit(field, this);
    }
  }

  /**
   * 设置字段值监听
   */
  private setupFieldValueWatch(field: FieldNodeAPI, fieldName: string): void {
    // 清理旧的监听
    const oldCleanup = this.valueEffectCleanups.get(fieldName);
    if (oldCleanup) {
      oldCleanup();
    }

    // 监听当前字段值变化
    const cleanup = watch(
      () => this.state.values[fieldName],
      (_newValue, _oldValue) => {
        // 执行联动规则
        this.runReactions(fieldName);
      },
    );

    this.valueEffectCleanups.set(fieldName, cleanup);

    // 监听依赖字段变化
    if (field.schema.dependencies) {
      field.schema.dependencies.forEach((depName) => {
        const depCleanup = watch(
          () => this.state.values[depName],
          () => {
            // 依赖字段值变化时，FieldNode._effectiveStatus 的 computed 会自动追踪并重算
          },
        );

        // 存储依赖清理函数
        const existingCleanups = this.valueEffectCleanups.get(`${fieldName}_deps`) || (() => {});
        this.valueEffectCleanups.set(`${fieldName}_deps`, () => {
          existingCleanups();
          depCleanup();
        });
      });
    }
  }

  /**
   * 注销字段
   */
  unregisterField(name: string | string[]): void {
    // 数组类型使用第一个字段名
    const fieldName = Array.isArray(name) ? name[0] : name;
    const field = this.state.fields[fieldName];
    if (field?.schema.lifecycle?.onDestroy) {
      field.schema.lifecycle.onDestroy(field, this);
    }

    // 清理 effect
    const cleanup = this.valueEffectCleanups.get(fieldName);
    if (cleanup) {
      cleanup();
      this.valueEffectCleanups.delete(fieldName);
    }
    const depCleanup = this.valueEffectCleanups.get(`${fieldName}_deps`);
    if (depCleanup) {
      depCleanup();
      this.valueEffectCleanups.delete(`${fieldName}_deps`);
    }

    batchUpdate(() => {
      delete this.state.fields[fieldName];
      delete this.state.reactions[fieldName];
      delete this.state.errors[fieldName];
      delete this.state.touched[fieldName];
    });

    // 通知字段监听器
    this.fieldListeners.forEach((listener) => listener(fieldName, undefined));
  }

  /**
   * 执行联动
   */
  runReactions(changedField: string): void {
    // 遍历所有字段，检查是否有依赖 changedField 的联动规则
    Object.entries(this.state.reactions).forEach(([fieldName, reactions]) => {
      reactions.forEach((reaction) => {
        if (reaction.dependencies.includes(changedField)) {
          const field = this.state.fields[fieldName];
          if (field) {
            reaction.run(field, this);
          }
        }
      });
    });
  }

  /**
   * 获取所有字段
   */
  getAllFields(): Map<string, FieldNodeAPI> {
    return new Map(Object.entries(this.state.fields));
  }

  /**
   * 订阅值变化
   */
  subscribeToValueChange(listener: ValueChangeListener): () => void {
    this.valueListeners.add(listener);
    return () => {
      this.valueListeners.delete(listener);
    };
  }

  /**
   * 订阅字段变化
   */
  subscribeToFieldChange(listener: FieldChangeListener): () => void {
    this.fieldListeners.add(listener);
    return () => {
      this.fieldListeners.delete(listener);
    };
  }

  /**
   * 设置字段错误
   */
  setFieldError(name: string, error: string | undefined): void {
    if (error) {
      this.state.errors[name] = error;
    } else {
      delete this.state.errors[name];
    }
  }

  /**
   * 获取字段错误
   */
  getFieldError(name: string): string | undefined {
    return this.state.errors[name];
  }

  /**
   * 获取所有错误
   */
  getErrors(): Record<string, string> {
    return { ...this.state.errors };
  }

  /**
   * 清除所有错误
   */
  clearErrors(): void {
    this.state.errors = {};
  }

  /**
   * 设置字段 touched 状态
   */
  setFieldTouched(name: string, touched: boolean): void {
    this.state.touched[name] = touched;
  }

  /**
   * 获取字段 touched 状态
   */
  isFieldTouched(name: string): boolean {
    return this.state.touched[name] || false;
  }

  /**
   * 验证单个字段
   */
  async validateField(name: string): Promise<string | undefined> {
    const field = this.state.fields[name];
    if (!field) return undefined;
    const error = await field.validate();
    if (error) this.setFieldError(name, error);
    else this.setFieldError(name, undefined);
    return error;
  }

  /**
   * 验证所有字段
   */
  async validateAllFields(): Promise<Record<string, string>> {
    const errors: Record<string, string> = {};

    for (const [name, field] of Object.entries(this.state.fields)) {
      const fieldErrors = await field.validate();
      if (fieldErrors && fieldErrors.length > 0) {
        errors[name] = fieldErrors[0];
        this.setFieldError(name, fieldErrors[0]);
      }
    }

    return errors;
  }

  /**
   * 重置所有值
   */
  reset(): void {
    batchUpdate(() => {
      Object.entries(this.state.fields).forEach(([name, field]) => {
        const { initialValue } = field.schema;
        this.state.values[name] = initialValue;
        delete this.state.errors[name];
        delete this.state.touched[name];

        // 触发字段值变化生命周期
        if (field.schema.lifecycle?.onValueChange) {
          field.schema.lifecycle.onValueChange(initialValue, undefined, field, this);
        }
      });
    });

    // 通知所有值变化
    const allValues = this.getValues();
    this.valueListeners.forEach((listener) => {
      Object.keys(this.state.fields).forEach((name) => {
        listener(name, this.state.values[name], allValues);
      });
    });
  }

  /**
   * 重置指定字段
   */
  resetField(name: string): void {
    const field = this.state.fields[name];
    if (field) {
      const { initialValue } = field.schema;

      batchUpdate(() => {
        this.state.values[name] = initialValue;
        delete this.state.errors[name];
        delete this.state.touched[name];
      });

      if (field.schema.lifecycle?.onValueChange) {
        field.schema.lifecycle.onValueChange(initialValue, undefined, field, this);
      }

      // 通知值变化
      this.notifyValueChange(name, initialValue);
    }
  }

  /**
   * 获取响应式状态（供内部使用）
   */
  getState(): FormState {
    return this.state;
  }
}

/**
 * 创建 FormStore 实例
 */
export function createFormStore(): FormStore {
  return new FormStore();
}
