import { describe, it, expect } from 'vitest';
import { isVideo } from '@lania-pro-components/utils';

describe('ProUpload/utils / isVideo', () => {
  it('识别常见视频扩展名（小写）', () => {
    expect(isVideo('movie.mp4')).toBe(true);
    expect(isVideo('clip.mov')).toBe(true);
    expect(isVideo('film.avi')).toBe(true);
    expect(isVideo('video.webm')).toBe(true);
    expect(isVideo('clip.mkv')).toBe(true);
    expect(isVideo('film.mpeg')).toBe(true);
    expect(isVideo('clip.m4v')).toBe(true);
  });

  it('大写扩展名也识别（内部转小写）', () => {
    expect(isVideo('MOVIE.MP4')).toBe(true);
    expect(isVideo('Clip.MOV')).toBe(true);
  });

  it('混合大小写扩展名识别', () => {
    expect(isVideo('clip.Mp4')).toBe(true);
    expect(isVideo('video.WebM')).toBe(true);
  });

  it('非视频文件返回 false', () => {
    expect(isVideo('image.png')).toBe(false);
    expect(isVideo('doc.pdf')).toBe(false);
    expect(isVideo('music.mp3')).toBe(false);
    expect(isVideo('archive.zip')).toBe(false);
  });

  it('空字符串返回 false', () => {
    expect(isVideo('')).toBe(false);
  });

  it('无扩展名返回 false', () => {
    expect(isVideo('filename')).toBe(false);
  });

  it('视频扩展名作为文件名一部分时不误判（需要点号分隔）', () => {
    // "mp4" 出现在文件名中但不是扩展名
    expect(isVideo('mp4_backup')).toBe(false);
    expect(isVideo('mymp4file.txt')).toBe(false);
  });

  it('路径中带目录的视频文件识别', () => {
    expect(isVideo('/path/to/video.mp4')).toBe(true);
    expect(isVideo('C:\\videos\\movie.avi')).toBe(true);
  });
});
