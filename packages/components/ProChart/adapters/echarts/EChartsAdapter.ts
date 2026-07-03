/**
 * EChartsAdapter — ECharts 图表适配器
 *
 * 实现 ChartAdapter 接口，包装 echarts.init / setOption / resize / dispose / on
 * 消费方需自行引入 echarts（peer optional）
 */

import type { ChartAdapter } from '../types';
import { lightTheme, darkTheme } from './echartsTheme';

// ECharts 类型引用（不直接依赖，通过消费方动态 import）
let echarts: any = null;

/**
 * 设置 echarts 引用（消费方在注册前调用）
 */
export function setEChartsInstance(instance: any): void {
  echarts = instance;
}

/**
 * EChartsAdapter 实现
 */
export const EChartsAdapter: ChartAdapter<any, any> = {
  name: 'echarts',

  init(container, option, theme = 'light') {
    if (!echarts) {
      throw new Error('[ProChart] ECharts not initialized. Call setEChartsInstance(echarts) before using.');
    }

    const themeCfg = theme === 'dark' ? darkTheme : lightTheme;
    const raw = echarts.init(container, themeCfg);
    raw.setOption(option);

    return {
      raw,
      update: (opt, opts) =>
        raw.setOption(opt, {
          notMerge: opts?.notMerge ?? false,
          lazyUpdate: opts?.lazyUpdate ?? false,
        }),
      resize: (opts) => raw.resize(opts ?? {}),
      destroy: () => raw.dispose(),
      toDataURL: (type = 'png', bgColor) => raw.getDataURL({ type, backgroundColor: bgColor, pixelRatio: 2 }),
      toBlobURL: async (type = 'png') => {
        const dataURL = raw.getDataURL({ type, pixelRatio: 2 });
        const blob = await (await fetch(dataURL)).blob();
        return URL.createObjectURL(blob);
      },
    };
  },

  on(instance, event, handler) {
    instance.raw.on(event, handler);
    return () => instance.raw.off(event, handler);
  },

  setTheme(instance, theme) {
    const currentOption = instance.raw.getOption();
    const container = instance.raw.getDom();
    instance.raw.dispose();
    const themeCfg = theme === 'dark' ? darkTheme : lightTheme;
    const newRaw = echarts.init(container, themeCfg);
    newRaw.setOption(currentOption);
    // 替换 raw 引用
    (instance as any).raw = newRaw;
  },

  getDefaultOption(theme) {
    return {
      grid: { left: 40, right: 20, top: 40, bottom: 40, containLabel: true },
      tooltip: { trigger: 'axis' },
      legend: { top: 0 },
      color: theme === 'dark' ? darkTheme.color : lightTheme.color,
    };
  },
};
