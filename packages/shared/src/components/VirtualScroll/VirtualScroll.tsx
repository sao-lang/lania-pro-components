/**
 * @lania-pro-components/shared
 *
 * VirtualScroll 虚拟滚动组件
 *
 * 基于 useVirtualScroll / useDynamicVirtualScroll Hook 封装，
 * 提供开箱即用的虚拟滚动能力，支持固定高度和动态高度两种模式。
 *
 * 功能特性：
 * - 固定高度模式（itemHeight）：计算简单，性能好
 * - 动态高度模式（estimateHeight/getItemHeight）：支持高度不固定的列表项
 * - scrollToBottom 触底回调，适用于无限滚动加载
 * - 加载指示器与空态展示
 * - 完整的 TypeScript 类型推导
 *
 * @example
 * ```tsx
 * // 固定高度模式
 * <VirtualScroll
 *   items={list}
 *   itemHeight={50}
 *   containerHeight={400}
 *   onScrollToBottom={() => loadMore()}
 *   loading={loading}
 * >
 *   {(item, index) => <div key={index}>{item.name}</div>}
 * </VirtualScroll>
 *
 * // 动态高度模式
 * <VirtualScroll
 *   items={list}
 *   estimateHeight={60}
 *   getItemHeight={(item) => item.type === 'title' ? 80 : 50}
 *   containerHeight={400}
 * >
 *   {(item, index) => <div key={index}>{item.content}</div>}
 * </VirtualScroll>
 * ```
 */
import React, { useCallback, useMemo, useRef, useEffect, useImperativeHandle } from 'react';
import { useVirtualScroll, useDynamicVirtualScroll } from '../../hooks/useVirtualScroll';
import type { VirtualScrollState } from '../../hooks/useVirtualScroll';
import type { VirtualScrollProps, VirtualScrollHandle } from './types';

function VirtualScrollInner<T = unknown>(props: VirtualScrollProps<T>, ref: React.ForwardedRef<VirtualScrollHandle>) {
  const {
    items,
    itemHeight,
    estimateHeight = 50,
    getItemHeight: customGetItemHeight,
    overscan,
    containerHeight,
    enabled,
    onVisibleStateChange,
    onScrollToBottom,
    scrollToBottomThreshold = 50,
    loading = false,
    loadingComponent,
    emptyComponent,
    children: renderItem,
    rowKey,
    className,
    style,
    containerClassName,
    containerStyle,
    itemClassName,
    itemStyle,
  } = props;

  // 判断使用固定高度还是动态高度模式
  const isFixedHeight = typeof itemHeight === 'number' && itemHeight > 0;

  // 固定高度模式
  const fixedScroll = useVirtualScroll<T>(items, {
    enabled,
    itemHeight: itemHeight ?? estimateHeight,
    overscan,
    containerHeight,
  });

  // 动态高度模式
  const dynamicScroll = useDynamicVirtualScroll<T>(items, {
    enabled: enabled ?? true,
    estimateHeight,
    getItemHeight: (customGetItemHeight ?? ((_item, _index) => estimateHeight)) as (
      item: unknown,
      index: number,
    ) => number,
    overscan,
    containerHeight,
  });

  // 统一暴露的滚动控制接口
  const { containerRef, state, onScroll, scrollToBottom, scrollToIndex, scrollToTop } = isFixedHeight
    ? fixedScroll
    : dynamicScroll;

  // 暴露滚动控制方法给父组件 ref
  useImperativeHandle(
    ref,
    () => ({
      scrollToIndex,
      scrollToTop,
      scrollToBottom,
    }),
    [scrollToIndex, scrollToTop, scrollToBottom],
  );

  // 记录是否已触发触底，防止同一位置重复触发
  const triggeredRef = useRef(false);

  /**
   * 触底检测：当可视区域底部距内容底部小于阈值时触发 onScrollToBottom
   */
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      onScroll(e);

      if (!onScrollToBottom) return;

      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      const distanceToBottom = scrollHeight - scrollTop - clientHeight;

      if (distanceToBottom <= scrollToBottomThreshold && !triggeredRef.current) {
        triggeredRef.current = true;
        onScrollToBottom();
      } else if (distanceToBottom > scrollToBottomThreshold) {
        triggeredRef.current = false;
      }
    },
    [onScroll, onScrollToBottom, scrollToBottomThreshold],
  );

  // items 变化时重置触底标记
  useEffect(() => {
    triggeredRef.current = false;
  }, [items]);

  // 状态变更回调：通知父组件当前可见范围
  useEffect(() => {
    onVisibleStateChange?.(state);
  }, [state, onVisibleStateChange]);

  // 动态高度模式下需要暴露 measureItem
  const measureItem = !isFixedHeight
    ? (dynamicScroll as ReturnType<typeof useDynamicVirtualScroll<T>>).measureItem
    : undefined;

  // 提取 rowKey
  const getRowKey = useCallback(
    (item: T, index: number): string | number => {
      return rowKey ? rowKey(item, index) : index;
    },
    [rowKey],
  );

  // 判断 children 是否为函数（列表模式）还是 ReactNode（包装模式）
  const isFunctionMode = typeof renderItem === 'function';

  // 空态
  const isEmpty = items.length === 0;

  // 底部加载指示器
  const bottomLoader = useMemo(() => {
    if (!loading) return null;
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '12px 0',
          fontSize: 14,
          color: '#999',
        }}
      >
        {loadingComponent ?? '加载中...'}
      </div>
    );
  }, [loading, loadingComponent]);

  const renderContent = () => {
    if (!enabled) {
      // 未启用虚拟滚动时，函数模式渲染全量，包装模式直接渲染 children
      if (isFunctionMode) {
        return items.map((item, index) =>
          (renderItem as (item: T, index: number, state: VirtualScrollState<T>) => React.ReactNode)(item, index, state),
        );
      }
      return renderItem;
    }

    if (isFunctionMode) {
      // 函数模式：逐项渲染 visibleItems
      return state.visibleItems.map((item, i) => {
        const actualIndex = state.startIndex + i;
        const key = getRowKey(item, actualIndex);

        return (
          <div
            key={key}
            className={itemClassName}
            style={itemStyle}
            ref={(el) => {
              // 动态高度模式下测量实际高度
              if (el && measureItem && isFixedHeight === false) {
                const height = el.getBoundingClientRect().height;
                if (height > 0) {
                  measureItem(actualIndex, height);
                }
              }
            }}
          >
            {(renderItem as (item: T, index: number, state: VirtualScrollState<T>) => React.ReactNode)(
              item,
              actualIndex,
              state,
            )}
          </div>
        );
      });
    }

    // 包装模式：直接渲染 children，父级自行控制渲染内容
    return renderItem;
  };

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        ...style,
      }}
    >
      {isEmpty && emptyComponent ? (
        emptyComponent
      ) : (
        <div
          ref={containerRef as React.RefObject<HTMLDivElement>}
          className={containerClassName}
          onScroll={handleScroll}
          style={{
            height: containerHeight ?? '100%',
            overflow: 'auto',
            ...containerStyle,
          }}
        >
          <div style={{ height: state.totalHeight, position: 'relative' }}>
            <div
              style={{
                transform: `translateY(${state.offsetY}px)`,
              }}
            >
              {renderContent()}
            </div>
          </div>
          {bottomLoader}
        </div>
      )}
    </div>
  );
}

const VirtualScroll = React.forwardRef(VirtualScrollInner) as <T>(
  props: VirtualScrollProps<T> & { ref?: React.ForwardedRef<VirtualScrollHandle> },
) => React.ReactElement;

export { VirtualScroll };
export default VirtualScroll;
