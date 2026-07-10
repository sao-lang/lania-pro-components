/**
 * @lania-pro-components/shared
 *
 * 响应式适配 Hook（useResponsive）
 *
 * 通过 window.matchMedia 监听视口尺寸变化，提供响应式断点检测：
 * - 预定义断点：xs(576) / sm(576) / md(768) / lg(992) / xl(1200) / xxl(1600)
 * - 根据当前断点自动决定列数
 * - 支持自定义断点配置
 * - 独立于任何业务组件，纯通用响应式抽象
 *
 * 迁移自 ProTable/hooks/useResponsive.ts
 */
import { useState, useEffect, useCallback } from 'react';

/**
 * 断点配置
 */
export interface Breakpoints {
  /** <576px */
  xs?: number;
  /** ≥576px */
  sm?: number;
  /** ≥768px */
  md?: number;
  /** ≥992px */
  lg?: number;
  /** ≥1200px */
  xl?: number;
  /** ≥1600px */
  xxl?: number;
}

/**
 * 响应式配置
 */
export interface ResponsiveConfig {
  /** 是否启用响应式 */
  enabled?: boolean;
  /** 断点配置 */
  breakpoints?: Breakpoints;
  /** 默认列数 */
  defaultColumns?: number;
}

/**
 * 当前断点
 */
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

/**
 * 响应式状态
 */
export interface ResponsiveState {
  /** 当前断点 */
  breakpoint: Breakpoint;
  /** 当前屏幕宽度 */
  width: number;
  /** 当前列数 */
  columns: number;
  /** 是否移动端 */
  isMobile: boolean;
  /** 是否平板 */
  isTablet: boolean;
  /** 是否桌面端 */
  isDesktop: boolean;
}

/**
 * 默认断点配置
 */
const defaultBreakpoints: Required<Breakpoints> = {
  xs: 576,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1600,
};

/**
 * 根据屏幕宽度计算当前断点
 *
 * @param width - 屏幕宽度（像素）
 * @param breakpoints - 自定义断点配置（与默认断点合并）
 * @returns 当前匹配的断点标识
 */
function getBreakpoint(width: number, breakpoints: Breakpoints): Breakpoint {
  const bp = { ...defaultBreakpoints, ...breakpoints };

  if (width < bp.xs) return 'xs';
  if (width < bp.md) return 'sm';
  if (width < bp.lg) return 'md';
  if (width < bp.xl) return 'lg';
  if (width < bp.xxl) return 'xl';
  return 'xxl';
}

/**
 * 根据断点计算列数
 *
 * 优先使用 config.breakpoints 中的列数配置，否则使用默认映射。
 */
function getColumnsByBreakpoint(breakpoint: Breakpoint, config?: ResponsiveConfig): number {
  if (config?.breakpoints) {
    const { xs = 1, sm = 2, md = 3, lg = 4, xl = 4, xxl = 6 } = config.breakpoints;
    const map: Record<Breakpoint, number> = { xs, sm, md, lg, xl, xxl };
    return map[breakpoint];
  }

  const defaultMap: Record<Breakpoint, number> = {
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 4,
    xxl: 6,
  };
  return defaultMap[breakpoint];
}

/**
 * 响应式 Hook 返回类型
 */
export interface UseResponsiveReturn {
  /** 响应式状态 */
  state: ResponsiveState;
  /** 获取当前断点 */
  getBreakpoint: () => Breakpoint;
  /** 检查是否匹配指定断点 */
  matchBreakpoint: (breakpoint: Breakpoint) => boolean;
  /** 检查是否大于等于指定断点 */
  gteBreakpoint: (breakpoint: Breakpoint) => boolean;
  /** 检查是否小于等于指定断点 */
  lteBreakpoint: (breakpoint: Breakpoint) => boolean;
}

/**
 * 响应式布局 Hook
 *
 * 用于监听窗口大小变化，提供响应式布局支持
 *
 * @example
 * ```tsx
 * const { state } = useResponsive({
 *   enabled: true,
 *   breakpoints: { xs: 1, sm: 2, md: 3, lg: 4 },
 * });
 *
 * return (
 *   <Grid columns={state.columns}>
 *     {data.map(item => <Grid.Item key={item.id}>{item.name}</Grid.Item>)}
 *   </Grid>
 * );
 * ```
 */
export function useResponsive(config?: ResponsiveConfig): UseResponsiveReturn {
  const enabled = config?.enabled ?? true;

  const [state, setState] = useState<ResponsiveState>(() => {
    if (typeof window === 'undefined') {
      return {
        breakpoint: 'lg',
        width: 1200,
        columns: config?.defaultColumns || 4,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
      };
    }

    const width = window.innerWidth;
    const breakpoint = getBreakpoint(width, config?.breakpoints || {});
    const columns = getColumnsByBreakpoint(breakpoint, config);

    return {
      breakpoint,
      width,
      columns,
      isMobile: breakpoint === 'xs',
      isTablet: breakpoint === 'sm' || breakpoint === 'md',
      isDesktop: breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === 'xxl',
    };
  });

  /**
   * 根据当前窗口宽度更新响应式状态
   *
   * 计算 breakpoint / columns / isMobile / isTablet / isDesktop 五项状态。
   */
  const updateState = useCallback(() => {
    if (typeof window === 'undefined') return;

    const width = window.innerWidth;
    const breakpoint = getBreakpoint(width, config?.breakpoints || {});
    const columns = getColumnsByBreakpoint(breakpoint, config);

    setState({
      breakpoint,
      width,
      columns,
      isMobile: breakpoint === 'xs',
      isTablet: breakpoint === 'sm' || breakpoint === 'md',
      isDesktop: breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === 'xxl',
    });
  }, [config]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateState, 100);
    };

    window.addEventListener('resize', handleResize);
    updateState();

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [enabled, updateState]);

  /** 获取当前断点 */
  const getCurrentBreakpoint = useCallback((): Breakpoint => state.breakpoint, [state.breakpoint]);

  /** 判断当前断点是否等于指定断点 */
  const matchBreakpoint = useCallback(
    (breakpoint: Breakpoint): boolean => state.breakpoint === breakpoint,
    [state.breakpoint],
  );

  /** 判断当前断点是否大于等于指定断点（如当前 lg，gteBreakpoint('md') 为 true） */
  const gteBreakpoint = useCallback(
    (breakpoint: Breakpoint): boolean => {
      const order: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
      return order.indexOf(state.breakpoint) >= order.indexOf(breakpoint);
    },
    [state.breakpoint],
  );

  /** 判断当前断点是否小于等于指定断点 */
  const lteBreakpoint = useCallback(
    (breakpoint: Breakpoint): boolean => {
      const order: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
      return order.indexOf(state.breakpoint) <= order.indexOf(breakpoint);
    },
    [state.breakpoint],
  );

  return {
    state,
    getBreakpoint: getCurrentBreakpoint,
    matchBreakpoint,
    gteBreakpoint,
    lteBreakpoint,
  };
}

/**
 * 使用响应式列数
 * 根据容器宽度自动计算列数
 *
 * @example
 * ```tsx
 * const columns = useResponsiveColumns({
 *   minColumnWidth: 200,
 *   maxColumns: 6,
 *   gap: 16,
 * });
 * ```
 */
export function useResponsiveColumns(options?: {
  /** 最小列宽 */
  minColumnWidth?: number;
  /** 最大列数 */
  maxColumns?: number;
  /** 间距 */
  gap?: number;
  /** 容器 ref */
  containerRef?: React.RefObject<HTMLElement>;
}): number {
  const { minColumnWidth = 200, maxColumns = 6, gap = 16, containerRef } = options || {};

  const [columns, setColumns] = useState(maxColumns);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    /**
     * 根据容器宽度计算列数
     *
     * 公式：可用宽度 / (最小列宽 + 间距) + 1，并限制在 [1, maxColumns] 范围内。
     */
    const calculateColumns = () => {
      const container = containerRef?.current;
      const width = container ? container.clientWidth : window.innerWidth;
      const availableWidth = width - gap * (maxColumns - 1);
      const calculatedColumns = Math.floor(availableWidth / (minColumnWidth + gap)) + 1;
      setColumns(Math.max(1, Math.min(calculatedColumns, maxColumns)));
    };

    calculateColumns();

    // 100ms 防抖，避免 resize 频繁触发
    let timeoutId: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(calculateColumns, 100);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [minColumnWidth, maxColumns, gap, containerRef]);

  return columns;
}
