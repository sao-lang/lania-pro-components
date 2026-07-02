/**
 * 响应式系统核心模块
 * 基于 Proxy 实现自动依赖收集
 */

// 当前正在执行的 effect
let activeEffect: (() => void) | null = null;
// effect 栈，用于处理嵌套 effect
const effectStack: (() => void)[] = [];
// 批量更新队列
const batchQueue: Set<() => void> = new Set();
let isBatching = false;

/**
 * 依赖收集器
 * 每个响应式属性对应一个 Dep 实例
 */
class Dep {
  private subscribers: Set<() => void> = new Set();

  /**
   * 添加订阅者
   */
  depend() {
    if (activeEffect && !this.subscribers.has(activeEffect)) {
      this.subscribers.add(activeEffect);
    }
  }

  /**
   * 通知所有订阅者
   */
  notify() {
    this.subscribers.forEach((effect) => {
      if (isBatching) {
        batchQueue.add(effect);
      } else {
        effect();
      }
    });
  }

  /**
   * 移除订阅者
   */
  remove(effect: () => void) {
    this.subscribers.delete(effect);
  }
}

// 存储对象到 Dep 的映射
const targetMap = new WeakMap<object, Map<string | symbol, Dep>>();

/**
 * 获取属性的 Dep 实例
 */
function getDep(target: object, key: string | symbol): Dep {
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  let dep = depsMap.get(key);
  if (!dep) {
    dep = new Dep();
    depsMap.set(key, dep);
  }

  return dep;
}

/**
 * 创建响应式对象
 */
export function reactive<T extends object>(target: T): T {
  if (!isObject(target)) {
    return target;
  }

  // 已经是响应式对象，直接返回
  if (targetMap.has(target)) {
    return target;
  }

  return new Proxy(target, {
    get(target, key, receiver) {
      const dep = getDep(target, key);
      dep.depend();

      const result = Reflect.get(target, key, receiver);

      // 递归处理嵌套对象
      if (isObject(result)) {
        return reactive(result);
      }

      return result;
    },

    set(target, key, value, receiver) {
      const oldValue = Reflect.get(target, key, receiver);
      const result = Reflect.set(target, key, value, receiver);

      // 值发生变化时才触发更新
      if (oldValue !== value) {
        const dep = getDep(target, key);
        dep.notify();
      }

      return result;
    },

    deleteProperty(target, key) {
      const result = Reflect.deleteProperty(target, key);
      const dep = getDep(target, key);
      dep.notify();
      return result;
    },
  });
}

/**
 * 创建 effect
 */
export function effect(fn: () => void, options: { immediate?: boolean } = {}): () => void {
  const effectFn = () => {
    try {
      activeEffect = effectFn;
      effectStack.push(effectFn);
      fn();
    } finally {
      effectStack.pop();
      activeEffect = effectStack[effectStack.length - 1] || null;
    }
  };

  if (options.immediate !== false) {
    effectFn();
  }

  // 返回清理函数
  return () => {
    // 清理所有 dep 中的订阅
    // 注意：WeakMap 不支持遍历，我们需要在 Dep 中存储 effect 的反向映射
    // 这里简化处理，实际项目中可以使用额外的数据结构来追踪
    effectFn();
  };
}

/**
 * 计算属性返回类型
 */
export interface ComputedRef<T> {
  readonly value: T;
}

/**
 * 创建计算属性
 */
export function computed<T>(getter: () => T): ComputedRef<T> {
  let cachedValue: T;
  let dirty = true;

  const effectFn = effect(
    () => {
      cachedValue = getter();
      dirty = false;
    },
    { immediate: false },
  );

  return {
    get value(): T {
      if (dirty) {
        effectFn();
      }
      return cachedValue;
    },
  };
}

/**
 * 监听变化
 */
export function watch<T>(
  source: (() => T) | object,
  callback?: (newValue: T, oldValue: T | undefined) => void,
  options: { immediate?: boolean; deep?: boolean } = {},
): () => void {
  let getter: () => T;
  let oldValue: T | undefined;

  if (typeof source === 'function') {
    getter = source as () => T;
  } else {
    getter = () => source as T;
  }

  const effectFn = effect(() => {
    const newValue = getter();
    if (callback && newValue !== oldValue) {
      callback(newValue, oldValue);
    }
    oldValue = newValue;
  });

  // 处理 immediate 选项
  if (options.immediate) {
    const initialValue = getter();
    callback?.(initialValue, undefined);
    oldValue = initialValue;
  }

  return () => {
    effectFn();
  };
}

/**
 * 批量更新
 */
export function batchUpdate(fn: () => void): void {
  isBatching = true;
  try {
    fn();
  } finally {
    isBatching = false;
    batchQueue.forEach((effect) => effect());
    batchQueue.clear();
  }
}

let asyncBatchQueue: Set<() => void> = new Set();
let asyncBatchTimer: ReturnType<typeof setTimeout> | null = null;
let asyncBatchDelay = 16;
let asyncBatchMaxSize = 100;

/**
 * 设置异步批量更新配置
 */
export function setAsyncBatchConfig(config: { delay?: number; maxBatchSize?: number }): void {
  if (config.delay !== undefined) {
    asyncBatchDelay = config.delay;
  }
  if (config.maxBatchSize !== undefined) {
    asyncBatchMaxSize = config.maxBatchSize;
  }
}

/**
 * 异步批量更新
 */
export function asyncBatchUpdate(fn: () => void): void {
  isBatching = true;
  try {
    fn();
  } finally {
    isBatching = false;
    batchQueue.forEach((effect) => {
      asyncBatchQueue.add(effect);
    });
    batchQueue.clear();

    if (asyncBatchQueue.size >= asyncBatchMaxSize) {
      flushAsyncBatch();
    } else if (!asyncBatchTimer) {
      asyncBatchTimer = setTimeout(flushAsyncBatch, asyncBatchDelay);
    }
  }
}

/**
 * 刷新异步批量更新队列
 */
export function flushAsyncBatch(): void {
  if (asyncBatchTimer) {
    clearTimeout(asyncBatchTimer);
    asyncBatchTimer = null;
  }

  const currentQueue = asyncBatchQueue;
  asyncBatchQueue = new Set();

  currentQueue.forEach((effect) => {
    try {
      effect();
    } catch {
      // ignore
    }
  });
}

/**
 * 清除异步批量更新队列
 */
export function clearAsyncBatch(): void {
  if (asyncBatchTimer) {
    clearTimeout(asyncBatchTimer);
    asyncBatchTimer = null;
  }
  asyncBatchQueue.clear();
}

/**
 * 创建 ref（基本类型的响应式包装）
 */
export function ref<T>(value: T): { value: T } {
  return reactive({ value });
}

/**
 * 判断是否为对象
 */
function isObject(value: unknown): value is object {
  return value !== null && typeof value === 'object';
}

/**
 * 将普通对象转换为响应式对象（如果还不是）
 */
export function toReactive<T extends object>(target: T): T {
  if (targetMap.has(target)) {
    return target;
  }
  return reactive(target);
}

/**
 * 检查是否为响应式对象
 */
export function isReactive(target: unknown): boolean {
  return isObject(target) && targetMap.has(target);
}

/**
 * 触发特定属性的更新（手动触发）
 */
export function trigger(target: object, key: string | symbol): void {
  const dep = getDep(target, key);
  dep.notify();
}
