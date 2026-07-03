/**
 * 请求引擎（RequestEngine）
 *
 * @deprecated 通用请求管理能力已迁移到 @lania-pro-components/shared 的 useAsyncRequest
 * 此文件为向后兼容保留，内部实现已使用 useAsyncRequest 的相同模式（AbortController 透传）
 *
 * 新代码请优先使用：
 * ```ts
 * import { useAsyncRequest } from '@lania-pro-components/shared';
 * ```
 *
 * ProTable 专用请求逻辑（DataStore 集成、分页调整）保留在 useRequest.ts 中。
 */

import type { ProTableRequest, ProTableRequestParams, ProTableRequestResponse } from '../types';

export interface RequestEngineOptions<T = unknown> {
  request: ProTableRequest<T>;
  beforeRequest?: (params: ProTableRequestParams) => ProTableRequestParams | Promise<ProTableRequestParams>;
  afterRequest?: (
    data: T[],
    total: number,
  ) =>
    | {
        data: T[];
        total: number;
      }
    | Promise<{
        data: T[];
        total: number;
      }>;
  onRequestError?: (error: Error) => void;
  postData?: (data: T[]) => T[];
}

export interface RequestEngine<T = unknown> {
  execute: (params: ProTableRequestParams) => Promise<ProTableRequestResponse<T>>;
  cancel: () => void;
  debouncedExecute: (params: ProTableRequestParams, wait: number) => Promise<ProTableRequestResponse<T>>;
}

export class RequestEngineImpl<T = unknown> implements RequestEngine<T> {
  private abortController: AbortController | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private options: RequestEngineOptions<T>;

  constructor(options: RequestEngineOptions<T>) {
    this.options = options;
  }

  async execute(params: ProTableRequestParams): Promise<ProTableRequestResponse<T>> {
    this.cancel();

    const { request, beforeRequest, afterRequest, postData, onRequestError } = this.options;

    try {
      let finalParams = params;
      if (beforeRequest) {
        finalParams = await beforeRequest(params);
      }

      this.abortController = new AbortController();
      // 将 signal 注入 params，使 request 函数能真正中断请求（修复架构债务 #3）
      const response = await request({
        ...finalParams,
        signal: this.abortController.signal,
      } as ProTableRequestParams & { signal: AbortSignal });

      let { data, total } = response;

      if (afterRequest) {
        const result = await afterRequest(data, total);
        data = result.data;
        total = result.total;
      }

      if (postData) {
        data = postData(data);
      }

      return { data, total, success: true };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      onRequestError?.(error);
      throw error;
    }
  }

  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  debouncedExecute(params: ProTableRequestParams, wait: number): Promise<ProTableRequestResponse<T>> {
    return new Promise((resolve, reject) => {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }

      this.debounceTimer = setTimeout(async () => {
        try {
          const result = await this.execute(params);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, wait);
    });
  }
}

export function createRequestEngine<T = unknown>(options: RequestEngineOptions<T>): RequestEngine<T> {
  return new RequestEngineImpl<T>(options);
}
