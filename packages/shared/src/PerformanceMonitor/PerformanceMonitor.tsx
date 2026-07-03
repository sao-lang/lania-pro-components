/**
 * @lania-pro-components/shared
 *
 * PerformanceMonitor 性能监控组件
 *
 * 通用的性能监控浮窗组件，用于开发环境监控组件性能。
 * 从 ProForm/components/FormPerformanceMonitor 演化而来，参数化了两处硬编码。
 *
 * 设计原则：组合优于配置。
 * - 监控 UI 完全由使用方控制：可以放任意位置、定制刷新间隔、同时监控多个组件
 * - 组件仅负责打点（mark/measure），监控 UI 由使用方组合接入
 * - 这是一个"展示型"组件，只负责渲染性能数据，不耦合任何业务逻辑
 *
 * @example
 * ```tsx
 * import { PerformanceMonitor } from '@lania-pro-components/shared';
 * import { ProForm } from '@lania-pro-components/components';
 *
 * function App() {
 *   const formRef = useRef<ProFormInstance>(null);
 *   return (
 *     <>
 *       <ProForm ref={formRef} schema={schema} />
 *       <PerformanceMonitor
 *         measures={['form-render']}
 *         extraStats={() => formRef.current?.getStats() ?? {}}
 *         title='ProForm'
 *       />
 *     </>
 *   );
 * }
 * ```
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { performanceMonitor } from '@lania-pro-components/utils';
import type { PerformanceMonitorProps } from './types';

interface PerformanceData {
  fieldCount: number;
  renderCount: number;
  updateTime: number;
  memoryUsage: number;
  fps: number;
  extraStats: Record<string, string | number>;
}

/**
 * PerformanceMonitor 组件
 *
 * 性能监控浮窗，显示 FPS、渲染耗时、内存使用等信息。
 * 仅在开发环境下可见，点击可展开/折叠详细信息。
 */
export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  enabled = process.env.NODE_ENV === 'development',
  position = 'bottom-right',
  refreshInterval = 1000,
  measures,
  extraStats,
  title = 'Performance',
}) => {
  const [data, setData] = useState<PerformanceData>({
    fieldCount: 0,
    renderCount: 0,
    updateTime: 0,
    memoryUsage: 0,
    fps: 60,
    extraStats: {},
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const rafRef = useRef<number | null>(null);

  // 计算 FPS
  const calculateFPS = useCallback(() => {
    const now = performance.now();
    const delta = now - lastTimeRef.current;

    if (delta >= 1000) {
      const fps = Math.round((frameCountRef.current * 1000) / delta);
      frameCountRef.current = 0;
      lastTimeRef.current = now;
      return fps;
    }

    frameCountRef.current++;
    return data.fps;
  }, [data.fps]);

  // 收集性能数据
  const collectData = useCallback(() => {
    if (!enabled) return;

    const fps = calculateFPS();

    // 获取内存使用情况
    const { memory } = performance as unknown as {
      memory?: { usedJSHeapSize: number };
    };
    const memoryUsage = memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : 0;

    // 获取字段数量
    const fieldCount = document.querySelectorAll('[data-field-name]').length;

    // 获取渲染统计（如果指定了 measures，则聚合多个 measure）
    let totalRenderCount = 0;
    let totalUpdateTime = 0;
    let measureCount = 0;

    const targetMeasures = measures?.length ? measures : undefined;
    if (targetMeasures) {
      targetMeasures.forEach((name) => {
        const stats = performanceMonitor.getStats(name);
        if (stats) {
          totalRenderCount += stats.count;
          totalUpdateTime += stats.avg;
          measureCount++;
        }
      });
    } else {
      // 默认获取 'form-render' 的统计
      const renderStats = performanceMonitor.getStats('form-render');
      if (renderStats) {
        totalRenderCount = renderStats.count;
        totalUpdateTime = renderStats.avg;
      }
    }

    const avgUpdateTime = measureCount > 0 ? totalUpdateTime / measureCount : totalUpdateTime;

    // 获取自定义指标
    const userExtraStats = extraStats?.() ?? {};

    setData({
      fieldCount,
      renderCount: totalRenderCount,
      updateTime: avgUpdateTime,
      memoryUsage,
      fps,
      extraStats: userExtraStats,
    });
  }, [enabled, calculateFPS, measures, extraStats]);

  // 使用 requestAnimationFrame 持续计算 FPS
  useEffect(() => {
    if (!enabled) return;

    const loop = () => {
      calculateFPS();
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [enabled, calculateFPS]);

  // 定时收集数据
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(collectData, refreshInterval);
    return () => clearInterval(interval);
  }, [enabled, refreshInterval, collectData]);

  if (!enabled) return null;

  // 位置样式
  const positionStyles = {
    'top-left': { top: 10, left: 10 },
    'top-right': { top: 10, right: 10 },
    'bottom-left': { bottom: 10, left: 10 },
    'bottom-right': { bottom: 10, right: 10 },
  };

  // 根据 FPS 判断性能状态
  const getFPSColor = (fps: number) => {
    if (fps >= 50) return '#00b42a';
    if (fps >= 30) return '#ff7d00';
    return '#f53f3f';
  };

  return (
    <div
      style={{
        position: 'fixed',
        ...positionStyles[position],
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.8)',
        color: '#fff',
        padding: isExpanded ? '16px' : '12px',
        borderRadius: '8px',
        fontSize: '12px',
        fontFamily: 'monospace',
        minWidth: isExpanded ? '220px' : 'auto',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        cursor: 'pointer',
        userSelect: 'none',
      }}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* 标题行 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ opacity: 0.7, fontSize: '11px' }}>{title}</span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            color: getFPSColor(data.fps),
            fontWeight: 'bold',
          }}
        >
          <span style={{ fontSize: '14px' }}>●</span>
          {data.fps} FPS
        </span>
        <span>{data.fieldCount} fields</span>
        {!isExpanded && <span style={{ opacity: 0.5 }}>▼</span>}
      </div>

      {/* 详细信息 */}
      {isExpanded && (
        <div
          style={{
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          <div style={{ display: 'grid', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ opacity: 0.7 }}>Render Count:</span>
              <span>{data.renderCount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ opacity: 0.7 }}>Avg Update Time:</span>
              <span>{data.updateTime.toFixed(2)}ms</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ opacity: 0.7 }}>Memory Usage:</span>
              <span>{data.memoryUsage}MB</span>
            </div>
            {Object.entries(data.extraStats).map(([key, value]) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ opacity: 0.7 }}>{key}:</span>
                <span>{value}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '12px', fontSize: '11px', opacity: 0.5 }}>
            Click to {isExpanded ? 'collapse' : 'expand'}
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor;
