import type { UserInfoData } from './types';

const VIDEO_EXTENSIONS = ['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm', 'mkv', 'mpeg', 'mpg', 'm4v'];

export const isVideo = (filename: string): boolean => {
  if (!filename) return false;
  const ext = filename.split('.').pop()?.toLowerCase();
  return VIDEO_EXTENSIONS.includes(ext || '');
};

export const uploadImage = async (
  file: File,
  options: { onProgress?: (percent: number) => void },
  _userInfo?: UserInfoData,
): Promise<string> => {
  if (options.onProgress) {
    options.onProgress(0);
    const { onProgress } = options;
    setTimeout(() => onProgress(50), 100);
    setTimeout(() => onProgress(100), 200);
  }
  return URL.createObjectURL(file);
};

export const uploadVideo = async (
  file: File,
  options: { onProgress?: (percent: number) => void },
  _userInfo?: UserInfoData,
): Promise<string> => {
  if (options.onProgress) {
    options.onProgress(0);
    const { onProgress } = options;
    setTimeout(() => onProgress(30), 100);
    setTimeout(() => onProgress(70), 200);
    setTimeout(() => onProgress(100), 300);
  }
  return URL.createObjectURL(file);
};
