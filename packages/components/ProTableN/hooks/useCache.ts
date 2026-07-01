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
 */
interface CacheEntry<T> {
  /** 缓存数据 */
  data: T;
  /** 缓存时间戳 */
  timestamp: number;
  /** 访问次数 */
  accessCount: number;
}

/**
 * 缓存存储
 */
class CacheStorage<T = any> {
  private cache: Map<string, CacheEntry<T>>;
  private maxAge: number;
  private maxSize: number;

  constructor(config: CacheConfig = {}) {
    this.cache = new Map();
    this.maxAge = config.maxAge ?? 5 * 60 * 1000; // 默认 5 分钟
    this.maxSize = config.maxSize ?? 50; // 默认 50 条
  }

  /**
   * 生成缓存 key
   */
  private generateKey(params: Record<string, unknown> | string): string {
    return typeof params === 'string' ? params : JSON.stringify(params);
  }

  /**
   * 检查缓存是否过期
   */
  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > this.maxAge;
  }

  /**
   * 清理过期缓存
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
   * 清理最久未使用的缓存
   */
  private evictLRU(): void {
    if (this.cache.size < this.maxSize) {
      return;
    }

    let oldestKey: string | null = null;
    let oldestAccessCount = Infinity;
    let oldestTimestamp = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      // 优先清理访问次数少的，其次清理时间早的
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
   */
  get(params: Record<string, unknown> | string): T | null {
    const key = this.generateKey(params);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // 检查是否过期
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }

    // 更新访问次数
    entry.accessCount++;
    this.cache.set(key, entry);

    return entry.data;
  }

  /**
   * 设置缓存
   */
  set(params: Record<string, unknown> | string, data: T): void {
    // 清理过期缓存
    this.cleanup();

    // 如果缓存已满，清理最久未使用的
    this.evictLRU();

    const key = this.generateKey(params);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      accessCount: 1,
    });
  }

  /**
   * 删除缓存
   */
  delete(params: Record<string, unknown> | string): boolean {
    const key = this.generateKey(params);
    return this.cache.delete(key);
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * 检查是否有缓存
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

  /**
   * 获取所有缓存 key
   */
  keys(): string[] {
    this.cleanup();
    return Array.from(this.cache.keys());
  }
}

/**
 * 缓存 Hook 返回类型
 */
export interface UseCacheReturn<T = any> {
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
 * 用于缓存表格请求数据，减少重复请求
 *
 * @example
 * ```tsx
 * const { getCache, setCache, clearCache } = useCache({
 *   maxAge: 5 * 60 * 1000, // 5 分钟
 *   maxSize: 50,
 * });
 *
 * // 获取数据时先检查缓存
 * const cached = getCache(params);
 * if (cached) {
 *   return cached;
 * }
 *
 * // 请求数据后存入缓存
 * const data = await fetchData(params);
 * setCache(params, data);
 * ```
 */
export function useCache<T = any>(config?: CacheConfig): UseCacheReturn<T> {
  // 使用 ref 保持缓存实例的稳定性
  const cacheRef = useRef<CacheStorage<T>>(new CacheStorage<T>(config));

  // 获取缓存
  const getCache = useCallback(
    (params: Record<string, unknown> | string): T | null => cacheRef.current.get(params),
    [],
  );

  // 设置缓存
  const setCache = useCallback((params: Record<string, unknown> | string, data: T): void => {
    cacheRef.current.set(params, data);
  }, []);

  // 删除缓存
  const deleteCache = useCallback(
    (params: Record<string, unknown> | string): boolean => cacheRef.current.delete(params),
    [],
  );

  // 清空缓存
  const clearCache = useCallback((): void => {
    cacheRef.current.clear();
  }, []);

  // 检查是否有缓存
  const hasCache = useCallback((params: Record<string, unknown> | string): boolean => cacheRef.current.has(params), []);

  // 获取缓存大小
  const getCacheSize = useCallback((): number => cacheRef.current.size(), []);

  // 组件卸载时清理缓存
  useEffect(
    () => () => {
      // 可选：组件卸载时清空缓存
      // cacheRef.current.clear();
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

/**
 * 创建全局缓存实例
 */
const globalCacheMap = new Map<string, CacheStorage<any>>();

/**
 * 获取或创建全局缓存实例
 */
export function getGlobalCache<T = any>(key: string, config?: CacheConfig): CacheStorage<T> {
  if (!globalCacheMap.has(key)) {
    globalCacheMap.set(key, new CacheStorage<T>(config));
  }
  return globalCacheMap.get(key)!;
}

/**
 * 删除全局缓存实例
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
 * 清空所有全局缓存
 */
export function clearAllGlobalCaches(): void {
  for (const cache of globalCacheMap.values()) {
    cache.clear();
  }
  globalCacheMap.clear();
}

export default useCache;
