/**
 * 响应式系统核心模块
 *
 * 基于 ES6 Proxy 实现的一套轻量级响应式数据系统，核心功能包括：
 * - reactive: 创建响应式对象（基于 Proxy 拦截 get/set/deleteProperty）
 * - effect: 创建副作用函数（自动收集依赖并在数据变化时重新执行）
 * - computed: 创建计算属性（惰性求值 + 缓存，依赖变化时标记脏数据）
 * - watch: 监听数据变化并执行回调
 * - ref: 基本类型的响应式包装（内部复用 reactive）
 * - batchUpdate / asyncBatchUpdate: 批量更新优化
 *
 * 与 Vue 响应式系统的核心设计思路类似，但更加轻量化。
 * 适用于组件内部状态管理、表单数据的响应式绑定等场景。
 */

// ======================== 全局状态 ========================

/** 当前正在执行的 effect 函数，用于依赖收集阶段建立 effect ↔ Dep 的关联 */
let activeEffect: (() => void) | null = null;

/** effect 栈，处理嵌套 effect 的场景（effect 内部又调用 effect） */
const effectStack: (() => void)[] = [];

/** 批量更新时的 effect 暂存集合（去重，确保同一 effect 只执行一次） */
const batchQueue: Set<() => void> = new Set();

/** 是否处于批量更新模式 */
let isBatching = false;

// ======================== 依赖收集器 ========================

/**
 * 依赖收集器（Dep，Dependency 的缩写）
 *
 * 每个响应式对象属性的 getter 触发时，当前正在执行的 effect 会被添加到 Dep 中。
 * setter 触发时，Dep 通知所有订阅的 effect 重新执行。
 *
 * 这是响应式系统的核心数据结构，实现了"发布-订阅"模式。
 */
class Dep {
  /** 订阅该依赖的所有 effect 函数集合（Set 去重） */
  private subscribers: Set<() => void> = new Set();

  /**
   * 依赖收集
   *
   * 在属性的 getter 中被调用。
   * 将当前正在执行的 activeEffect 添加到订阅者集合中，
   * 同时在 activeEffect 上记录该 Dep 引用，以便清理时取消订阅。
   */
  depend() {
    if (activeEffect && !this.subscribers.has(activeEffect)) {
      this.subscribers.add(activeEffect);
      // 在 effect 上记录 Dep 引用，用于 teardown 时取消订阅
      const deps = (activeEffect as DepTracked).deps;
      if (deps) {
        deps.add(this);
      }
    }
  }

  /**
   * 通知更新
   *
   * 在属性的 setter 或 deleteProperty 中被调用。
   * 通知所有订阅该属性的 effect 重新执行。
   *
   * 批量更新模式：暂存到 batchQueue，等待 batchUpdate 结束后一次性执行
   * 非批量更新模式：立即执行
   */
  notify() {
    this.subscribers.forEach((effect) => {
      if (isBatching) {
        // 批量更新：暂存到全局队列
        batchQueue.add(effect);
      } else {
        // 非批量更新：立即执行
        effect();
      }
    });
  }

  /**
   * 移除指定的 effect 订阅者
   *
   * @param effect - 要移除的 effect 函数
   */
  remove(effect: () => void) {
    this.subscribers.delete(effect);
  }
}

// ======================== 核心映射表 ========================

/**
 * 全局 WeakMap：对象 → (属性Key → Dep 实例)
 *
 * 使用 WeakMap 的优势：
 * 1. 对象被垃圾回收时，对应的 Dep 映射也会自动清除（无内存泄漏风险）
 * 2. 不枚举属性，对 GC 更加友好
 *
 * 结构示意：
 * targetMap: {
 *   [objA] => Map { 'name' => Dep, 'age' => Dep }
 *   [objB] => Map { 'count' => Dep }
 * }
 */
const targetMap = new WeakMap<object, Map<string | symbol, Dep>>();

/**
 * 获取（或创建）指定对象指定属性的 Dep 实例
 *
 * @param target - 目标对象
 * @param key - 属性键（字符串或 Symbol）
 * @returns 对应的 Dep 实例
 */
function getDep(target: object, key: string | symbol): Dep {
  // 获取目标对象的属性→Dep 映射表，不存在则创建
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  // 获取指定属性的 Dep，不存在则创建
  let dep = depsMap.get(key);
  if (!dep) {
    dep = new Dep();
    depsMap.set(key, dep);
  }

  return dep;
}

// ======================== reactive ========================

/**
 * 创建响应式对象
 *
 * 通过 Proxy 拦截目标对象的 get、set、deleteProperty 操作，
 * 实现自动依赖收集和变更通知。
 *
 * 关键行为：
 * - get: 收集依赖（当前 activeEffect 订阅该属性）+ 递归代理嵌套对象
 * - set: 值真正变化时才通知订阅者更新（新旧值严格不等判断）
 * - deleteProperty: 删除属性时通知订阅者
 *
 * 注意事项：
 * - 已经是响应式的对象会直接返回（避免重复代理）
 * - 嵌套对象会在 getter 中惰性地创建响应式代理（访问时才代理）
 * - 数组也是对象，但 Proxy 可以拦截数组方法（push/pop/splice 等）
 *
 * @param target - 需要变为响应式的普通对象
 * @returns 代理后的响应式对象
 *
 * @example
 * ```ts
 * const state = reactive({ count: 0, nested: { value: 1 } });
 *
 * effect(() => {
 *   console.log('count changed:', state.count);
 * });
 *
 * state.count++; // 控制台输出: count changed: 1
 * state.nested.value = 2; // 也会触发（嵌套属性也是响应式的）
 * ```
 */
export function reactive<T extends object>(target: T): T {
  // 非对象类型直接返回（基本类型无法代理）
  if (!isObject(target)) {
    return target;
  }

  // 已经是响应式对象，直接返回（避免重复代理导致多个 Dep 实例）
  if (targetMap.has(target)) {
    return target;
  }

  return new Proxy(target, {
    /**
     * get 拦截器
     *
     * 1. 依赖收集：调用 dep.depend() 将当前 activeEffect 注册为订阅者
     * 2. 惰性深度代理：如果读取的属性值是对象，递归调用 reactive 使其也变为响应式
     * 3. 返回属性值
     */
    get(target, key, receiver) {
      const dep = getDep(target, key);
      dep.depend(); // ⭐ 核心：依赖收集

      const result = Reflect.get(target, key, receiver);

      // 递归代理嵌套对象（惰性深度响应化）
      // 注意：这里是惰性的，只有访问到嵌套对象时才会将其响应化
      if (isObject(result)) {
        return reactive(result);
      }

      return result;
    },

    /**
     * set 拦截器
     *
     * 1. 对比新旧值，仅在实际变化时才触发通知（避免无效更新）
     * 2. 设置新值
     * 3. 通知所有订阅该属性的 effect 重新执行
     *
     * 注意：使用 Reflect.set 而非 target[key] = value，
     * 确保 setter 的 receiver 参数正确传递（处理继承属性和 getter/setter）
     */
    set(target, key, value, receiver) {
      const oldValue = Reflect.get(target, key, receiver);
      const result = Reflect.set(target, key, value, receiver);

      // ⭐ 仅当值实际变化时才触发更新（避免循环更新和无效渲染）
      if (oldValue !== value) {
        const dep = getDep(target, key);
        dep.notify();
      }

      return result;
    },

    /**
     * deleteProperty 拦截器
     *
     * 删除属性时无条件通知订阅者（常见于动态删除对象字段的场景）
     */
    deleteProperty(target, key) {
      const result = Reflect.deleteProperty(target, key);
      const dep = getDep(target, key);
      dep.notify();
      return result;
    },
  });
}

// ======================== effect ========================

/**
 * 带依赖追踪的 effect 类型
 * 在普通函数上附加 deps 属性，记录该 effect 订阅的所有 Dep 实例。
 */
interface DepTracked {
  (): void;
  /** 该 effect 订阅的 Dep 实例集合，用于 teardown 时取消订阅 */
  deps: Set<Dep>;
}

/**
 * 创建副作用函数
 *
 * effect 是响应式系统的消费端。在 effect 执行期间，
 * 所有被访问的响应式属性都会被自动收集为该 effect 的依赖。
 * 当这些依赖发生变化时，effect 会自动重新执行。
 *
 * @param fn - 副作用函数
 * @param options - 配置项
 * @param options.immediate - 是否立即执行，默认 true
 * @returns 清理函数，调用后从所有 Dep 中移除该 effect 的订阅
 *
 * @example
 * ```ts
 * const state = reactive({ count: 0 });
 *
 * const dispose = effect(() => {
 *   console.log('count:', state.count);
 * });
 *
 * state.count = 1; // 输出: count: 1
 * dispose();       // 取消订阅，后续变更不再触发
 * state.count = 2; // 不输出
 * ```
 */
export function effect(fn: () => void, options: { immediate?: boolean } = {}): () => void {
  /**
   * 包装后的 effect 执行函数
   *
   * 核心流程：
   * 1. 执行前清理旧的 Dep 订阅（重新收集，保证依赖是最新的）
   * 2. 将自身设为 activeEffect（推入栈顶）
   * 3. 执行 fn()（此时 fn 内访问的响应式属性会通过 dep.depend() 建立依赖）
   * 4. 执行完毕后恢复之前的 activeEffect（从栈中弹出）
   */
  const effectFn: DepTracked = () => {
    // 清除旧的 Dep 订阅，确保依赖是最新的（避免残留订阅）
    effectFn.deps.forEach((dep) => dep.remove(effectFn));
    effectFn.deps.clear();

    try {
      // 推入栈顶，设为当前活跃 effect
      activeEffect = effectFn;
      effectStack.push(effectFn);
      // 执行副作用函数，触发依赖收集
      fn();
    } finally {
      // 恢复之前的 activeEffect（处理嵌套 effect 场景）
      effectStack.pop();
      activeEffect = effectStack[effectStack.length - 1] || null;
    }
  };
  effectFn.deps = new Set();

  // 默认立即执行一次（首次执行建立所有依赖关系）
  if (options.immediate !== false) {
    effectFn();
  }

  // 返回 effectFn 本身，调用可重新执行（自动清除旧依赖并重新收集）
  return effectFn;
}

/**
 * 从所有 Dep 中移除指定 effect 的订阅（停止响应）
 *
 * @param effectFn - 需要清理的 effect 函数
 */
export function disposeEffect(effectFn: () => void): void {
  const tracked = effectFn as DepTracked;
  if (tracked.deps) {
    tracked.deps.forEach((dep) => dep.remove(tracked));
    tracked.deps.clear();
  }
}

// ======================== computed ========================

/**
 * 计算属性返回类型
 *
 * 通过 .value 访问计算后的值。
 */
export interface ComputedRef<T> {
  readonly value: T;
}

/**
 * 创建计算属性
 *
 * 计算属性是一种惰性求值的响应式引用：
 * - 被访问时才计算（而非依赖变化时立即计算）
 * - 计算结果会被缓存（dirty 标志控制）
 * - 依赖变化时标记为"脏"（dirty=true），下次访问时重新计算
 *
 * 实现原理：
 * 1. 内部创建一个 effect，在 getter 执行时自动收集依赖
 * 2. 依赖变化时 effect 重新执行，更新缓存值并将 dirty 设为 false
 * 3. .value 的 getter 检查 dirty 标志，决定返回缓存值还是触发重新计算
 *
 * @param getter - 计算函数，返回计算结果
 * @returns 包含只读 .value 属性的对象
 *
 * @template T - 计算结果的类型
 *
 * @example
 * ```ts
 * const state = reactive({ count: 1, multiplier: 2 });
 *
 * const doubled = computed(() => state.count * state.multiplier);
 * console.log(doubled.value); // 2
 *
 * state.count = 5;
 * console.log(doubled.value); // 10（自动重新计算）
 *
 * // 依赖未变化时返回缓存值，不会重复执行 getter
 * console.log(doubled.value); // 10（从缓存读取）
 * ```
 */
export function computed<T>(getter: () => T): ComputedRef<T> {
  let cachedValue: T;
  let dirty = true; // 脏标志：true 表示需要重新计算

  // 内部 effect：依赖变化时执行 getter 并更新缓存
  const effectFn = effect(
    () => {
      cachedValue = getter();
      dirty = false; // 计算完成后标记为"干净"
    },
    { immediate: false }, // 不立即执行，等待第一次 .value 访问
  );

  return {
    get value(): T {
      // 脏数据需要重新计算（首次访问或依赖已变化）
      if (dirty) {
        effectFn(); // 执行 effect 触发 getter
      }
      return cachedValue;
    },
  };
}

// ======================== watch ========================

/**
 * 深度遍历对象的所有属性
 *
 * 在 effect 中调用此函数时，会触发所有嵌套属性的 Proxy getter，
 * 从而使 effect 订阅所有嵌套路径的变更。
 * 用于 watch 的 deep: true 选项。
 *
 * @param value - 需要遍历的值
 * @param seen - 已访问对象集合，防止循环引用导致的死循环
 */
function traverse(value: unknown, seen: Set<unknown> = new Set()): void {
  if (value === null || typeof value !== 'object' || seen.has(value)) {
    return;
  }
  seen.add(value);

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      traverse(value[i], seen);
    }
  } else {
    const keys = Object.keys(value as Record<string, unknown>);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      // 访问属性 → 触发 Proxy get → dep.depend() → 建立依赖
      traverse((value as Record<string, unknown>)[key], seen);
    }
  }
}

/**
 * 监听数据变化并执行回调
 *
 * 与 effect 的区别：
 * - watch 提供新旧值的对比，适合执行副作用（如 API 请求）
 * - effect 适合自动追踪依赖的渲染更新
 *
 * @param source - 监听的源数据，支持两种方式：
 *   - 函数：() => value，返回值变化时触发回调（精确监听特定属性）
 *   - 对象：直接传入响应式对象（监听整个对象引用变化）
 * @param callback - 变化时的回调函数，接收新值和旧值
 * @param options - 配置项
 * @param options.immediate - 是否立即执行一次回调（此时 oldValue 为 undefined）
 * @param options.deep - 是否深度监听，设为 true 时会遍历对象所有嵌套属性，
 *   使其中任意属性变化都能触发回调（仅对对象类型生效）
 * @returns 停止监听的清理函数
 *
 * @template T - 监听值的类型
 *
 * @example
 * ```ts
 * const state = reactive({ user: { name: 'Alice', age: 25 } });
 *
 * // 深度监听：user 内任何属性变化都触发
 * const unwatch = watch(
 *   () => state.user,
 *   (newUser, oldUser) => {
 *     console.log('user 变化:', newUser);
 *   },
 *   { deep: true },
 * );
 *
 * state.user.age = 26; // 输出: user 变化: { name: 'Alice', age: 26 }
 * unwatch();
 * ```
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
    // 对象形式：监听整个对象，默认启用 deep
    getter = () => source as T;
    if (options.deep !== false) {
      options.deep = true;
    }
  }

  // 创建内部 effect，在 getter 值变化时执行回调
  const effectFn = effect(() => {
    const newValue = getter();

    // deep 模式：遍历返回值的所有属性，收集嵌套依赖
    if (options.deep) {
      traverse(newValue);
    }

    if (callback && newValue !== oldValue) {
      callback(newValue, oldValue);
    }
    oldValue = newValue; // 更新旧值
  });

  // 处理 immediate 选项：立即执行一次回调
  if (options.immediate) {
    const initialValue = getter();
    if (options.deep) {
      traverse(initialValue);
    }
    callback?.(initialValue, undefined);
    oldValue = initialValue;
  }

  // 返回停止监听的清理函数
  return () => disposeEffect(effectFn);
}

// ======================== 批量更新 ========================

/**
 * 同步批量更新
 *
 * 在 fn 执行期间，所有响应式属性的变更不会立即触发 effect 更新，
 * 而是暂存到 batchQueue 中。fn 执行完毕后一次性执行所有暂存的 effect。
 *
 * 适用场景：需要对多个响应式属性同时赋值，避免每次赋值都触发一次更新。
 *
 * @param fn - 包含多次属性修改的同步函数
 *
 * @example
 * ```ts
 * const state = reactive({ firstName: 'Alice', lastName: 'Smith' });
 *
 * effect(() => {
 *   console.log(`全名: ${state.firstName} ${state.lastName}`);
 * });
 *
 * // 不使用 batchUpdate：每次赋值都会触发 effect（输出两次）
 * // state.firstName = 'Bob';   // 输出: 全名: Bob Smith
 * // state.lastName = 'Jones';  // 输出: 全名: Bob Jones
 *
 * // 使用 batchUpdate：只触发一次 effect
 * batchUpdate(() => {
 *   state.firstName = 'Bob';
 *   state.lastName = 'Jones';
 * });
 * // 输出一次: 全名: Bob Jones
 * ```
 */
export function batchUpdate(fn: () => void): void {
  isBatching = true;
  try {
    fn(); // 执行期间所有 set 操作暂不通知
  } finally {
    isBatching = false;
    // 统一执行所有积压的 effect
    batchQueue.forEach((effect) => effect());
    batchQueue.clear();
  }
}

// ======================== 异步批量更新 ========================

/** 异步批量更新队列 */
let asyncBatchQueue: Set<() => void> = new Set();
/** 异步批量更新定时器 */
let asyncBatchTimer: ReturnType<typeof setTimeout> | null = null;
/** 异步批量更新的延迟时间（毫秒），默认 16ms（约一帧） */
let asyncBatchDelay = 16;
/** 异步批量更新的最大容量，超过此值将立即刷新 */
let asyncBatchMaxSize = 100;

/**
 * 设置异步批量更新的配置参数
 *
 * @param config - 配置对象
 * @param config.delay - 延迟时间（毫秒），默认 16ms
 * @param config.maxBatchSize - 最大批处理大小，超过后立即刷新，默认 100
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
 *
 * 与 batchUpdate 类似，但 effect 的执行会被推迟到下一个微任务/定时器，
 * 适用于多个 batchUpdate 调用分散在不同位置的场景。
 *
 * @param fn - 包含多次属性修改的同步函数
 */
export function asyncBatchUpdate(fn: () => void): void {
  isBatching = true;
  try {
    fn();
  } finally {
    isBatching = false;
    // 将批量队列中的 effect 移到异步队列
    batchQueue.forEach((effect) => {
      asyncBatchQueue.add(effect);
    });
    batchQueue.clear();

    // 达到最大容量：立即刷新
    if (asyncBatchQueue.size >= asyncBatchMaxSize) {
      flushAsyncBatch();
    } else if (!asyncBatchTimer) {
      // 设置定时器，延迟后刷新
      asyncBatchTimer = setTimeout(flushAsyncBatch, asyncBatchDelay);
    }
  }
}

/**
 * 立即刷新异步批量更新队列
 *
 * 清除定时器，执行所有积压的异步 effect。
 */
export function flushAsyncBatch(): void {
  if (asyncBatchTimer) {
    clearTimeout(asyncBatchTimer);
    asyncBatchTimer = null;
  }

  // 交换队列并清空（避免执行期间新加入的 effect 被重复执行）
  const currentQueue = asyncBatchQueue;
  asyncBatchQueue = new Set();

  currentQueue.forEach((effect) => {
    try {
      effect();
    } catch {
      // 静默忽略 effect 中的异常（避免一个 effect 崩溃影响其他）
    }
  });
}

/**
 * 清空异步批量更新队列并取消定时器
 */
export function clearAsyncBatch(): void {
  if (asyncBatchTimer) {
    clearTimeout(asyncBatchTimer);
    asyncBatchTimer = null;
  }
  asyncBatchQueue.clear();
}

// ======================== 辅助函数 ========================

/**
 * 创建 ref（基本类型的响应式包装）
 *
 * 对于基本类型（string/number/boolean 等），Proxy 只能代理对象，
 * 因此需要用 { value: T } 对象包装，使基本类型值也能响应式。
 *
 * 内部实际调用 reactive({ value })，因此 ref 是 reactive 的特化用法。
 *
 * @param value - 任意值（通常是基本类型，也可以是对象）
 * @returns 具有 .value 属性的响应式对象
 *
 * @template T - 值的类型
 *
 * @example
 * ```ts
 * const count = ref(0);
 * effect(() => console.log(count.value));
 * count.value = 5; // 触发 effect 重新执行
 * ```
 */
export function ref<T>(value: T): { value: T } {
  return reactive({ value });
}

/**
 * 判断传入值是否为对象类型
 *
 * 规则：非 null 且 typeof 为 'object'。
 * 排除了 null（typeof null === 'object' 是 JS 的古老 bug）。
 *
 * @param value - 待判断的值
 * @returns true 表示是对象（包括数组、普通对象、Map、Set 等）
 */
export function isObject(value: unknown): value is object {
  return value !== null && typeof value === 'object';
}

/**
 * 将普通对象转换为响应式对象（如果还不是的话）
 *
 * 如果目标已经是响应式对象，直接返回（避免重复代理）。
 * 这是一个安全的"强制响应化"工具函数。
 *
 * @param target - 目标对象
 * @returns 响应式代理后的对象
 */
export function toReactive<T extends object>(target: T): T {
  if (targetMap.has(target)) {
    return target;
  }
  return reactive(target);
}

/**
 * 检查目标对象是否已经是响应式的
 *
 * 通过检查 targetMap WeakMap 中是否存在该对象的记录来判断。
 *
 * @param target - 待检查的值
 * @returns true 表示已是响应式对象
 */
export function isReactive(target: unknown): boolean {
  return isObject(target) && targetMap.has(target);
}

/**
 * 手动触发指定属性的更新通知
 *
 * 通常不需要手动调用（Proxy 的 setter 会自动触发），
 * 但在某些特殊场景下（如直接修改数组元素但未触发 setter）可能需要手动通知。
 *
 * @param target - 目标响应式对象
 * @param key - 需要触发更新的属性键
 */
export function trigger(target: object, key: string | symbol): void {
  const dep = getDep(target, key);
  dep.notify();
}
