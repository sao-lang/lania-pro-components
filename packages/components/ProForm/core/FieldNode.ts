/**
 * FieldNode — 字段运行时实例
 *
 * 每个表单字段对应一个 FieldNode 实例，管理字段的运行时状态：
 * - 字段值（响应式，通过 ref 包装）
 * - 字段错误
 * - 字段状态（edit / readonly / disabled / hidden）
 * - 字段有效状态（通过 computed 自动合并 schema.behavior 与表单级约束）
 * - 值变化/状态变化订阅
 * - 字段生命周期（onInit / onValueChange / onFocus 等）
 *
 * 状态合并规则：
 *   schema.behavior === 'hidden' → hidden（绝对隐藏）
 *   formConstraints.preview      → readonly
 *   formConstraints.readonly     → readonly
 *   formConstraints.disabled     → disabled
 *   schema.behavior 有值         → 字段自身声明
 *   兜底                         → edit
 *
 * 使用 @lania-pro-components/utils 的响应式系统（reactive/ref/computed/watch）
 * 实现字段级别的响应式状态管理。
 */

/* eslint-disable @typescript-eslint/naming-convention */
import type { FieldNodeAPI, ProFormSchema, FieldStatus, FormStoreAPI, ResolvedSchema, BehaviorDecl } from '../types';
import { computed, watch, ref, type ComputedRef } from '@lania-pro-components/utils';
import { executeRule, executeRules } from '@lania-pro-components/utils';
import { resolveSchemaValue } from '../utils/resolveSchemaValue';

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
  private _computedRequired: ComputedRef<boolean>;
  private _resolvedSchema: ComputedRef<ResolvedSchema>;

  private store: FormStoreAPI;
  private onChangeCallbacks: Set<(value: unknown, oldValue: unknown) => void> = new Set();
  private onStatusChangeCallbacks: Set<(status: FieldStatus, oldStatus: FieldStatus) => void> = new Set();
  private onResolvedSchemaChangeCallbacks: Set<(resolved: ResolvedSchema) => void> = new Set();
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

    this.refreshEffectiveStatus();

    // 必填标识独立计算（schema.required 支持函数形式的条件必填）
    this._computedRequired = computed(() => {
      const values = store.getValues();
      return typeof schema.required === 'function' ? schema.required(values) : (schema.required ?? false);
    });

    // 已解析 Schema（自动解析所有函数模式字段，响应式追踪 form values 变化）
    this._resolvedSchema = computed(() => {
      const values = store.getValues();
      return {
        label: resolveSchemaValue(schema.label, values),
        component: resolveSchemaValue(schema.component, values, 'Input')!,
        componentProps: resolveSchemaValue(schema.componentProps as never, values),
        requiredMessage: resolveSchemaValue(schema.requiredMessage as never, values),
        rules: resolveSchemaValue(schema.rules as never, values),
        col: resolveSchemaValue(schema.col as never, values),
        labelCol: resolveSchemaValue(schema.labelCol as never, values),
        wrapperCol: resolveSchemaValue(schema.wrapperCol as never, values),
        tooltip: resolveSchemaValue(schema.tooltip as never, values),
        extra: resolveSchemaValue(schema.extra as never, values),
        placeholder: resolveSchemaValue(schema.placeholder as never, values),
        options: resolveSchemaValue(schema.options as never, values),
        format: resolveSchemaValue(schema.format as never, values),
        valueFormat: resolveSchemaValue(schema.valueFormat as never, values),
        prefix: resolveSchemaValue(schema.prefix as never, values),
        suffix: resolveSchemaValue(schema.suffix as never, values),
        readonlyMode: resolveSchemaValue(schema.readonlyMode as never, values),
        readonlyConfig: resolveSchemaValue(schema.readonlyConfig as never, values),
        readonlyComponent: resolveSchemaValue(schema.readonlyComponent as never, values),
      } as ResolvedSchema;
    });

    // 监听已解析 Schema 变化，通知订阅者
    watch(
      () => this._resolvedSchema.value,
      (newResolved, _oldResolved) => {
        this.onResolvedSchemaChangeCallbacks.forEach((cb) => cb(newResolved));
      },
      { immediate: false },
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
      (newValue, _oldValue) => {
        if (newValue !== this._value.value) {
          // 获取旧组件值（赋值前）
          const oldComponentValue = this.getValue();
          this._value.value = newValue;
          // 订阅回调传递组件值（经过 input 转换），与 value getter 语义一致
          const componentValue = this.getValue();
          this.onChangeCallbacks.forEach((cb) => cb(componentValue, oldComponentValue));

          // 触发生命周期（传递组件值，用户层回调更关注展示形态）
          if (this.schema.lifecycle?.onValueChange) {
            this.schema.lifecycle.onValueChange(componentValue, oldComponentValue, this, this.store);
          }
        }
      },
      { immediate: true },
    );
  }

  /**
   * 获取字段值（组件值，响应式）
   *
   * 经过 transform.input 反向转换后的值，是给组件渲染和用户操作的展示形态。
   * 内部真实存储值（output 转换后）通过 _value 持有。
   */
  get value(): unknown {
    return this.getValue();
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
   * 获取计算后的必填标识（响应式）
   * 由 schema.required 解析而来，支持函数形式的条件必填
   */
  get computedRequired(): boolean {
    return this._computedRequired.value;
  }

  /**
   * 获取已解析的 Schema（响应式）
   * 所有函数模式字段已被解析为具体值，随表单值变化自动更新
   */
  get resolvedSchema(): ResolvedSchema {
    return this._resolvedSchema.value;
  }

  /**
   * 设置值
   *
   * 接收组件值（用户输入形态），经过 transform.output 转换为存储值后写入内部状态和 store。
   */
  setValue(newValue: unknown): void {
    // 获取字段名（数组类型使用第一个字段名）
    const fieldName = Array.isArray(this.name) ? this.name[0] : this.name;

    // 应用 output 转换：将组件值转换为存储值
    // 将新值合并进表单值，使 transform 可跨字段访问
    let transformedValue = newValue;
    if (this.schema.transform?.output) {
      const allValues = { ...this.store.getValues(), [fieldName]: newValue };
      transformedValue = this.schema.transform.output(allValues);
    }

    // 获取旧组件值（赋值前）
    const oldComponentValue = this.getValue();
    this._value.value = transformedValue;
    this.store.setValue(fieldName, transformedValue);

    // 通知订阅者（传递组件值，与 value getter 语义一致）
    const componentValue = this.getValue();
    this.onChangeCallbacks.forEach((cb) => cb(componentValue, oldComponentValue));
  }

  /**
   * 获取字段值（组件值）
   *
   * 经过 transform.input 反向转换后的值，是给组件渲染和用户操作的展示形态。
   * 内部真实存储值（output 转换后）通过 _value 持有。
   *
   * 传入整个表单值（已包含当前字段值），使 transform 可跨字段计算。
   */
  getValue(): unknown {
    if (this.schema.transform?.input) {
      return this.schema.transform.input(this.store.getValues());
    }
    return this._value.value;
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
      this.schema.lifecycle?.onStatusChange(status, oldStatus, this, this.store);
    }
  }

  /**
   * 计算有效状态（合并 schema.behavior + 表单级约束）
   */
  private computeEffectiveStatus(): FieldStatus {
    const values = this.store.getValues();
    const formConstraints = this.store.getFormConstraints();

    let fieldWanted: FieldStatus | undefined;
    const behavior = this.schema.behavior as BehaviorDecl;
    if (behavior === undefined) {
      fieldWanted = undefined;
    } else if (typeof behavior === 'function') {
      fieldWanted = behavior(values);
    } else {
      fieldWanted = behavior;
    }

    if (fieldWanted === 'hidden') return 'hidden';
    if (formConstraints.preview) return 'readonly';
    if (formConstraints.readonly) return 'readonly';
    if (formConstraints.disabled) return 'disabled';
    return fieldWanted ?? 'edit';
  }

  /**
   * 手动刷新有效状态
   *
   * 不通过 computed 缓存，直接重算并 setStatus。
   * 用于 FormStore 的 watch 回调中，确保依赖字段变化时状态及时更新。
   */
  refreshEffectiveStatus(): void {
    const newStatus = this.computeEffectiveStatus();
    this.setStatus(newStatus);
  }

  /**
   * 订阅值变化
   */
  subscribeToValueChange(callback: (value: unknown, oldValue: unknown) => void): () => void {
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
   * 订阅已解析 Schema 变化
   * 当任意表单字段值变化导致 resolvedSchema 重新计算时触发
   */
  subscribeToResolvedSchemaChange(callback: (resolved: ResolvedSchema) => void): () => void {
    this.onResolvedSchemaChangeCallbacks.add(callback);
    // 立即推送当前值
    callback(this._resolvedSchema.value);
    return () => {
      this.onResolvedSchemaChangeCallbacks.delete(callback);
    };
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
   * 验证字段（委托给 ruleEngine）
   */
  async validate(): Promise<string | undefined> {
    if (this._status.value === 'hidden') return undefined;

    const values = this.store.getValues();
    const resolved = this._resolvedSchema.value;
    const displayName = Array.isArray(this.name) ? this.name[0] : this.name;
    const label = resolved.label || displayName;
    const { value } = this._value;

    // required 检查
    if (this._computedRequired.value) {
      const requiredMsg = resolved.requiredMessage || `${label} 不能为空`;
      const error = await executeRule({ required: true, message: requiredMsg }, value, values, label);
      if (error) {
        this.setError(error);
        return error;
      }
    }

    // rules 数组（已由 resolved schema 解析函数模式）
    if (resolved.rules && resolved.rules.length > 0) {
      const error = await executeRules(resolved.rules, value, values, label);
      if (error) {
        this.setError(error);
        return error;
      }
    }

    this.setError(undefined);
    return undefined;
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
    this.onResolvedSchemaChangeCallbacks.clear();
  }
}

/**
 * 创建 FieldNode 实例
 */
export function createFieldNode(schema: ProFormSchema, store: FormStoreAPI): FieldNode {
  return new FieldNode(schema, store);
}
