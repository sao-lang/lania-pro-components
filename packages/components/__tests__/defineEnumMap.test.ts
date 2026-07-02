import { describe, it, expect } from 'vitest';
import { defineEnumMap } from '@lania-pro-components/utils';

const statusMap = {
  PENDING: { label: '待处理', value: 0, color: 'gray' },
  SUCCESS: { label: '成功', value: 1, color: 'green' },
  FAILED: { label: '失败', value: 2, color: 'red' },
} as const;

describe('defineEnumMap / 基础查询', () => {
  const helper = defineEnumMap(statusMap);

  it('findLabelByValue: 根据值查找标签', () => {
    expect(helper.findLabelByValue(0)).toBe('待处理');
    expect(helper.findLabelByValue(1)).toBe('成功');
    expect(helper.findLabelByValue(2)).toBe('失败');
    expect(helper.findLabelByValue(99)).toBeUndefined();
  });

  it('findValueByLabel: 根据标签查找值', () => {
    expect(helper.findValueByLabel('待处理')).toBe(0);
    expect(helper.findValueByLabel('成功')).toBe(1);
    expect(helper.findValueByLabel('不存在')).toBeUndefined();
  });

  it('findItemByValue: 根据值查找枚举项', () => {
    expect(helper.findItemByValue(0)).toEqual({ label: '待处理', value: 0, color: 'gray' });
    expect(helper.findItemByValue(99)).toBeUndefined();
  });

  it('getRawMap: 返回原始映射表', () => {
    expect(helper.getRawMap()).toEqual(statusMap);
  });
});

describe('defineEnumMap / 存在性判断', () => {
  const helper = defineEnumMap(statusMap);

  it('hasValueKey: 判断值是否存在', () => {
    expect(helper.hasValueKey(0)).toBe(true);
    expect(helper.hasValueKey(2)).toBe(true);
    expect(helper.hasValueKey(99)).toBe(false);
  });

  it('hasLabelText: 判断标签是否存在', () => {
    expect(helper.hasLabelText('待处理')).toBe(true);
    expect(helper.hasLabelText('成功')).toBe(true);
    expect(helper.hasLabelText('不存在')).toBe(false);
  });
});

describe('defineEnumMap / 集合操作', () => {
  const helper = defineEnumMap(statusMap);

  it('entries: 返回键值对数组', () => {
    const entries = helper.entries();
    expect(entries).toHaveLength(3);
    expect(entries[0][0]).toBe('PENDING');
    expect(entries[0][1].value).toBe(0);
  });

  it('keys: 返回键数组', () => {
    expect(helper.keys()).toEqual(['PENDING', 'SUCCESS', 'FAILED']);
  });

  it('values: 返回值数组', () => {
    const values = helper.values();
    expect(values).toHaveLength(3);
    expect(values.map((v) => v.value)).toEqual([0, 1, 2]);
  });
});

describe('defineEnumMap / Proxy 访问', () => {
  const helper = defineEnumMap(statusMap);

  it('通过 helper.xxx 直接访问对应枚举项', () => {
    expect(helper.PENDING).toEqual({ label: '待处理', value: 0, color: 'gray' });
    expect(helper.SUCCESS.value).toBe(1);
  });

  it('访问不存在的属性返回 undefined', () => {
    // Proxy 动态属性访问，TS 无法静态推断，用断言绕过
    expect((helper as Record<string, unknown>).NOT_EXIST).toBeUndefined();
  });
});

describe('defineEnumMap / getOptionList', () => {
  const helper = defineEnumMap(statusMap);

  it('默认使用 label/value 作为键', () => {
    const options = helper.getOptionList();
    expect(options).toHaveLength(3);
    expect(options[0]).toEqual({ label: '待处理', value: 0 });
    expect(options[2]).toEqual({ label: '失败', value: 2 });
  });

  it('支持自定义 labelKey/valueKey', () => {
    const options = helper.getOptionList({ labelKey: 'name', valueKey: 'id' });
    expect(options[0]).toEqual({ name: '待处理', id: 0 });
  });

  it('exclude 过滤指定值的选项', () => {
    const options = helper.getOptionList({ exclude: [0] });
    expect(options).toHaveLength(2);
    expect(options.find((o) => o.value === 0)).toBeUndefined();
    expect(options[0].value).toBe(1);
  });

  it('prepend 在选项前追加，append 在选项后追加', () => {
    const options = helper.getOptionList({
      prepend: [{ label: '全部', value: -1 }],
      append: [{ label: '其他', value: 99 }],
    });
    expect(options).toHaveLength(5);
    expect(options[0]).toEqual({ label: '全部', value: -1 });
    expect(options[options.length - 1]).toEqual({ label: '其他', value: 99 });
  });

  it('相同参数缓存：返回的对象 prepend/append 是新数组，但 core 引用相同', () => {
    const a = helper.getOptionList();
    const b = helper.getOptionList();
    // 不带 prepend/append 时返回的是新数组拷贝（[...prepend, ...core, ...append]）
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });
});

describe('defineEnumMap / 嵌套 children', () => {
  const nestedMap = {
    PROVINCE: {
      label: '广东省',
      value: 'gd',
      children: [
        { label: '广州市', value: 'gz' },
        { label: '深圳市', value: 'sz' },
      ],
    },
  };
  const helper = defineEnumMap(nestedMap);

  it('children 中的项也会被收集到 label/value 映射', () => {
    expect(helper.findLabelByValue('gz')).toBe('广州市');
    expect(helper.findLabelByValue('sz')).toBe('深圳市');
    expect(helper.findValueByLabel('深圳市')).toBe('sz');
  });

  it('getOptionList 递归构建 children', () => {
    const options = helper.getOptionList();
    expect(options).toHaveLength(1);
    expect(options[0].children).toHaveLength(2);
    expect(options[0].children?.[0]).toEqual({ label: '广州市', value: 'gz' });
  });

  it('exclude 过滤 children 中的项', () => {
    const options = helper.getOptionList({ exclude: ['gz'] });
    expect(options[0].children).toHaveLength(1);
    expect(options[0].children?.[0].value).toBe('sz');
  });
});

describe('defineEnumMap / 缓存隔离', () => {
  // 不同 labelKey/valueKey 应使用不同缓存
  it('不同 labelKey 配置产生不同结果', () => {
    const helper = defineEnumMap(statusMap);
    const a = helper.getOptionList({ labelKey: 'label' });
    const b = helper.getOptionList({ labelKey: 'name' });
    expect(a[0]).toHaveProperty('label');
    expect(b[0]).toHaveProperty('name');
    expect(b[0]).not.toHaveProperty('label');
  });
});
