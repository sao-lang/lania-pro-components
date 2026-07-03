/**
 * @lania-pro-components/shared
 *
 * 公共格式器 barrels
 *
 * 合并自 ProTable columnRender 和 ProForm readonlyRegistry，
 * 为所有组件提供统一的格式化渲染能力。
 */

export { renderText } from './renderText';
export type { RenderTextOptions } from './renderText';

export { renderNumber, renderMoney, renderPercent } from './renderNumber';
export type { RenderNumberOptions, RenderMoneyOptions, RenderPercentOptions } from './renderNumber';

export { renderDate, renderDateTime, renderTime } from './renderDate';
export type { RenderDateOptions } from './renderDate';

export { renderOption, renderSwitch } from './renderOption';
export type { OptionItem, RenderOptionOptions } from './renderOption';

export { renderImage, renderLink } from './renderMedia';
export type { RenderImageOptions, RenderLinkOptions } from './renderMedia';
