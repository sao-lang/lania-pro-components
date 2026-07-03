/**
 * @lania-pro-components/shared
 *
 * renderMedia — 公共富媒体格式器（图片/链接）
 *
 * 合并自 ProTable columnRender 和 ProForm readonlyRegistry 的图片/链接渲染。
 */

import React, { useState } from 'react';
import { Image, Space, Typography } from '@arco-design/web-react';
import { IconLink } from '@arco-design/web-react/icon';

const { Text } = Typography;

export interface RenderImageOptions {
  /** 图片宽度 */
  width?: number;
  /** 图片高度 */
  height?: number;
  /** 最大预览图片数量 */
  maxCount?: number;
  /** 空值占位符 */
  emptyText?: string;
}

export interface RenderLinkOptions {
  /** 链接文本，默认取 URL */
  text?: string;
  /** 新窗口打开 */
  target?: string;
  /** 空值占位符 */
  emptyText?: string;
}

const DEFAULT_EMPTY = '--';

/**
 * 图片渲染（缩略图 + 预览）
 */
export function renderImage(value: unknown, options: RenderImageOptions = {}): React.ReactNode {
  const { width = 48, height = 48, maxCount = 5, emptyText = DEFAULT_EMPTY } = options;

  if (!value) return <>{emptyText}</>;

  const urls = (Array.isArray(value) ? value : [value]).filter(Boolean) as string[];

  if (urls.length === 0) return <>{emptyText}</>;

  const showImages = urls.slice(0, maxCount);
  const remaining = urls.length - maxCount;

  return (
    <Space>
      <Image.PreviewGroup>
        {showImages.map((url, i) => (
          <Image
            key={i}
            src={url}
            alt={`img-${i}`}
            style={{ width, height, borderRadius: 4, objectFit: 'cover' }}
            preview
          />
        ))}
      </Image.PreviewGroup>
      {remaining > 0 && <Text style={{ fontSize: 12, color: '#86909c' }}>+{remaining}</Text>}
    </Space>
  );
}

/**
 * 链接渲染
 */
export function renderLink(value: unknown, options: RenderLinkOptions = {}): React.ReactNode {
  const { text, target = '_blank', emptyText = DEFAULT_EMPTY } = options;
  if (!value) return <>{emptyText}</>;

  const url = String(value);
  return (
    <a href={url} target={target} rel='noopener noreferrer' style={{ color: '#165dff' }}>
      <IconLink style={{ marginRight: 4 }} />
      {text || url}
    </a>
  );
}
