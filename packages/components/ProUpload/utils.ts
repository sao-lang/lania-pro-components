const VIDEO_EXTENSIONS = ['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm', 'mkv', 'mpeg', 'mpg', 'm4v'];

export const isVideo = (filename: string): boolean => {
  if (!filename) return false;
  const ext = filename.split('.').pop()?.toLowerCase();
  return VIDEO_EXTENSIONS.includes(ext || '');
};

export const uploadImage = async (
  file: File,
  options: { onProgress?: (percent: number) => void },
  userInfo?: Record<string, any>,
): Promise<string> => {
  if (options.onProgress) {
    options.onProgress(0);
    setTimeout(() => options.onProgress!(50), 100);
    setTimeout(() => options.onProgress!(100), 200);
  }
  return URL.createObjectURL(file);
};

export const uploadVideo = async (
  file: File,
  options: { onProgress?: (percent: number) => void },
  userInfo?: Record<string, any>,
): Promise<string> => {
  if (options.onProgress) {
    options.onProgress(0);
    setTimeout(() => options.onProgress!(30), 100);
    setTimeout(() => options.onProgress!(70), 200);
    setTimeout(() => options.onProgress!(100), 300);
  }
  return URL.createObjectURL(file);
};
