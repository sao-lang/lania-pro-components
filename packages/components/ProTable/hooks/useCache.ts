/**
 * 数据缓存 Hook（useCache）
 *
 * 为 ProTable 提供基于内存的请求结果缓存：
 * - 支持最大存活时间（maxAge）过期策略
 * - 支持最大条目数（maxSize）淘汰策略（使用 LFU + LRU 混合策略）
 * - 支持全局缓存共享（getGlobalCache / setGlobalCache）
 * - 支持手动清除（clearCache）
 *
 * 适用于短时间内多次请求相同数据的场景，
 * 例如：切换 Tab 后重新进入、多次查询相同条件等。
 */
import { useRef, useCallback, useEffect } from 'react';

/**
 * 缓存配置
 */
export interface CacheConfig {
  /** 缓存最大存活时间（毫秒），默认 5 分钟 */
  maxAge?: number;
  /** 缓存最大条目数，默认 50 */
  maxSize?: number;
}

/**
 * 缓存条目
 *
 * 每条缓存记录除数据本身外，还包含：
 * - timestamp: 创建时间戳（用于过期判断）
 * - accessCount: 访问次数（用于 LFU 淘汰策略）
 */
interface CacheEntry<T> {
  /** 缓存数据 */
  data: T;
  /** 缓存创建时间戳，用于到期清理 */
  timestamp: number;
  /** 访问次数，用于 LFU（最不经常使用）淘汰策略 */
  accessCount: number;
}

/**
 * 缓存存储类
 *
 * 基于 Map 实现的内存缓存，支持：
 * - TTL 过期（maxAge）
 * - LFU + LRU 混合淘汰
 *   - 优先淘汰访问次数最少的（LFU）
 *   - 访问次数相同时淘汰最久未访问的（LRU）
 */
class CacheStorage<T = Record<string, unknown>> {
  /** 缓存 Map：key → CacheEntry */
  private cache: Map<string, CacheEntry<T>>;
  /** 存活时间（毫秒），超过此时间的缓存被视为过期 */
  private maxAge: number;
  /** 最大条目数，超过此数量触发淘汰 */
  private maxSize: number;

  constructor(config: CacheConfig = {}) {
    this.cache = new Map();
    this.maxAge = config.maxAge ?? 5 * 60 * 1000; // 默认 5 分钟
    this.maxSize = config.maxSize ?? 50; // 默认 50 条
  }

  /**
   * 生成统一的缓存键
   * 支持字符串键（直接使用）和对象键（JSON 序列化）
   */
  private generateKey(params: Record<string, unknown> | string): string {
    return typeof params === 'string' ? params : JSON.stringify(params);
  }

  /**
   * 判断缓存条目是否已过期
   * 使用当前时间与创建时间之差 > maxAge 来判断
   */
  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > this.maxAge;
  }

  /**
   * 清理所有过期的缓存条目
   * 遍历整个缓存 Map，删除已过期的条目
   * 每次 set 操作前调用，确保缓存空间不被过期数据占用
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.maxAge) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * ⭐ LFU + LRU 混合淘汰策略
   *
   * 当缓存达到 maxSize 时，淘汰最"不值得保留"的条目：
   * 1. 优先淘汰访问次数最少的（Least Frequently Used - LFU）
   * 2. 访问次数相同时，淘汰创建时间最早的（Least Recently Used - LRU）
   *
   * 这种混合策略比纯 LRU 更能抵抗突发流量导致的缓存污染
   */
  private evictLRU(): void {
    if (this.cache.size < this.maxSize) {
      return; // 未达到容量上限，不淘汰
    }

    let oldestKey: string | null = null;
    let oldestAccessCount = Infinity; // 最少访问次数
    let oldestTimestamp = Infinity; // 最早创建时间

    for (const [key, entry] of this.cache.entries()) {
      // 优先比较访问次数（LFU），其次比较时间（LRU）
      if (
        entry.accessCount < oldestAccessCount ||
        (entry.accessCount === oldestAccessCount && entry.timestamp < oldestTimestamp)
      ) {
        oldestKey = key;
        oldestAccessCount = entry.accessCount;
        oldestTimestamp = entry.timestamp;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * 获取缓存
   *
   * @param params - 缓存键（字符串或对象）
   * @returns 缓存数据，不存在或已过期返回 null
   */
  get(params: Record<string, unknown> | string): T | null {
    const key = this.generateKey(params);
    const entry = this.cache.get(key);

    if (!entry) {
      return null; // 缓存未命中
    }

    // 检查是否过期
    if (this.isExpired(entry)) {
      this.cache.delete(key); // 过期条目自动删除
      return null;
    }

    // 更新访问次数（用于 LFU 淘汰策略）
    entry.accessCount++;
    this.cache.set(key, entry);

    return entry.data;
  }

  /**
   * 设置缓存
   *
   * 写入前自动执行清理（cleanup）和淘汰（evictLRU），
   * 确保缓存空间不会无限增长。
   */
  set(params: Record<string, unknown> | string, data: T): void {
    // 先清理过期数据，腾出空间
    this.cleanup();

    // 如果缓存已满，执行淘汰
    this.evictLRU();

    const key = this.generateKey(params);
    this.cache.set(key, {
      data,
      timestamp: Date.now(), // 记录创建时间
      accessCount: 1, // 初始访问次数为 1
    });
  }

  /** 删除指定缓存 */
  delete(params: Record<string, unknown> | string): boolean {
    const key = this.generateKey(params);
    return this.cache.delete(key);
  }

  /** 清空所有缓存 */
  clear(): void {
    this.cache.clear();
  }

  /** 获取当前缓存条目数 */
  size(): number {
    return this.cache.size;
  }

  /**
   * 检查指定 key 是否有有效缓存
   * 自动处理过期条目的删除
   */
  has(params: Record<string, unknown> | string): boolean {
    const key = this.generateKey(params);
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  /** 获取所有有效缓存 key，自动清理过期条目 */
  keys(): string[] {
    this.cleanup();
    return Array.from(this.cache.keys());
  }
}

/**
 * 缓存 Hook 返回类型
 */
export interface UseCacheReturn<T = Record<string, unknown>> {
  /** 获取缓存数据 */
  getCache: (params: Record<string, unknown> | string) => T | null;
  /** 设置缓存数据 */
  setCache: (params: Record<string, unknown> | string, data: T) => void;
  /** 删除缓存 */
  deleteCache: (params: Record<string, unknown> | string) => boolean;
  /** 清空缓存 */
  clearCache: () => void;
  /** 检查是否有缓存 */
  hasCache: (params: Record<string, unknown> | string) => boolean;
  /** 获取缓存大小 */
  getCacheSize: () => number;
  /** 缓存实例 */
  cacheInstance: CacheStorage<T>;
}

/**
 * 缓存 Hook
 *
 * 用于缓存表格请求数据，减少重复请求。
 * 通过 useRef 保持 CacheStorage 实例在组件的整个生命周期内稳定存在。
 *
 * @example
 * ```tsx
 * const { getCache, setCache, clearCache } = useCache({
 *   maxAge: 5 * 60 * 1000, // 5 分钟过期
 *   maxSize: 50,            // 最多缓存 50 条
 * });
 *
 * // 获取数据时先检查缓存
 * const cached = getCache(params);
 * if (cached) return cached;
 *
 * // 请求数据后存入缓存
 * const data = await fetchData(params);
 * setCache(params, data);
 * ```
 */
export function useCache<T = Record<string, unknown>>(config?: CacheConfig): UseCacheReturn<T> {
  // 使用 ref 保持缓存实例的稳定性（组件重渲染不会重建）
  const cacheRef = useRef<CacheStorage<T>>(new CacheStorage<T>(config));

  /** 获取缓存（代理 CacheStorage.get） */
  const getCache = useCallback(
    (params: Record<string, unknown> | string): T | null => cacheRef.current.get(params),
    [],
  );

  /** 设置缓存（代理 CacheStorage.set） */
  const setCache = useCallback((params: Record<string, unknown> | string, data: T): void => {
    cacheRef.current.set(params, data);
  }, []);

  /** 删除缓存（代理 CacheStorage.delete） */
  const deleteCache = useCallback(
    (params: Record<string, unknown> | string): boolean => cacheRef.current.delete(params),
    [],
  );

  /** 清空所有缓存 */
  const clearCache = useCallback((): void => {
    cacheRef.current.clear();
  }, []);

  /** 检查缓存是否存在（代理 CacheStorage.has） */
  const hasCache = useCallback((params: Record<string, unknown> | string): boolean => cacheRef.current.has(params), []);

  /** 获取缓存条目数 */
  const getCacheSize = useCallback((): number => cacheRef.current.size(), []);

  // 组件卸载时（可选）执行清理
  useEffect(
    () => () => {
      // 默认不自动清空，调用方可根据需要手动 clearCache()
    },
    [],
  );

  return {
    getCache,
    setCache,
    deleteCache,
    clearCache,
    hasCache,
    getCacheSize,
    cacheInstance: cacheRef.current,
  };
}

// ===== 全局缓存管理 =====

/**
 * 全局缓存 Map
 * 用于跨组件共享缓存实例
 * key: 缓存实例标识（字符串）
 * value: CacheStorage 实例
 */
const globalCacheMap = new Map<string, CacheStorage<Record<string, unknown>>>();

/**
 * 获取或创建全局缓存实例
 *
 * 适用于需要在不同组件间共享同一缓存池的场景。
 * 例如：多个 ProTable 实例可能请求相同的数据集。
 *
 * @param key - 缓存实例的唯一标识
 * @param config - 缓存配置（仅在实例首次创建时生效）
 * @returns CacheStorage 实例
 */
export function getGlobalCache<T = Record<string, unknown>>(key: string, config?: CacheConfig): CacheStorage<T> {
  if (!globalCacheMap.has(key)) {
    globalCacheMap.set(key, new CacheStorage<Record<string, unknown>>(config));
  }
  return globalCacheMap.get(key) as CacheStorage<T>;
}

/**
 * 删除指定全局缓存实例
 * 会先清空该实例的所有缓存数据，再移除引用
 */
export function removeGlobalCache(key: string): boolean {
  const cache = globalCacheMap.get(key);
  if (cache) {
    cache.clear();
    return globalCacheMap.delete(key);
  }
  return false;
}

/**
 * 清空所有全局缓存实例
 */
export function clearAllGlobalCaches(): void {
  for (const cache of globalCacheMap.values()) {
    cache.clear();
  }
  globalCacheMap.clear();
}

export default useCache;
