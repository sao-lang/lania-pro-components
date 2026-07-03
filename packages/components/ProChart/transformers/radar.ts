/**
 * radar transformer — 雷达图
 *
 * 支持多系列（seriesField）
 * 数据格式：xField 为指示器名称，yField 为数值，多系列通过 seriesField 分组
 */

import { registerChartTransformer } from './types';

registerChartTransformer({
  type: 'radar',
  transform(schema, _ctx) {
    const { dataSource = [], xField, yField, seriesField } = schema;
    if (!xField || !yField) {
      throw new Error('[ProChart] radar transformer requires xField and yField');
    }

    const yFields = Array.isArray(yField) ? yField[0] : yField;

    // 所有唯一指示器名称（雷达图的轴）
    const indicators = Array.from(new Set(dataSource.map((d) => String(d[xField!])))).map((name) => ({
      name,
    }));

    // 单系列无分组
    if (!seriesField) {
      return {
        tooltip: { trigger: 'item' },
        radar: { indicator: indicators },
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

    // 多系列
    const groups = new Map<string, Record<string, unknown>[]>();
    dataSource.forEach((d) => {
      const key = String(d[seriesField!]);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(d);
    });

    return {
      tooltip: { trigger: 'item' },
      legend: { type: 'plain', top: 0 },
      radar: { indicator: indicators },
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
