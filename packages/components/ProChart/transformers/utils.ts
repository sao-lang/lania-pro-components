import type { ChartSchema } from '../ChartSchema';

export function buildAxis(
  axis: ChartSchema['xAxis'] | ChartSchema['yAxis'] | undefined,
  defaultType: string,
): Record<string, unknown> {
  const axisOption: Record<string, unknown> = { type: axis?.type ?? defaultType };

  if (axis?.label) {
    axisOption.name = axis.label;
  }

  if (axis?.formatter) {
    axisOption.axisLabel = { formatter: axis.formatter };
  }

  return axisOption;
}

export function buildLegend(
  legend: ChartSchema['legend'] | undefined,
  defaultVisible = false,
): Record<string, unknown> | undefined {
  if (!legend && !defaultVisible) return undefined;

  const legendOption: Record<string, unknown> = {
    show: legend?.show ?? defaultVisible,
  };

  const position = legend?.position ?? (defaultVisible ? 'top' : undefined);
  if (position) {
    if (position === 'left' || position === 'right') {
      legendOption.orient = 'vertical';
      legendOption[position] = 0;
    } else {
      legendOption[position] = 0;
    }
  }

  return legendOption;
}

export function buildTooltip(
  tooltip: ChartSchema['tooltip'] | undefined,
  trigger: 'axis' | 'item',
): Record<string, unknown> {
  const tooltipOption: Record<string, unknown> = { trigger };

  if (tooltip?.show === false) {
    tooltipOption.show = false;
  }

  if (tooltip?.formatter) {
    tooltipOption.formatter = tooltip.formatter;
  }

  return tooltipOption;
}

export function buildColorPalette(color: ChartSchema['color'] | undefined): string[] | undefined {
  if (!color) return undefined;
  return Array.isArray(color) ? color : Object.values(color);
}

export function resolveColorByKey(color: ChartSchema['color'] | undefined, key: string): string | undefined {
  if (!color) return undefined;
  if (Array.isArray(color)) return undefined;
  return color[key];
}
