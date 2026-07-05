/**
 * bar transformer — 柱状图
 *
 * 支持堆叠、横向、分组
 */

import { registerChartTransformer } from './types';
import { buildAxis, buildLegend, buildTooltip, buildColorPalette } from './utils';

registerChartTransformer({
  type: 'bar',
  transform(schema, _ctx) {
    const { dataSource = [], xField, yField, seriesField, series } = schema;
    if (!xField || !yField) {
      throw new Error('[ProChart] bar transformer requires xField and yField');
    }

    const yFields = Array.isArray(yField) ? yField : [yField];
    const horizontal = Boolean(series?.horizontal);
    const option = {
      xAxis: buildAxis(schema.xAxis, horizontal ? 'value' : 'category'),
      yAxis: buildAxis(schema.yAxis, horizontal ? 'category' : 'value'),
      tooltip: buildTooltip(schema.tooltip, 'axis'),
      legend: buildLegend(schema.legend, Boolean(seriesField)),
      color: buildColorPalette(schema.color),
    } as Record<string, unknown>;

    if (!seriesField) {
      return {
        ...option,
        xAxis: {
          ...(option.xAxis as Record<string, unknown>),
          data: horizontal ? undefined : dataSource.map((d) => d[xField]),
        },
        yAxis: {
          ...(option.yAxis as Record<string, unknown>),
          data: horizontal ? dataSource.map((d) => d[xField]) : undefined,
        },
        series: yFields.map((yf) => ({
          type: 'bar',
          name: yf,
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
      xAxis: {
        ...(option.xAxis as Record<string, unknown>),
        data: horizontal ? undefined : xData,
      },
      yAxis: {
        ...(option.yAxis as Record<string, unknown>),
        data: horizontal ? xData : undefined,
      },
      series: Array.from(groups.entries()).map(([name, rows]) => ({
        type: 'bar',
        name,
        stack: series?.stack ? (typeof series.stack === 'string' ? series.stack : 'total') : undefined,
        data: xData.map((x) => {
          const row = rows.find((r) => String(r[xField!]) === x);
          return row ? row[yFields[0]] : 0;
        }),
      })),
    };
  },
});
