/**
 * 自定义只读渲染器
 *
 * 作为 side-effect 自动注册 ProUpload/ProSelect 等自定义组件的只读渲染器。
 * 通过 import 此文件即完成注册。
 *
 * - ProUpload 渲染器：自动识别图片/视频/文件，提供缩略图预览和下载
 * - ProSelect 渲染器：复用 optionRenderer
 */
import React, { useState } from 'react';
import { Image, Space } from '@arco-design/web-react';
import { IconDownload, IconPlayCircle, IconEye } from '@arco-design/web-react/icon';
import type { ReadonlyRenderer } from '../types';
import { registerReadonlyRenderers, optionRenderer } from '../registry/readonlyRegistry';

const isImageUrl = (url = '') => /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(url) || url.startsWith('data:image/');
const isVideoUrl = (url = '') =>
  /\.(mp4|mov|webm|m3u8|ogg)$/i.test(url) || url.startsWith('blob:') || url.startsWith('data:video/');

const normalizeFiles = (value: unknown): { url: string; name?: string }[] => {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  return list
    .map((it: unknown) => {
      if (typeof it === 'string') {
        return { url: it, name: it.split('/').pop() || it };
      }
      if (it && typeof it === 'object' && 'url' in it) {
        const item = it as { url: string; name?: string };
        return { url: item.url, name: item.name };
      }
      return null;
    })
    .filter(Boolean) as { url: string; name?: string }[];
};

/**
 * ProUpload 只读渲染器
 */
const proUploadRenderer: ReadonlyRenderer = (value, _options, config = {}) => {
  const files = normalizeFiles(value);
  if (!files.length) {
    return <span>{(config.emptyText as string) || '--'}</span>;
  }

  const images = files.filter((f) => isImageUrl(f.url));
  const videos = files.filter((f) => isVideoUrl(f.url));
  const others = files.filter((f) => !isImageUrl(f.url) && !isVideoUrl(f.url));

  const [imgPreviewVisible, setImgPreviewVisible] = useState(false);
  const [imgPreviewSrc, setImgPreviewSrc] = useState('');
  const [videoPreviewVisible, setVideoPreviewVisible] = useState(false);
  const [videoPreviewSrc, setVideoPreviewSrc] = useState('');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {images.length > 0 && (
        <>
          <Space wrap>
            {images.map((f, idx) => (
              <div
                key={`img-${idx}`}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 4,
                  overflow: 'hidden',
                  position: 'relative',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  setImgPreviewSrc(f.url);
                  setImgPreviewVisible(true);
                }}
              >
                <img src={f.url} alt='' style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
                >
                  <IconEye style={{ color: '#fff', fontSize: 20 }} />
                </div>
              </div>
            ))}
          </Space>
          {imgPreviewVisible && (
            <Image.Preview
              src={imgPreviewSrc}
              visible={imgPreviewVisible}
              onVisibleChange={setImgPreviewVisible}
              actions={[
                {
                  key: 'download',
                  content: '下载',
                  onClick: () => {
                    const a = document.createElement('a');
                    a.href = imgPreviewSrc;
                    a.download = 'image';
                    a.click();
                  },
                },
              ]}
            />
          )}
        </>
      )}

      {videos.length > 0 && (
        <>
          <Space wrap>
            {videos.map((f, idx) => (
              <div
                key={`video-${idx}`}
                style={{
                  width: 120,
                  height: 80,
                  borderRadius: 4,
                  overflow: 'hidden',
                  position: 'relative',
                  background: '#000',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  setVideoPreviewSrc(f.url);
                  setVideoPreviewVisible(true);
                }}
              >
                <video src={f.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <IconPlayCircle
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: '#fff',
                    fontSize: 32,
                    opacity: 0.8,
                  }}
                />
              </div>
            ))}
          </Space>
          {videoPreviewVisible && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.9)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={() => setVideoPreviewVisible(false)}
            >
              <video
                src={videoPreviewSrc}
                controls
                autoPlay
                style={{ maxWidth: '90%', maxHeight: '90%' }}
                onClick={(e) => e.stopPropagation()}
              />
              <a
                href={videoPreviewSrc}
                download
                target='_blank'
                rel='noreferrer'
                style={{
                  position: 'absolute',
                  right: 20,
                  bottom: 20,
                  color: '#fff',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <IconDownload style={{ fontSize: 20 }} />
              </a>
            </div>
          )}
        </>
      )}

      {others.length > 0 && (
        <Space direction='vertical'>
          {others.map((f, idx) => (
            <a key={`file-${idx}`} href={f.url} download target='_blank' rel='noreferrer'>
              <IconDownload style={{ marginRight: 6 }} />
              {f.name || f.url}
            </a>
          ))}
        </Space>
      )}
    </div>
  );
};

// 注册自定义渲染器
registerReadonlyRenderers({
  ProUpload: proUploadRenderer,
  ProSelect: optionRenderer,
});

export {};
