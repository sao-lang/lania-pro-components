/**
 * line transformer — 折线图
 *
 * 支持多系列（seriesField）、平滑、面积
 */

import { registerChartTransformer } from './types';
import { buildAxis, buildLegend, buildTooltip, buildColorPalette } from './utils';

registerChartTransformer({
  type: 'line',
  transform(schema, _ctx) {
    const { dataSource = [], xField, yField, seriesField, series } = schema;
    if (!xField || !yField) {
      throw new Error('[ProChart] line transformer requires xField and yField');
    }

    const yFields = Array.isArray(yField) ? yField : [yField];
    const option = {
      xAxis: buildAxis(schema.xAxis, 'category'),
      yAxis: buildAxis(schema.yAxis, 'value'),
      tooltip: buildTooltip(schema.tooltip, 'axis'),
      legend: buildLegend(schema.legend, Boolean(seriesField)),
      color: buildColorPalette(schema.color),
    } as Record<string, unknown>;

    // 单系列无分组
    if (!seriesField) {
      return {
        ...option,
        xAxis: { ...(option.xAxis as Record<string, unknown>), data: dataSource.map((d) => d[xField]) },
        series: yFields.map((yf) => ({
          type: 'line',
          name: yf,
          smooth: series?.smooth,
          areaStyle: series?.area ? {} : undefined,
          data: dataSource.map((d) => d[yf]),
        })),
      };
    }

    const groups = new Map<string, Record<string, unknown>[]>();
    dataSource.forEach((d) => {
      const key = String(d[seriesField!]);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(d);
    });

    const xData = Array.from(new Set(dataSource.map((d) => String(d[xField!]))));

    return {
      ...option,
      xAxis: { ...(option.xAxis as Record<string, unknown>), data: xData },
      series: Array.from(groups.entries()).map(([name, rows]) => ({
        type: 'line',
        name,
        smooth: series?.smooth,
        areaStyle: series?.area ? {} : undefined,
        data: xData.map((x) => {
          const row = rows.find((r) => String(r[xField!]) === x);
          return row ? row[yFields[0]] : null;
        }),
      })),
    };
  },
});
