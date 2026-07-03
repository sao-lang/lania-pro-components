/**
 * ProChart Adapter 类型定义
 *
 * ChartInstance: 图表实例的抽象接口
 * ChartAdapter: 图表适配器接口
 * ChartAdapterFactory: 适配器工厂函数（支持异步）
 */

/**
 * 图表实例的抽象接口
 * 由具体 adapter 实现，ProChart 仅依赖此接口
 */
export interface ChartInstance<TOption = unknown, TRawInstance = unknown> {
  /** 原始图表实例（escape hatch） */
  readonly raw: TRawInstance;
  /** 更新配置 */
  update(option: TOption, opts?: { notMerge?: boolean; lazyUpdate?: boolean }): void;
  /** 调整尺寸 */
  resize(opts?: { width?: number; height?: number }): void;
  /** 销毁实例 */
  destroy(): void;
  /** 导出图片（base64） */
  toDataURL(type?: 'png' | 'jpeg', bgColor?: string): string | undefined;
  /** 转为 blob URL（用于下载） */
  toBlobURL(type?: 'png' | 'jpeg'): Promise<string>;
}

/**
 * 图表适配器接口
 * 不同图表库实现此接口，完成实例生命周期管理
 */
export interface ChartAdapter<TOption = unknown, TRawInstance = unknown> {
  /** adapter 唯一标识，用于注册表查找 */
  readonly name: string;
  /** 创建实例 */
  init(container: HTMLElement, option: TOption, theme?: string): ChartInstance<TOption, TRawInstance>;
  /** 注册事件（返回取消监听函数） */
  on?(instance: ChartInstance<TOption, TRawInstance>, event: string, handler: (payload: unknown) => void): () => void;
  /** 切换主题 */
  setTheme?(instance: ChartInstance<TOption, TRawInstance>, theme: string): void;
  /** 当前主题的默认 option 模板（与用户 option 深合并） */
  getDefaultOption?(theme: string): Partial<TOption>;
}

/**
 * adapter 工厂函数（支持异步，便于动态 import）
 */
export type ChartAdapterFactory<TOption = unknown, TRawInstance = unknown> =
  ChartAdapter<TOption, TRawInstance> | (() => Promise<ChartAdapter<TOption, TRawInstance>>);
