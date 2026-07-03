/**
 * ProDialog 工具函数
 *
 * 提供弹窗组件的辅助计算函数，包括尺寸映射和按钮位置映射。
 */

/* eslint-disable @typescript-eslint/no-magic-numbers */
import type { DialogSize, FooterPosition } from './types';

/**
 * 根据弹窗尺寸类型获取对应的宽度值（像素）
 *
 * 尺寸映射关系：
 * - small:    400px（小弹窗，适合简单表单）
 * - medium:   600px（中等弹窗，默认尺寸）
 * - large:    800px（大弹窗，适合多列表单）
 * - xlarge:   1000px（超大弹窗，适合复杂表格/表单）
 * - fullscreen: 100%（全屏）
 *
 * @param size - 弹窗尺寸类型
 * @returns 宽度值（数字像素值或百分比字符串）
 */
export const getSizeWidth = (size: DialogSize): number | string => {
  switch (size) {
    case 'small':
      return 400;
    case 'medium':
      return 600;
    case 'large':
      return 800;
    case 'xlarge':
      return 1000;
    case 'fullscreen':
      return '100%';
    default:
      return 600; // 默认返回 medium 尺寸
  }
};

/**
 * 根据底部按钮位置获取对应的 CSS justify-content 值
 *
 * 位置映射关系：
 * - left:   flex-start（按钮左对齐）
 * - center: center（按钮居中）
 * - right:  flex-end（按钮右对齐，默认）
 *
 * @param position - 按钮位置类型
 * @returns CSS justify-content 属性值
 */
export const getFooterJustify = (position: FooterPosition): string => {
  switch (position) {
    case 'left':
      return 'flex-start';
    case 'center':
      return 'center';
    case 'right':
      return 'flex-end';
    default:
      return 'flex-end'; // 默认右对齐
  }
};
