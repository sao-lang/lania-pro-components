/**
 * pie transformer — 饼图
 *
 * 支持环图、玫瑰图
 */

import { registerChartTransformer } from './types';

registerChartTransformer({
  type: 'pie',
  transform(schema, _ctx) {
    const { dataSource = [], xField, yField } = schema;
    if (!xField || !yField) {
      throw new Error('[ProChart] pie transformer requires xField and yField');
    }

    const yFields = Array.isArray(yField) ? yField[0] : yField;

    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { type: 'plain', top: 0 },
      series: [
        {
          type: 'pie',
          radius: schema.series?.area ? ['40%', '70%'] : '60%',
          roseType: (schema.series as Record<string, unknown>)?.roseType as boolean | undefined,
          data: dataSource.map((d) => ({
            name: d[xField!],
            value: d[yFields],
          })),
          label: {
            show: true,
            formatter: '{b}: {d}%',
          },
        },
      ],
    };
  },
});
