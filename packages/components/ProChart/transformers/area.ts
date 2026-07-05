/**
 * area transformer — 面积图
 *
 * 基于折线图，默认开启 areaStyle
 * 支持多系列（seriesField）、堆叠（stack）
 */

import { registerChartTransformer } from './types';
import { buildAxis, buildLegend, buildTooltip, buildColorPalette } from './utils';

registerChartTransformer({
  type: 'area',
  transform(schema, _ctx) {
    const { dataSource = [], xField, yField, seriesField, series } = schema;
    if (!xField || !yField) {
      throw new Error('[ProChart] area transformer requires xField and yField');
    }

    const yFields = Array.isArray(yField) ? yField : [yField];
    const option = {
      xAxis: buildAxis(schema.xAxis, 'category'),
      yAxis: buildAxis(schema.yAxis, 'value'),
      tooltip: buildTooltip(schema.tooltip, 'axis'),
      legend: buildLegend(schema.legend, Boolean(seriesField)),
      color: buildColorPalette(schema.color),
    } as Record<string, unknown>;

    if (!seriesField) {
      return {
        ...option,
        xAxis: { ...(option.xAxis as Record<string, unknown>), data: dataSource.map((d) => d[xField]) },
        series: yFields.map((yf) => ({
          type: 'line',
          name: yf,
          smooth: series?.smooth,
          areaStyle: { opacity: series?.stack ? 0.8 : 0.4 },
          stack: series?.stack ? (typeof series.stack === 'string' ? series.stack : 'total') : undefined,
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
        areaStyle: { opacity: series?.stack ? 0.8 : 0.4 },
        stack: series?.stack ? (typeof series.stack === 'string' ? series.stack : 'total') : undefined,
        data: xData.map((x) => {
          const row = rows.find((r) => String(r[xField!]) === x);
          return row ? row[yFields[0]] : null;
        }),
      })),
    };
  },
});
