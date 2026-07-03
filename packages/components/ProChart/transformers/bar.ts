/**
 * bar transformer — 柱状图
 *
 * 支持堆叠、横向、分组
 */

import { registerChartTransformer } from './types';

registerChartTransformer({
  type: 'bar',
  transform(schema, _ctx) {
    const { dataSource = [], xField, yField, seriesField, series } = schema;
    if (!xField || !yField) {
      throw new Error('[ProChart] bar transformer requires xField and yField');
    }

    const yFields = Array.isArray(yField) ? yField : [yField];

    if (!seriesField) {
      return {
        xAxis: { type: 'category', data: dataSource.map((d) => d[xField]) },
        yAxis: { type: 'value' },
        tooltip: { trigger: 'axis' },
        series: yFields.map((yf) => ({
          type: 'bar',
          name: yf,
          data: dataSource.map((d) => d[yf]),
        })),
      };
    }

    // 多系列分组
    const groups = new Map<string, Record<string, unknown>[]>();
    dataSource.forEach((d) => {
      const key = String(d[seriesField!]);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(d);
    });

    const xData = Array.from(new Set(dataSource.map((d) => String(d[xField!]))));

    return {
      xAxis: { type: 'category', data: xData },
      yAxis: { type: 'value' },
      tooltip: { trigger: 'axis' },
      legend: { type: 'plain', top: 0 },
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
