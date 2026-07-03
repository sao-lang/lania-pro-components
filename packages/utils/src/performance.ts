/**
 * 性能优化工具集
 *
 * 提供前端性能优化相关的工具类和函数，包括：
 * - 任务队列（基于 requestAnimationFrame 的任务调度）
 * - 批量更新管理器（合并高频更新操作）
 * - 防抖（debounce）和节流（throttle）
 * - 记忆化（memoize）和 LRU 缓存
 * - 性能监控器（PerformanceMonitor）
 * - 空闲任务调度（requestIdleCallback 降级方案）
 * - 分片任务执行（chunked task）
 *
 * 这些工具适用于高频事件处理、大量数据渲染优化、请求去重等场景。
 */

// ======================== 任务队列 ========================

/**
 * 任务队列
 *
 * 基于 requestAnimationFrame 实现的任务调度器。
 * 将任务收集到队列中，在下一帧统一批量执行，避免频繁操作 DOM 导致的性能问题。
 * 执行时会以每批 10 个任务的方式分批执行，每批之间通过 setTimeout 让出主线程，
 * 避免长时间阻塞渲染。
 *
 * @example
 * ```ts
 * const queue = new TaskQueue();
 * queue.add(() => updateDOM());
 * queue.addBatch([() => updateChart(), () => updateTable()]);
 * ```
 */
export class TaskQueue {
  /** 待执行的任务队列 */
  private queue: Array<() => void> = [];
  /** 是否正在执行中（防止重复调度） */
  private isRunning = false;
  /** requestAnimationFrame 返回的帧 ID，用于取消调度 */
  private frameId: number | null = null;

  /**
   * 添加单个任务到队列
   *
   * @param task - 待执行的任务函数
   */
  add(task: () => void): void {
    this.queue.push(task);
    this.schedule();
  }

  /**
   * 批量添加任务到队列
   *
   * @param tasks - 待执行的任务函数数组
   */
  addBatch(tasks: Array<() => void>): void {
    this.queue.push(...tasks);
    this.schedule();
  }

  /**
   * 调度任务执行
   *
   * 通过 requestAnimationFrame 将任务执行推迟到下一帧。
   * 如果已经在调度中或队列为空，则跳过。
   */
  private schedule(): void {
    // 已经在运行中或队列为空时，不重复调度
    if (this.isRunning || this.queue.length === 0) {
      return;
    }

    this.isRunning = true;
    this.frameId = requestAnimationFrame(() => {
      this.flush();
    });
  }

  /**
   * 清空队列并分批执行所有任务
   *
   * 执行策略：
   * 1. 每次取出最多 10 个任务组成一批
   * 2. 同步执行当前批次
   * 3. 通过 setTimeout(fn, 0) 让出主线程后执行下一批
   * 4. 所有批次执行完毕后，检查是否又有新任务加入
   */
  private flush(): void {
    // 一次性取出所有待执行任务（splice 会清空原数组）
    const tasks = this.queue.splice(0, this.queue.length);

    /**
     * 分批递归执行任务
     *
     * @param index - 当前批次的起始索引
     */
    const executeBatch = (index: number) => {
      // 所有批次执行完毕
      if (index >= tasks.length) {
        this.isRunning = false;
        // 执行期间可能有新任务加入，再次检查
        if (this.queue.length > 0) {
          this.schedule();
        }
        return;
      }

      // 每批最多执行 10 个任务
      const batch = tasks.slice(index, index + 10);
      batch.forEach((task) => {
        try {
          task();
        } catch (error) {
          console.error('Task execution error:', error);
        }
      });

      // 通过 setTimeout 让出主线程，避免长时间阻塞
      setTimeout(() => executeBatch(index + 10), 0);
    };

    executeBatch(0);
  }

  /**
   * 清空队列并取消待执行的调度
   */
  clear(): void {
    this.queue.length = 0;
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
    this.isRunning = false;
  }

  /**
   * 获取当前队列中的任务数量
   */
  get length(): number {
    return this.queue.length;
  }
}

/** 全局共享的任务队列实例 */
export const globalTaskQueue = new TaskQueue();

// ======================== 批量更新管理器 ========================

/**
 * 批量更新管理器
 *
 * 用于优化大量字段同时更新的性能。
 * 将短时间内多次更新合并为一次批量回调，减少不必要的重复渲染或计算。
 *
 * 工作原理：
 * 1. 每次 add(name, value) 会将更新暂存到内部 Map 中
 * 2. 在指定的延迟（delay）内如果有多次 add，它们会被合并
 * 3. 延迟结束后，通过 onBatchUpdate 回调一次性提交所有累积的更新
 *
 * @example
 * ```ts
 * const manager = new BatchUpdateManager((updates) => {
 *   updates.forEach((value, name) => setFieldValue(name, value));
 * }, 100); // 100ms 内的多次更新会合并
 *
 * manager.add('name', 'Alice');
 * manager.add('age', 30);
 * // 100ms 后一次性回调，updates = Map { 'name' => 'Alice', 'age' => 30 }
 * ```
 */
export class BatchUpdateManager {
  /** 暂存待提交的更新（键为字段名，值为新值） */
  private updates: Map<string, unknown> = new Map();
  /** 延期执行的定时器 ID */
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  /** 延迟时间（毫秒），默认 16ms（约一帧） */
  private delay: number;
  /** 批量提交时的回调函数 */
  private onBatchUpdate: (updates: Map<string, unknown>) => void;

  /**
   * 创建批量更新管理器
   *
   * @param onBatchUpdate - 批量更新时的回调函数，接收累积的更新 Map
   * @param delay - 延迟时间（毫秒），默认 16ms
   */
  constructor(onBatchUpdate: (updates: Map<string, unknown>) => void, delay = 16) {
    this.onBatchUpdate = onBatchUpdate;
    this.delay = delay;
  }

  /**
   * 添加单个字段更新
   *
   * @param name - 字段名称
   * @param value - 新值（后续的同名字段更新会覆盖之前的值）
   */
  add(name: string, value: unknown): void {
    this.updates.set(name, value);
    this.schedule();
  }

  /**
   * 批量添加多个字段更新
   *
   * @param updates - 字段名到新值的映射对象
   */
  addBatch(updates: Record<string, unknown>): void {
    Object.entries(updates).forEach(([name, value]) => {
      this.updates.set(name, value);
    });
    this.schedule();
  }

  /**
   * 调度批量提交
   *
   * 如果已有定时器在等待，则跳过（复用已有定时器）。
   * 这确保了在 delay 时间内多次 add 会被合并。
   */
  private schedule(): void {
    if (this.timeoutId) {
      return; // 已有定时器在等待，复用即可
    }

    this.timeoutId = setTimeout(() => {
      this.flush();
    }, this.delay);
  }

  /**
   * 立即执行所有累积的更新
   *
   * 清除定时器，将当前 Map 中的更新快照提交给回调函数。
   */
  flush(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    if (this.updates.size > 0) {
      // 创建快照（复制 Map），避免回调中继续修改导致的问题
      const updates = new Map(this.updates);
      this.updates.clear();
      this.onBatchUpdate(updates);
    }
  }

  /**
   * 销毁管理器
   *
   * 清除定时器并清空所有待提交的更新。
   */
  destroy(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.updates.clear();
  }

  /**
   * 获取当前待提交的更新数量
   */
  get pendingCount(): number {
    return this.updates.size;
  }
}

// ======================== 防抖 ========================

/**
 * 创建一个防抖（debounce）函数
 *
 * 在连续触发事件时，只有在最后一次触发后的等待时间（delay）内没有再次触发，
 * 才会执行目标函数。
 *
 * 支持 immediate（立即执行）模式：
 * - immediate=false（默认）：等待 delay 毫秒后执行
 * - immediate=true：首次触发时立即执行，后续 delay 内的触发被忽略
 *
 * 典型应用场景：
 * - 搜索框输入实时搜索（immediate=false）
 * - 按钮防重复点击（immediate=true）
 * - 窗口 resize 回调
 *
 * @param fn - 需要防抖的目标函数
 * @param delay - 等待时间（毫秒）
 * @param immediate - 是否立即执行，默认 false
 * @returns 经过防抖包装的新函数
 *
 * @template T - 目标函数的类型
 *
 * @example
 * ```ts
 * // 搜索输入防抖（300ms 内不再输入才触发搜索）
 * const search = debounce((keyword) => fetchResults(keyword), 300);
 * input.addEventListener('input', (e) => search(e.target.value));
 *
 * // 按钮防重复点击（首次点击立即执行，1s 内再次点击无效）
 * const submit = debounce(() => api.submit(), 1000, true);
 * <button onClick={submit}>提交</button>
 * ```
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number,
  immediate = false,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: unknown, ...args: Parameters<T>) {
    // immediate 模式 + 首次调用（timeoutId 为 null）→ 立即执行
    const callNow = immediate && !timeoutId;

    // 清除之前的定时器（每次调用都重新计时）
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // 设置新的定时器
    timeoutId = setTimeout(() => {
      timeoutId = null; // 重置状态
      if (!immediate) {
        // 非 immediate 模式：定时器到期后执行
        fn.apply(this, args);
      }
    }, delay);

    // immediate 模式：立即执行并开始计时
    if (callNow) {
      fn.apply(this, args);
    }
  };
}

// ======================== 节流 ========================

/**
 * 创建一个节流（throttle）函数
 *
 * 在指定的时间间隔（limit）内，目标函数最多执行一次。
 * 无论触发频率多高，在 limit 毫秒内只会执行一次。
 *
 * 与防抖的区别：
 * - 防抖：只执行最后一次（适合输入搜索）
 * - 节流：按固定频率执行（适合滚动事件、动画帧同步）
 *
 * @param fn - 需要节流的目标函数
 * @param limit - 最小执行间隔（毫秒）
 * @returns 经过节流包装的新函数
 *
 * @template T - 目标函数的类型
 *
 * @example
 * ```ts
 * // 滚动事件节流（每 100ms 最多执行一次）
 * const handleScroll = throttle(() => updateScrollPosition(), 100);
 * window.addEventListener('scroll', handleScroll);
 * ```
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function (this: unknown, ...args: Parameters<T>) {
    // 不在节流冷却期内才执行
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      // limit 毫秒后解除冷却
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

// ======================== 记忆化 ========================

/**
 * 创建一个记忆化（memoize）函数
 *
 * 缓存函数的调用结果。当使用相同参数再次调用时，直接返回缓存值，
 * 避免重复计算。
 *
 * 缓存键生成策略：
 * - 默认使用 JSON.stringify(args) 作为缓存键
 * - 可通过 keyGenerator 自定义缓存键生成逻辑
 *
 * 注意：缓存无过期机制，会无限增长。
 * 对于需要控制缓存大小的场景，请使用 LRUCache。
 *
 * @param fn - 需要记忆化的目标函数
 * @param keyGenerator - 可选的缓存键生成函数，接收参数并返回字符串键
 * @returns 带有缓存功能的同名函数
 *
 * @template T - 目标函数的类型
 *
 * @example
 * ```ts
 * // 基本用法：缓存计算结果
 * const factorial = memoize((n: number): number => {
 *   if (n <= 1) return 1;
 *   return n * factorial(n - 1);
 * });
 *
 * // 自定义缓存键
 * const getUser = memoize(
 *   (id: number, fresh?: boolean) => api.getUser(id),
 *   (id, fresh) => `${id}_${fresh ? 'fresh' : 'cache'}`,
 * );
 * ```
 */
export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string,
): T {
  const cache = new Map<string, ReturnType<T>>();

  return function (this: unknown, ...args: Parameters<T>): ReturnType<T> {
    // 生成缓存键：自定义生成器 > JSON 序列化
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

    // 缓存命中：直接返回
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    // 缓存未命中：执行原函数并缓存结果
    const result = fn.apply(this, args) as ReturnType<T>;
    cache.set(key, result);
    return result;
  } as T;
}

// ======================== LRU 缓存 ========================

/**
 * LRU（Least Recently Used，最近最少使用）缓存
 *
 * 基于 Map 实现的 LRU 缓存淘汰策略。
 * 当缓存达到最大容量时，自动删除最久未被访问的条目。
 *
 * Map 的 key 迭代顺序就是插入顺序，利用这一特性实现 LRU。
 *
 * @template K - 缓存键的类型
 * @template V - 缓存值的类型
 *
 * @example
 * ```ts
 * const cache = new LRUCache<string, UserData>(3); // 最多缓存 3 个
 * cache.set('a', userA);
 * cache.set('b', userB);
 * cache.set('c', userC);
 * cache.set('d', userD); // 超过容量，'a' 被淘汰
 * cache.get('a');         // undefined（已被淘汰）
 * ```
 */
export class LRUCache<K, V> {
  /** 内部存储 Map，利用其 key 插入顺序实现 LRU */
  private cache: Map<K, V>;
  /** 最大缓存条目数 */
  private maxSize: number;

  /**
   * 创建 LRU 缓存实例
   *
   * @param maxSize - 最大缓存条目数，默认 100
   */
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  /**
   * 获取缓存值
   *
   * 访问命中时会将该项移动到末尾（标记为"最近使用"）。
   *
   * @param key - 缓存键
   * @returns 缓存的值，不存在返回 undefined
   */
  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // 命中：删除后重新插入，将其移到末尾（最近使用）
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  /**
   * 设置缓存值
   *
   * 如果键已存在，会更新值并移到末尾。
   * 如果超过最大容量，会删除最久未使用的条目（Map 的第一个 key）。
   *
   * @param key - 缓存键
   * @param value - 缓存值
   */
  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      // 键已存在：删除旧的，后面重新插入到末尾
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // 容量已满：删除最久未使用的条目（Map 迭代的第一个 key）
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  /**
   * 删除指定键的缓存
   *
   * @param key - 缓存键
   * @returns 是否成功删除（键存在才返回 true）
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 检查指定键是否在缓存中
   *
   * @param key - 缓存键
   * @returns 是否存在
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }

  /**
   * 获取当前缓存条目数量
   */
  get size(): number {
    return this.cache.size;
  }
}

// ======================== 性能监控器 ========================

/**
 * 性能监控器
 *
 * 用于测量代码块的执行耗时，支持多次测量统计。
 * 在开发环境下可帮助识别性能瓶颈。
 *
 * 使用方式：
 * 1. mark(name) 记录开始时间点
 * 2. measure(name) 计算从上次 mark 到现在的耗时
 * 3. getStats(name) 获取某测量项的统计信息
 *
 * @example
 * ```ts
 * const monitor = new PerformanceMonitor();
 *
 * monitor.mark('render');
 * expensiveRender();
 * const duration = monitor.measure('render');
 * console.log(`渲染耗时: ${duration}ms`);
 *
 * // 获取统计信息
 * monitor.getStats('render'); // { avg, min, max, count }
 * monitor.printStats();       // 打印所有统计
 * ```
 */
export class PerformanceMonitor {
  /** 标记记录（标记名 -> 开始时间戳） */
  private marks: Map<string, number> = new Map();
  /** 测量记录（测量名 -> 耗时数组，保留最近 100 条） */
  private measures: Map<string, number[]> = new Map();
  /** 是否启用监控 */
  private enabled: boolean;

  /**
   * 创建性能监控器
   *
   * @param enabled - 是否启用，默认 true
   */
  constructor(enabled = true) {
    this.enabled = enabled;
  }

  /**
   * 记录时间标记点
   *
   * @param name - 标记名称（后续 measure 时使用同名）
   */
  mark(name: string): void {
    if (!this.enabled) {
      return;
    }
    // 使用 performance.now() 获取高精度时间戳
    this.marks.set(name, performance.now());
  }

  /**
   * 结束计时并记录耗时
   *
   * @param name - 测量名称（与 mark 时的名称对应）
   * @param startMark - 可选，指定起始标记名；不传则使用 name 作为标记名
   * @returns 耗时（毫秒），如果起始标记不存在或监控未启用则返回 null
   */
  measure(name: string, startMark?: string): number | null {
    if (!this.enabled) {
      return null;
    }

    const endTime = performance.now();
    // 查找起始时间：优先指定的 startMark，否则用 name
    const startTime = startMark ? this.marks.get(startMark) : this.marks.get(name);

    if (startTime === undefined) {
      console.warn(`Mark "${startMark || name}" not found`);
      return null;
    }

    const duration = endTime - startTime;

    // 记录耗时到测量数组中
    if (!this.measures.has(name)) {
      this.measures.set(name, []);
    }
    this.measures.get(name)!.push(duration);

    // 只保留最近 100 条记录，避免内存无限增长
    const records = this.measures.get(name)!;
    if (records.length > 100) {
      records.shift(); // 移除最早的记录
    }

    return duration;
  }

  /**
   * 获取某测量项的统计信息
   *
   * @param name - 测量名称
   * @returns 统计对象或 null（无记录时）
   *   - avg: 平均耗时（毫秒）
   *   - min: 最小耗时（毫秒）
   *   - max: 最大耗时（毫秒）
   *   - count: 测量次数
   */
  getStats(name: string): { avg: number; min: number; max: number; count: number } | null {
    const records = this.measures.get(name);
    if (!records || records.length === 0) {
      return null;
    }

    const sum = records.reduce((a, b) => a + b, 0);
    return {
      avg: sum / records.length,
      min: Math.min(...records),
      max: Math.max(...records),
      count: records.length,
    };
  }

  /**
   * 在控制台打印所有测量统计
   *
   * 使用 console.group 分组展示，便于查看。
   */
  printStats(): void {
    if (!this.enabled) {
      return;
    }

    console.group('Performance Stats');
    this.measures.forEach((records, name) => {
      const stats = this.getStats(name);
      if (stats) {
        console.log(
          `${name}: avg=${stats.avg.toFixed(2)}ms, min=${stats.min.toFixed(2)}ms, max=${stats.max.toFixed(2)}ms, count=${stats.count}`,
        );
      }
    });
    console.groupEnd();
  }

  /**
   * 清空所有标记和测量记录
   */
  clear(): void {
    this.marks.clear();
    this.measures.clear();
  }

  /**
   * 设置启用/禁用状态
   *
   * @param enabled - true 启用，false 禁用（禁用后 mark/measure 不记录）
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

/** 全局性能监控器实例，仅在开发环境下启用 */
export const performanceMonitor = new PerformanceMonitor(process.env.NODE_ENV === 'development');

// ======================== 空闲任务调度 ========================

/**
 * 使用 requestIdleCallback 执行低优先级任务
 *
 * 浏览器空闲时执行任务，不影响高优先级操作（如动画、用户交互）。
 * 如果浏览器不支持 requestIdleCallback（如 Safari），降级使用 setTimeout。
 *
 * @param task - 低优先级任务函数
 * @param timeout - 可选，超时时间（毫秒），超时后即使浏览器不空闲也会执行
 *
 * @example
 * ```ts
 * // 在浏览器空闲时预加载数据
 * scheduleIdleTask(() => {
 *   prefetchData('next-page-data');
 * });
 * ```
 */
export function scheduleIdleTask(task: () => void, timeout?: number): void {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    // 浏览器支持 requestIdleCallback，使用空闲回调
    window.requestIdleCallback(task, { timeout });
  } else {
    // 降级方案：使用 setTimeout 延迟到下一个事件循环
    setTimeout(task, 1);
  }
}

// ======================== 分片任务执行 ========================

/**
 * 将大任务拆分为多个小片执行
 *
 * 用于处理大量数据时避免长时间阻塞主线程。
 * 每组（chunk）执行完毕后通过 scheduleIdleTask 让出主线程，
 * 确保用户交互和动画不受影响。
 *
 * @param items - 待处理的数据数组
 * @param task - 对每个数据项执行的处理函数
 * @param chunkSize - 每片处理的数据量，默认 10
 * @param onComplete - 所有数据处理完毕后的回调
 *
 * @template T - 数据项的类型
 *
 * @example
 * ```ts
 * // 分批处理 10000 条数据
 * scheduleChunkedTask(
 *   largeDataArray,
 *   (item) => processItem(item),
 *   50,
 *   () => console.log('所有数据处理完毕'),
 * );
 * ```
 */
export function scheduleChunkedTask<T>(
  items: T[],
  task: (item: T) => void,
  chunkSize = 10,
  onComplete?: () => void,
): void {
  let index = 0;

  /**
   * 处理当前片的数据
   *
   * 处理完当前片后，如果还有剩余数据，通过空闲任务调度继续处理下一片；
   * 如果已全部处理完毕，触发完成回调。
   */
  const processChunk = () => {
    // 取出当前片的数据
    const chunk = items.slice(index, index + chunkSize);
    chunk.forEach(task);
    index += chunkSize;

    if (index < items.length) {
      // 还有剩余数据：空闲时继续处理下一片
      scheduleIdleTask(processChunk);
    } else {
      // 全部处理完毕
      onComplete?.();
    }
  };

  // 开始处理第一片
  processChunk();
}

export default {
  TaskQueue,
  globalTaskQueue,
  BatchUpdateManager,
  debounce,
  throttle,
  memoize,
  LRUCache,
  PerformanceMonitor,
  performanceMonitor,
  scheduleIdleTask,
  scheduleChunkedTask,
};
