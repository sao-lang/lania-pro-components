/**
 * 文件类型判断工具
 *
 * 提供基于文件扩展名的类型判断函数。
 * 当前主要支持视频文件类型的识别，后续可扩展图片、文档等其他类型。
 */

/**
 * 常见视频文件扩展名列表
 * 涵盖主流视频格式：
 * - MP4 / M4V: Apple 系通用视频格式
 * - MOV: Apple QuickTime 格式
 * - AVI: Windows 系传统视频格式
 * - WMV: Windows Media 视频格式
 * - FLV: Flash 视频格式
 * - WebM: 现代 Web 视频格式（HTML5 推荐）
 * - MKV: Matroska 多媒体容器格式
 * - MPEG / MPG: MPEG 压缩标准格式
 */
const VIDEO_EXTENSIONS = ['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm', 'mkv', 'mpeg', 'mpg', 'm4v'];

/**
 * 判断给定的文件名是否属于视频文件
 *
 * 基于文件扩展名（不区分大小写）进行判断，不做 MIME 类型检测。
 * 适用于前端上传预览、文件列表显示等场景。
 *
 * @param filename - 文件名或文件路径字符串（如 'video.mp4' 或 '/path/to/video.MOV'）
 * @returns boolean - true 表示是视频文件，false 表示不是或文件名为空
 *
 * @example
 * ```ts
 * isVideo('movie.mp4');  // true
 * isVideo('movie.MOV');  // true（不区分大小写）
 * isVideo('image.jpg');  // false
 * isVideo('');           // false（空字符串）
 * ```
 */
export const isVideo = (filename: string): boolean => {
  // 空文件名直接返回 false
  if (!filename) return false;

  // 提取扩展名：按 '.' 分割取最后一段，并转为小写
  const ext = filename.split('.').pop()?.toLowerCase();

  // 检查扩展名是否在视频扩展名列表中
  return VIDEO_EXTENSIONS.includes(ext || '');
};
