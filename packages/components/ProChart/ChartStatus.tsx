/**
 * ChartStatus — loading / error / empty 三态渲染
 *
 * 消费 Arco Spin / Empty / Result 组件
 * 支持自定义三态渲染
 */

import React from 'react';
import { Spin, Empty, Result, Button } from '@arco-design/web-react';
import type { ReactNode } from 'react';

export interface ChartStatusProps {
  /** 加载中 */
  loading?: boolean;
  /** 错误 */
  error?: Error | null;
  /** 数据为空 */
  empty?: boolean;
  /** 子内容 */
  children: ReactNode;
  /** 自定义加载渲染 */
  renderLoading?: () => ReactNode;
  /** 自定义错误渲染 */
  renderError?: (error: Error, retry: () => void) => ReactNode;
  /** 自定义空数据渲染 */
  renderEmpty?: () => ReactNode;
  /** 重试回调 */
  onRetry?: () => void;
}

export const ChartStatus: React.FC<ChartStatusProps> = ({
  loading,
  error,
  empty,
  children,
  renderLoading,
  renderError,
  renderEmpty,
  onRetry,
}) => {
  // 加载态
  if (loading) {
    if (renderLoading) return <>{renderLoading()}</>;
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <Spin tip='加载中...' />
      </div>
    );
  }

  // 错误态
  if (error) {
    if (renderError) return <>{renderError(error, onRetry || (() => {}))}</>;
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <Result
          status='error'
          title='加载失败'
          subTitle={error.message}
          extra={onRetry ? <Button onClick={onRetry}>重试</Button> : undefined}
        />
      </div>
    );
  }

  // 空态
  if (empty) {
    if (renderEmpty) return <>{renderEmpty()}</>;
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <Empty description='暂无数据' />
      </div>
    );
  }

  return <>{children}</>;
};
