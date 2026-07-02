import React, { useEffect, useRef, useState, useCallback } from 'react';
import { performanceMonitor } from '@lania-pro-components/utils';

/**
 * 性能数据接口
 */
interface PerformanceData {
  fieldCount: number;
  renderCount: number;
  updateTime: number;
  memoryUsage: number;
  fps: number;
}

/**
 * 表单性能监控组件属性
 */
interface FormPerformanceMonitorProps {
  /** 是否启用 */
  enabled?: boolean;
  /** 位置 */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** 刷新间隔（毫秒） */
  refreshInterval?: number;
}

/**
 * 表单性能监控组件
 * 用于开发环境监控表单性能
 */
export const FormPerformanceMonitor: React.FC<FormPerformanceMonitorProps> = ({
  enabled = process.env.NODE_ENV === 'development',
  position = 'bottom-right',
  refreshInterval = 1000,
}) => {
  const [data, setData] = useState<PerformanceData>({
    fieldCount: 0,
    renderCount: 0,
    updateTime: 0,
    memoryUsage: 0,
    fps: 60,
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
    if (!enabled) {
      return;
    }

    // 计算 FPS
    const fps = calculateFPS();

    // 获取内存使用情况
    const { memory } = performance as unknown as {
      memory?: { usedJSHeapSize: number };
    };
    const memoryUsage = memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : 0;

    // 获取字段数量
    const fieldCount = document.querySelectorAll('[data-field-name]').length;

    // 获取渲染统计
    const renderStats = performanceMonitor.getStats('form-render');
    const renderCount = renderStats?.count || 0;
    const updateTime = renderStats?.avg || 0;

    setData({
      fieldCount,
      renderCount,
      updateTime,
      memoryUsage,
      fps,
    });
  }, [enabled, calculateFPS]);

  // 使用 requestAnimationFrame 持续计算 FPS
  useEffect(() => {
    if (!enabled) {
      return;
    }

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
    if (!enabled) {
      return;
    }

    const interval = setInterval(collectData, refreshInterval);
    return () => clearInterval(interval);
  }, [enabled, refreshInterval, collectData]);

  if (!enabled) {
    return null;
  }

  // 位置样式
  const positionStyles = {
    'top-left': { top: 10, left: 10 },
    'top-right': { top: 10, right: 10 },
    'bottom-left': { bottom: 10, left: 10 },
    'bottom-right': { bottom: 10, right: 10 },
  };

  // 根据 FPS 判断性能状态
  const getFPSColor = (fps: number) => {
    if (fps >= 50) {
      return '#00b42a';
    }
    if (fps >= 30) {
      return '#ff7d00';
    }
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
        minWidth: isExpanded ? '200px' : 'auto',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        cursor: 'pointer',
        userSelect: 'none',
      }}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* 简略信息 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
          </div>

          <div style={{ marginTop: '12px', fontSize: '11px', opacity: 0.5 }}>
            Click to {isExpanded ? 'collapse' : 'expand'}
          </div>
        </div>
      )}
    </div>
  );
};

export default FormPerformanceMonitor;
