/**
 * scatter transformer — 散点图
 *
 * 支持多系列（seriesField）、气泡图（sizeField）
 */

import { registerChartTransformer } from './types';

function toNumber(val: unknown): number {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const n = Number(val);
    return Number.isNaN(n) ? 0 : n;
  }
  return 0;
}

registerChartTransformer({
  type: 'scatter',
  transform(schema, _ctx) {
    const { dataSource = [], xField, yField, seriesField, sizeField } = schema;
    if (!xField || !yField) {
      throw new Error('[ProChart] scatter transformer requires xField and yField');
    }

    const yFields = Array.isArray(yField) ? yField[0] : yField;

    const buildData = (rows: Record<string, unknown>[]): unknown[][] =>
      rows.map((d) => {
        const point: unknown[] = [d[xField], d[yFields]];
        if (sizeField) point.push(d[sizeField]);
        return point;
      });

    const symbolSizeFn = sizeField
      ? (_val: unknown, params: Record<string, unknown>): number => {
          const data = params.data as unknown[];
          const sizeVal = data[2];
          return Math.max(toNumber(sizeVal), 4);
        }
      : (): number => 10;

    if (!seriesField) {
      return {
        xAxis: { type: 'value' },
        yAxis: { type: 'value' },
        tooltip: { trigger: 'item' },
        series: [
          {
            type: 'scatter',
            symbolSize: symbolSizeFn,
            data: buildData(dataSource),
          },
        ],
      };
    }

    const groups = new Map<string, Record<string, unknown>[]>();
    dataSource.forEach((d) => {
      const key = String(d[seriesField]);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(d);
    });

    return {
      xAxis: { type: 'value' },
      yAxis: { type: 'value' },
      tooltip: { trigger: 'item' },
      legend: { type: 'plain', top: 0 },
      series: Array.from(groups.entries()).map(([name, rows]) => ({
        type: 'scatter',
        name,
        symbolSize: symbolSizeFn,
        data: buildData(rows),
      })),
    };
  },
});
