/**
 * 文件类型判断
 */

const VIDEO_EXTENSIONS = ['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm', 'mkv', 'mpeg', 'mpg', 'm4v'];

/**
 * 判断文件名是否为视频文件
 */
export const isVideo = (filename: string): boolean => {
  if (!filename) return false;
  const ext = filename.split('.').pop()?.toLowerCase();
  return VIDEO_EXTENSIONS.includes(ext || '');
};
