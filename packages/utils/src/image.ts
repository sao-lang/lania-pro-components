/**
 * 图片处理工具模块
 *
 * 提供前端图片处理的纯工具函数，不依赖任何 UI 框架。
 * 当前主要支持图片压缩功能。
 */

/**
 * 压缩图片
 *
 * 使用 Canvas API 在浏览器端对图片进行压缩。
 * 支持指定最大宽高、压缩质量和输出格式。
 * 适用于上传前压缩以减少网络传输体积。
 *
 * @param file - 待压缩的图片文件（File 对象）
 * @param config - 压缩配置
 * @param config.maxWidth - 压缩后的最大宽度（px），图片超过此值会等比缩放
 * @param config.maxHeight - 压缩后的最大高度（px），图片超过此值会等比缩放
 * @param config.quality - 压缩质量（0~1），默认 0.8
 * @param config.type - 输出图片格式，默认 'image/jpeg'
 * @returns Promise<Blob> - 压缩后的图片 Blob 对象
 *
 * @example
 * ```ts
 * const compressed = await compressImage(file, { maxWidth: 1920, quality: 0.7 });
 * // 上传压缩后的文件
 * const compressedFile = new File([compressed], file.name, { type: compressed.type });
 * ```
 */
export const compressImage = (
  file: File,
  config: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    type?: string;
  },
): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const img = document.createElement('img');
    img.onload = () => {
      let { width, height } = img;
      const { maxWidth, maxHeight, quality = 0.8, type = 'image/jpeg' } = config;

      if (maxWidth && width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (maxHeight && height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Compression failed'));
          }
        },
        type,
        quality,
      );
    };
    img.onerror = () => reject(new Error('Image load error'));
    img.src = URL.createObjectURL(file);
  });