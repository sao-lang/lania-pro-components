/**
 * 性能优化工具集
 * 包含批量更新、防抖、节流、记忆化等功能
 */

/**
 * 任务队列
 */
export class TaskQueue {
  private queue: Array<() => void> = [];
  private isRunning = false;
  private frameId: number | null = null;

  /**
   * 添加任务到队列
   */
  add(task: () => void): void {
    this.queue.push(task);
    this.schedule();
  }

  /**
   * 批量添加任务
   */
  addBatch(tasks: Array<() => void>): void {
    this.queue.push(...tasks);
    this.schedule();
  }

  /**
   * 调度执行
   */
  private schedule(): void {
    if (this.isRunning || this.queue.length === 0) {
      return;
    }

    this.isRunning = true;
    this.frameId = requestAnimationFrame(() => {
      this.flush();
    });
  }

  /**
   * 清空队列
   */
  private flush(): void {
    const tasks = this.queue.splice(0, this.queue.length);

    // 使用微任务分批执行，避免阻塞主线程
    const executeBatch = (index: number) => {
      if (index >= tasks.length) {
        this.isRunning = false;
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

      // 使用 setTimeout 让出主线程
      setTimeout(() => executeBatch(index + 10), 0);
    };

    executeBatch(0);
  }

  /**
   * 清空队列
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
   * 获取队列长度
   */
  get length(): number {
    return this.queue.length;
  }
}

// 全局任务队列实例
export const globalTaskQueue = new TaskQueue();

/**
 * 批量更新管理器
 * 优化大量字段同时更新的性能
 */
export class BatchUpdateManager {
  private updates: Map<string, unknown> = new Map();
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private delay: number;
  private onBatchUpdate: (updates: Map<string, unknown>) => void;

  constructor(onBatchUpdate: (updates: Map<string, unknown>) => void, delay = 16) {
    this.onBatchUpdate = onBatchUpdate;
    this.delay = delay;
  }

  /**
   * 添加更新
   */
  add(name: string, value: unknown): void {
    this.updates.set(name, value);
    this.schedule();
  }

  /**
   * 批量添加更新
   */
  addBatch(updates: Record<string, unknown>): void {
    Object.entries(updates).forEach(([name, value]) => {
      this.updates.set(name, value);
    });
    this.schedule();
  }

  /**
   * 调度批量更新
   */
  private schedule(): void {
    if (this.timeoutId) {
      return;
    }

    this.timeoutId = setTimeout(() => {
      this.flush();
    }, this.delay);
  }

  /**
   * 立即执行更新
   */
  flush(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    if (this.updates.size > 0) {
      const updates = new Map(this.updates);
      this.updates.clear();
      this.onBatchUpdate(updates);
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.updates.clear();
  }

  /**
   * 获取待更新数量
   */
  get pendingCount(): number {
    return this.updates.size;
  }
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number,
  immediate = false,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: unknown, ...args: Parameters<T>) {
    const callNow = immediate && !timeoutId;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (!immediate) {
        fn.apply(this, args);
      }
    }, delay);

    if (callNow) {
      fn.apply(this, args);
    }
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function (this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * 记忆化函数
 */
export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string,
): T {
  const cache = new Map<string, ReturnType<T>>();

  return function (this: unknown, ...args: Parameters<T>): ReturnType<T> {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn.apply(this, args) as ReturnType<T>;
    cache.set(key, result);
    return result;
  } as T;
}

/**
 * LRU 缓存
 */
export class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;

  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  /**
   * 获取缓存值
   */
  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // 移动到末尾（最近使用）
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  /**
   * 设置缓存值
   */
  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // 删除最久未使用的
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  /**
   * 删除缓存
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 检查是否存在
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }

  /**
   * 获取缓存大小
   */
  get size(): number {
    return this.cache.size;
  }
}

/**
 * 性能监控器
 */
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();
  private measures: Map<string, number[]> = new Map();
  private enabled: boolean;

  constructor(enabled = true) {
    this.enabled = enabled;
  }

  /**
   * 开始标记
   */
  mark(name: string): void {
    if (!this.enabled) {
      return;
    }
    this.marks.set(name, performance.now());
  }

  /**
   * 结束标记并测量
   */
  measure(name: string, startMark?: string): number | null {
    if (!this.enabled) {
      return null;
    }

    const endTime = performance.now();
    const startTime = startMark ? this.marks.get(startMark) : this.marks.get(name);

    if (startTime === undefined) {
      console.warn(`Mark "${startMark || name}" not found`);
      return null;
    }

    const duration = endTime - startTime;

    if (!this.measures.has(name)) {
      this.measures.set(name, []);
    }
    this.measures.get(name)!.push(duration);

    // 保留最近的 100 条记录
    const records = this.measures.get(name)!;
    if (records.length > 100) {
      records.shift();
    }

    return duration;
  }

  /**
   * 获取测量统计
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
   * 打印所有统计
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
   * 清空记录
   */
  clear(): void {
    this.marks.clear();
    this.measures.clear();
  }

  /**
   * 设置启用状态
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

// 全局性能监控器实例
export const performanceMonitor = new PerformanceMonitor(process.env.NODE_ENV === 'development');

/**
 * 使用 requestIdleCallback 执行低优先级任务
 */
export function scheduleIdleTask(task: () => void, timeout?: number): void {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(task, { timeout });
  } else {
    // 降级使用 setTimeout
    setTimeout(task, 1);
  }
}

/**
 * 分片执行任务
 */
export function scheduleChunkedTask<T>(
  items: T[],
  task: (item: T) => void,
  chunkSize = 10,
  onComplete?: () => void,
): void {
  let index = 0;

  const processChunk = () => {
    const chunk = items.slice(index, index + chunkSize);
    chunk.forEach(task);
    index += chunkSize;

    if (index < items.length) {
      scheduleIdleTask(processChunk);
    } else {
      onComplete?.();
    }
  };

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
