import { describe, it, expect, beforeEach, vi } from 'vitest';
import { instanceRegistry, getProDialogInstance } from '../ProDialog/instanceRegistry';
import type { ProDialogInstance } from '../ProDialog/types';

/** 创建一个最小化的 ProDialogInstance mock */
function createMockInstance(name: string): ProDialogInstance {
  return {
    open: vi.fn(),
    close: vi.fn(),
    destroy: vi.fn(),
    // 标记以便区分
    ...(name ? { __name: name } : {}),
  } as unknown as ProDialogInstance;
}

describe('instanceRegistry / 基础 CRUD', () => {
  beforeEach(() => {
    instanceRegistry.clear();
  });

  it('register / get: 注册并获取实例', () => {
    const instance = createMockInstance('dialog-1');
    instanceRegistry.register('dialog-1', instance);
    expect(instanceRegistry.get('dialog-1')).toBe(instance);
  });

  it('get 未注册的 name 返回 undefined', () => {
    expect(instanceRegistry.get('not-exist')).toBeUndefined();
  });

  it('register 同名会覆盖原实例', () => {
    const a = createMockInstance('a');
    const b = createMockInstance('b');
    instanceRegistry.register('dialog', a);
    instanceRegistry.register('dialog', b);
    expect(instanceRegistry.get('dialog')).toBe(b);
  });

  it('unregister 移除指定实例', () => {
    const instance = createMockInstance('dialog');
    instanceRegistry.register('dialog', instance);
    expect(instanceRegistry.has('dialog')).toBe(true);
    instanceRegistry.unregister('dialog');
    expect(instanceRegistry.has('dialog')).toBe(false);
    expect(instanceRegistry.get('dialog')).toBeUndefined();
  });

  it('unregister 未注册的 name 不报错', () => {
    expect(() => instanceRegistry.unregister('not-exist')).not.toThrow();
  });

  it('has 判断实例是否存在', () => {
    expect(instanceRegistry.has('dialog')).toBe(false);
    instanceRegistry.register('dialog', createMockInstance('dialog'));
    expect(instanceRegistry.has('dialog')).toBe(true);
  });
});

describe('instanceRegistry / getAll', () => {
  beforeEach(() => {
    instanceRegistry.clear();
  });

  it('返回所有已注册实例的 Map', () => {
    const a = createMockInstance('a');
    const b = createMockInstance('b');
    instanceRegistry.register('a', a);
    instanceRegistry.register('b', b);
    const all = instanceRegistry.getAll();
    expect(all).toBeInstanceOf(Map);
    expect(all.size).toBe(2);
    expect(all.get('a')).toBe(a);
    expect(all.get('b')).toBe(b);
  });

  it('返回的是新 Map，修改不影响内部状态', () => {
    instanceRegistry.register('a', createMockInstance('a'));
    const all = instanceRegistry.getAll();
    all.clear();
    // 内部不受影响
    expect(instanceRegistry.has('a')).toBe(true);
    expect(instanceRegistry.getAll().size).toBe(1);
  });

  it('空注册表返回空 Map', () => {
    expect(instanceRegistry.getAll().size).toBe(0);
  });
});

describe('instanceRegistry / clear', () => {
  it('清空所有已注册实例', () => {
    instanceRegistry.register('a', createMockInstance('a'));
    instanceRegistry.register('b', createMockInstance('b'));
    expect(instanceRegistry.getAll().size).toBe(2);
    instanceRegistry.clear();
    expect(instanceRegistry.getAll().size).toBe(0);
    expect(instanceRegistry.has('a')).toBe(false);
  });
});

describe('getProDialogInstance', () => {
  beforeEach(() => {
    instanceRegistry.clear();
  });

  it('从 registry 中获取已注册实例', () => {
    const instance = createMockInstance('dialog');
    instanceRegistry.register('dialog', instance);
    expect(getProDialogInstance('dialog')).toBe(instance);
  });

  it('未注册时返回 undefined', () => {
    expect(getProDialogInstance('not-exist')).toBeUndefined();
  });

  it('获取的实例可正常调用方法', () => {
    const instance = createMockInstance('dialog');
    instanceRegistry.register('dialog', instance);
    const got = getProDialogInstance('dialog');
    got?.open?.({ title: 'test' });
    expect(instance.open).toHaveBeenCalledWith({ title: 'test' });
  });
});
