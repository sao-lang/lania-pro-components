/**
 * FieldNode — 字段运行时实例
 *
 * 每个表单字段对应一个 FieldNode 实例，管理字段的运行时状态：
 * - 字段值（响应式，通过 ref 包装）
 * - 字段错误
 * - 字段状态（edit / readonly / disabled / hidden / preview）
 * - 计算行为（visible / display / required 等，通过 computed 自动追踪依赖）
 * - 值变化/状态变化订阅
 * - 字段生命周期（onInit / onValueChange / onFocus 等）
 *
 * 使用 @lania-pro-components/utils 的响应式系统（reactive/ref/computed/watch）
 * 实现字段级别的响应式状态管理。
 */

/* eslint-disable @typescript-eslint/naming-convention */
import type { FieldNodeAPI, ProFormSchema, FieldStatus, FormStoreAPI } from '../types';
import { computed, watch, ref, type ComputedRef } from '@lania-pro-components/utils';

/**
 * 计算行为值
 */
function computeBehaviorValue(
  value: boolean | ((values: Record<string, unknown>) => boolean) | undefined,
  values: Record<string, unknown>,
  defaultValue: boolean,
): boolean {
  if (value === undefined) {
    return defaultValue;
  }
  if (typeof value === 'function') {
    return value(values);
  }
  return value;
}

/**
 * 计算后的行为类型
 */
export interface ComputedFieldBehavior {
  visible: boolean;
  display: boolean;
  disabled: boolean;
  readonly: boolean;
  preview: boolean;
  required: boolean;
}

/**
 * FieldNode 实现
 * 字段运行时实例 - 使用响应式系统优化
 */
export class FieldNode implements FieldNodeAPI {
  name: string | string[];
  schema: ProFormSchema;

  // 使用 ref 创建响应式值
  private _value = ref<unknown>(undefined);
  private _error = ref<string | undefined>(undefined);
  private _status = ref<FieldStatus>('edit');
  private _focused = ref<boolean>(false);

  // 计算属性 - 自动追踪依赖
  private _computedBehavior: ComputedRef<ComputedFieldBehavior>;

  private store: FormStoreAPI;
  private onChangeCallbacks: Set<(value: unknown) => void> = new Set();
  private onStatusChangeCallbacks: Set<(status: FieldStatus, oldStatus: FieldStatus) => void> = new Set();
  private valueWatchCleanup?: () => void;

  constructor(schema: ProFormSchema, store: FormStoreAPI) {
    this.name = schema.name;
    this.schema = schema;
    this.store = store;

    // 获取字段名（数组类型使用第一个字段名）
    const fieldName = Array.isArray(schema.name) ? schema.name[0] : schema.name;

    // 初始化值：优先使用 store 中已有的值，否则使用 schema.initialValue
    if (fieldName in store.getValues()) {
      this._value.value = store.getValue(fieldName);
    } else {
      this._value.value = schema.initialValue;
    }

    // 创建计算属性 - 自动追踪 store 中的值变化
    this._computedBehavior = computed(() => {
      const values = store.getValues();
      const behavior = schema.behavior || {};

      return {
        visible: computeBehaviorValue(behavior.visible, values, true),
        display: computeBehaviorValue(behavior.display, values, true),
        disabled: computeBehaviorValue(behavior.disabled, values, false),
        readonly: computeBehaviorValue(behavior.readonly, values, false),
        preview: computeBehaviorValue(behavior.preview, values, false),
        required: computeBehaviorValue(behavior.required, values, schema.required || false),
      };
    });

    // 监听计算行为变化，自动更新状态
    watch(
      () => this._computedBehavior.value,
      (newBehavior, oldBehavior) => {
        if (JSON.stringify(newBehavior) !== JSON.stringify(oldBehavior)) {
          this.updateStatusFromBehavior();
        }
      },
      { immediate: true },
    );

    // 监听 store 中对应字段的值变化
    this.setupStoreValueWatch();
  }

  /**
   * 设置 store 值监听
   */
  private setupStoreValueWatch(): void {
    // 获取字段名（数组类型使用第一个字段名）
    const fieldName = Array.isArray(this.name) ? this.name[0] : this.name;

    // 使用 watch 监听 store 中的值变化
    this.valueWatchCleanup = watch(
      () => this.store.getValue(fieldName),
      (newValue, oldValue) => {
        if (newValue !== this._value.value) {
          this._value.value = newValue;
          this.onChangeCallbacks.forEach((cb) => cb(newValue));

          // 触发生命周期
          if (this.schema.lifecycle?.onValueChange) {
            this.schema.lifecycle.onValueChange(newValue, oldValue, this, this.store);
          }
        }
      },
      { immediate: true },
    );
  }

  /**
   * 获取值（响应式）
   */
  get value(): unknown {
    return this._value.value;
  }

  /**
   * 获取错误（响应式）
   */
  get error(): string | undefined {
    return this._error.value;
  }

  /**
   * 获取状态（响应式）
   */
  get status(): FieldStatus {
    return this._status.value;
  }

  /**
   * 获取计算行为（响应式）
   */
  get computedBehavior(): ComputedFieldBehavior {
    return this._computedBehavior.value;
  }

  /**
   * 设置值
   */
  setValue(newValue: unknown): void {
    // 应用转换
    let transformedValue = newValue;
    if (this.schema.transform?.output) {
      transformedValue = this.schema.transform.output(newValue);
    }

    // 获取字段名（数组类型使用第一个字段名）
    const fieldName = Array.isArray(this.name) ? this.name[0] : this.name;

    this._value.value = transformedValue;
    this.store.setValue(fieldName, transformedValue);

    // 通知回调
    this.onChangeCallbacks.forEach((cb) => cb(transformedValue));
  }

  /**
   * 获取值
   */
  getValue(): unknown {
    let result = this._value.value;

    // 应用输入转换
    if (this.schema.transform?.input) {
      result = this.schema.transform.input(result);
    }

    return result;
  }

  /**
   * 设置错误
   */
  setError(error?: string): void {
    const oldError = this._error.value;
    this._error.value = error;

    // 触发生命周期
    if (this.schema.lifecycle?.onError && oldError !== error) {
      this.schema.lifecycle.onError(error, this, this.store);
    }
  }

  /**
   * 设置状态
   */
  setStatus(status: FieldStatus): void {
    const oldStatus = this._status.value;
    if (oldStatus === status) {
      return;
    }

    this._status.value = status;

    // 通知状态变化回调
    this.onStatusChangeCallbacks.forEach((cb) => cb(status, oldStatus));

    // 触发生命周期
    if (this.schema.lifecycle?.onStatusChange) {
      this.schema.lifecycle.onStatusChange(status, oldStatus, this, this.store);
    }
  }

  /**
   * 更新计算行为
   * 现在由 computed 自动处理，此方法用于手动触发或兼容旧代码
   */
  updateComputedBehavior(_values: Record<string, unknown>): void {
    // computed 会自动追踪依赖，无需手动更新
    // 但我们需要根据新的计算行为更新状态
    this.updateStatusFromBehavior();
  }

  /**
   * 订阅值变化
   */
  subscribeToValueChange(callback: (value: unknown) => void): () => void {
    this.onChangeCallbacks.add(callback);
    return () => {
      this.onChangeCallbacks.delete(callback);
    };
  }

  /**
   * 订阅状态变化
   */
  subscribeToStatusChange(callback: (status: FieldStatus, oldStatus: FieldStatus) => void): () => void {
    this.onStatusChangeCallbacks.add(callback);
    return () => {
      this.onStatusChangeCallbacks.delete(callback);
    };
  }

  /**
   * 根据行为计算状态
   */
  private updateStatusFromBehavior(): void {
    const { visible, disabled, readonly, preview } = this._computedBehavior.value;

    if (!visible) {
      this.setStatus('hidden');
    } else if (preview) {
      this.setStatus('preview');
    } else if (readonly) {
      this.setStatus('readonly');
    } else if (disabled) {
      this.setStatus('disabled');
    } else {
      this.setStatus('edit');
    }
  }

  /**
   * 获取焦点状态
   */
  get focused(): boolean {
    return this._focused.value;
  }

  /**
   * 设置焦点
   */
  setFocus(): void {
    if (!this._focused.value) {
      this._focused.value = true;
      if (this.schema.lifecycle?.onFocus) {
        this.schema.lifecycle.onFocus(this, this.store);
      }
    }
  }

  /**
   * 移除焦点
   */
  removeFocus(): void {
    if (this._focused.value) {
      this._focused.value = false;
      if (this.schema.lifecycle?.onBlur) {
        this.schema.lifecycle.onBlur(this, this.store);
      }
    }
  }

  /**
   * 验证字段
   */
  validate(): Promise<string | undefined> {
    // 如果字段隐藏，不验证
    if (this._status.value === 'hidden') {
      return Promise.resolve(undefined);
    }

    // 获取显示用的字段名（数组类型使用第一个字段名）
    const displayName = Array.isArray(this.name) ? this.name[0] : this.name;

    // 检查必填
    if (this._computedBehavior.value.required) {
      const { value } = this._value;
      const isEmpty =
        value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);

      if (isEmpty) {
        const error = `${this.schema.label || displayName} 不能为空`;
        this.setError(error);
        return Promise.resolve(error);
      }
    }

    // 执行自定义验证规则
    if (this.schema.rules) {
      for (const rule of this.schema.rules) {
        // 检查 required 规则
        if ('required' in rule && rule.required && !this._value.value) {
          const requiredRule = rule as { required: true; message?: string };
          const errorMsg = requiredRule.message || `${this.schema.label || displayName} 不能为空`;
          this.setError(errorMsg);
          return Promise.resolve(errorMsg);
        }

        // 可以扩展更多验证规则
      }
    }

    this.setError(undefined);
    return Promise.resolve(undefined);
  }

  /**
   * 销毁字段节点
   */
  destroy(): void {
    // 清理 watch
    if (this.valueWatchCleanup) {
      this.valueWatchCleanup();
    }

    // 清理回调
    this.onChangeCallbacks.clear();
    this.onStatusChangeCallbacks.clear();
  }
}

/**
 * 创建 FieldNode 实例
 */
export function createFieldNode(schema: ProFormSchema, store: FormStoreAPI): FieldNode {
  return new FieldNode(schema, store);
}
