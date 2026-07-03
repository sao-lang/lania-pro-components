/**
 * @lania-pro-components/shared
 *
 * 通用异步数据请求类型
 *
 * 供 useAsyncRequest 及相关组件使用。
 */

/**
 * 异步数据配置
 */
export interface AsyncDataConfig<TParams = Record<string, unknown>, TResponse = unknown> {
  /** 请求函数 */
  request?: (params: TParams) => Promise<TResponse>;
  /** 是否手动触发（默认 false，即自动请求） */
  manual?: boolean;
  /** 防抖时间（毫秒） */
  debounceTime?: number;
  /** 轮询间隔（毫秒），不设置则不轮询 */
  pollingInterval?: number;
  /** 缓存时间（毫秒） */
  cacheTime?: number;
  /** 是否启用重试 */
  retry?: boolean | number;
  /** 请求成功回调 */
  onSuccess?: (data: TResponse, params: TParams) => void;
  /** 请求失败回调 */
  onError?: (error: Error, params: TParams) => void;
}
