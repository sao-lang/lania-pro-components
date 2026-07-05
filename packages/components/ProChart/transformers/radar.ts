/**
 * radar transformer — 雷达图
 *
 * 支持多系列（seriesField）
 * 数据格式：xField 为指示器名称，yField 为数值，多系列通过 seriesField 分组
 */

import { registerChartTransformer } from './types';
import { buildLegend, buildTooltip, buildColorPalette } from './utils';

registerChartTransformer({
  type: 'radar',
  transform(schema, _ctx) {
    const { dataSource = [], xField, yField, seriesField } = schema;
    if (!xField || !yField) {
      throw new Error('[ProChart] radar transformer requires xField and yField');
    }

    const yFields = Array.isArray(yField) ? yField[0] : yField;
    const indicators = Array.from(new Set(dataSource.map((d) => String(d[xField!])))).map((name) => ({
      name,
    }));

    const base = {
      tooltip: buildTooltip(schema.tooltip, 'item'),
      legend: buildLegend(schema.legend, Boolean(seriesField)),
      radar: { indicator: indicators },
      color: buildColorPalette(schema.color),
    } as Record<string, unknown>;

    if (!seriesField) {
      return {
        ...base,
        series: [
          {
            type: 'radar',
            data: [
              {
                value: indicators.map((ind) => {
                  const row = dataSource.find((d) => String(d[xField!]) === ind.name);
                  return row ? row[yFields] : 0;
                }),
              },
            ],
          },
        ],
      };
    }

    const groups = new Map<string, Record<string, unknown>[]>();
    dataSource.forEach((d) => {
      const key = String(d[seriesField!]);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(d);
    });

    return {
      ...base,
      series: [
        {
          type: 'radar',
          data: Array.from(groups.entries()).map(([name, rows]) => ({
            name,
            value: indicators.map((ind) => {
              const row = rows.find((d) => String(d[xField!]) === ind.name);
              return row ? row[yFields] : 0;
            }),
          })),
        },
      ],
    };
  },
});
