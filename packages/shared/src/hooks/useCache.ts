/**
 * @lania-pro-components/shared
 *
 * 数据缓存 Hook（useCache）
 *
 * 为 ProTable / ProSelect / ProUpload / ProForm 提供基于内存的请求结果缓存：
 * - 支持最大存活时间（maxAge）过期策略
 * - 支持最大条目数（maxSize）淘汰策略（使用 LFU + LRU 混合策略）
 * - 支持全局缓存共享（getGlobalCache / setGlobalCache）
 * - 支持手动清除（clearCache）
 * - 独立于任何业务组件，纯通用缓存抽象
 *
 * 迁移自 ProTable/hooks/useCache.ts
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
 */
export class CacheStorage<T = Record<string, unknown>> {
  private cache: Map<string, CacheEntry<T>>;
  private maxAge: number;
  private maxSize: number;

  /**
   * @param config - 缓存配置，可指定 maxAge 与 maxSize
   */
  constructor(config: CacheConfig = {}) {
    this.cache = new Map();
    this.maxAge = config.maxAge ?? 5 * 60 * 1000;
    this.maxSize = config.maxSize ?? 50;
  }

  /**
   * 生成缓存 key
   *
   * 字符串直接返回；对象则 JSON.stringify 序列化为稳定 key。
   */
  private generateKey(params: Record<string, unknown> | string): string {
    return typeof params === 'string' ? params : JSON.stringify(params);
  }

  /**
   * 判断缓存条目是否已过期
   */
  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > this.maxAge;
  }

  /**
   * 清理所有过期条目
   *
   * 遍历缓存，删除超过 maxAge 的条目。
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
   * LRU + LFU 混合淘汰
   *
   * 当缓存条目数达到 maxSize 时，淘汰「访问次数最少」的条目；
   * 访问次数相同时，淘汰「写入时间最早」的条目（LRU）。
   */
  private evictLRU(): void {
    if (this.cache.size < this.maxSize) return;

    let oldestKey: string | null = null;
    let oldestAccessCount = Infinity;
    let oldestTimestamp = Infinity;

    for (const [key, entry] of this.cache.entries()) {
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
   * 读取缓存
   *
   * @param params - 缓存 key 或参数对象
   * @returns 命中则返回数据，未命中或已过期返回 null
   */
  get(params: Record<string, unknown> | string): T | null {
    const key = this.generateKey(params);
    const entry = this.cache.get(key);

    if (!entry) return null;

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }

    // 命中后增加访问计数，用于 LFU 淘汰策略
    entry.accessCount++;
    this.cache.set(key, entry);

    return entry.data;
  }

  /**
   * 写入缓存
   *
   * 写入前先清理过期条目并执行 LRU/LFU 淘汰，保证不超过 maxSize。
   */
  set(params: Record<string, unknown> | string, data: T): void {
    this.cleanup();
    this.evictLRU();

    const key = this.generateKey(params);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      accessCount: 1,
    });
  }

  /**
   * 删除指定缓存
   *
   * @returns 是否删除成功（原本存在才返回 true）
   */
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
   * 判断是否存在有效缓存
   *
   * 会自动清理已过期条目。
   */
  has(params: Record<string, unknown> | string): boolean {
    const key = this.generateKey(params);
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  /**
   * 获取所有有效缓存 key 列表
   *
   * 返回前会先清理过期条目。
   */
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
 * 用于缓存请求数据，减少重复请求。
 *
 * @example
 * ```tsx
 * const { getCache, setCache, clearCache } = useCache({
 *   maxAge: 5 * 60 * 1000,
 *   maxSize: 50,
 * });
 *
 * const cached = getCache(params);
 * if (cached) return cached;
 *
 * const data = await fetchData(params);
 * setCache(params, data);
 * ```
 */
export function useCache<T = Record<string, unknown>>(config?: CacheConfig): UseCacheReturn<T> {
  // 使用 useRef 持有 CacheStorage 实例，避免重渲染时重建
  const cacheRef = useRef<CacheStorage<T>>(new CacheStorage<T>(config));

  /** 读取缓存数据 */
  const getCache = useCallback(
    (params: Record<string, unknown> | string): T | null => cacheRef.current.get(params),
    [],
  );

  /** 写入缓存数据 */
  const setCache = useCallback((params: Record<string, unknown> | string, data: T): void => {
    cacheRef.current.set(params, data);
  }, []);

  /** 删除指定缓存 */
  const deleteCache = useCallback(
    (params: Record<string, unknown> | string): boolean => cacheRef.current.delete(params),
    [],
  );

  /** 清空当前实例所有缓存 */
  const clearCache = useCallback((): void => {
    cacheRef.current.clear();
  }, []);

  /** 检查是否存在有效缓存 */
  const hasCache = useCallback((params: Record<string, unknown> | string): boolean => cacheRef.current.has(params), []);

  /** 获取当前缓存条目数 */
  const getCacheSize = useCallback((): number => cacheRef.current.size(), []);

  // 组件卸载时不自动清空（缓存实例由 ref 持有，会随 GC 回收）
  useEffect(
    () => () => {
      // 组件卸载时不自动清空
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
 */
const globalCacheMap = new Map<string, CacheStorage<Record<string, unknown>>>();

/**
 * 获取或创建全局缓存实例
 *
 * 适用于需要在不同组件间共享同一缓存池的场景。
 *
 * @param key - 缓存实例标识
 * @param config - 缓存配置（仅在首次创建时生效）
 */
export function getGlobalCache<T = Record<string, unknown>>(key: string, config?: CacheConfig): CacheStorage<T> {
  if (!globalCacheMap.has(key)) {
    globalCacheMap.set(key, new CacheStorage<Record<string, unknown>>(config));
  }
  return globalCacheMap.get(key) as CacheStorage<T>;
}

/**
 * 删除指定全局缓存实例
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
