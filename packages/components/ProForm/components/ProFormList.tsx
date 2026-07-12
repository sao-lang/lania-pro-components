import React, { forwardRef, useImperativeHandle, useCallback, useMemo, useState, useEffect } from 'react';
import { Button, Card } from '@arco-design/web-react';
import { IconPlus, IconDelete, IconCopy, IconUp, IconDown, IconEraser } from '@arco-design/web-react/icon';
import { useRootContext } from '../context/RootContext';
import { FormField } from '../components/FormField';
import { useProFormContext, ProFormContext } from '../useProForm';
import { createFormStore } from '../core/FormStore';

import type { ProFormSchema } from '../types';
import type { ProFormListProps, ProFormListInstance, ProFormListActions } from './types';
import type { FormStore } from '../core/FormStore';

const getFieldKey = (schemaName: ProFormSchema['name']): string =>
  Array.isArray(schemaName) ? schemaName.join('.') : schemaName;

/**
 * 动态列表表单（ProFormList）
 *
 * 支持动态增删行的数组表单组件。适用于：
 * - 动态联系方式
 * - 多项地址输入
 * - 子表单列表
 *
 * 特性：
 * - 动态添加/删除/复制/移动/清空行
 * - 最小/最大行数限制
 * - 卡片模式（每行用 Card 包裹）
 * - 自定义行标题与单项渲染
 * - 每行独立的字段 Schema
 * - 命令式 ref API（add/remove/copy/move/clear/getList/getLength）
 * - 支持受控/非受控双模式
 *
 * 受控模式：提供 value prop，行数组由父组件控制，所有变更通过 onChange 回调通知父组件。
 * 非受控模式：不提供 value prop，行数组由组件内部 state 主导，挂载时从 store 读取初始值。
 *
 * 字段命名：行内字段名格式为 `{name}[{index}].{fieldName}`，FormField 按位置
 * 复用 FieldNode。结构变更（move/remove）时主动重排扁平字段值，保证显示与数据一致。
 *
 * @example
 * ```tsx
 * // 非受控模式
 * <ProFormList
 *   name="contacts"
 *   label="联系人"
 *   schemas={[
 *     { name: 'name', label: '姓名', component: 'Input' },
 *     { name: 'phone', label: '电话', component: 'PhoneInput' },
 *   ]}
 *   min={1}
 *   max={5}
 *   ref={listRef}
 * />
 *
 * // 受控模式
 * <ProFormList
 *   name="contacts"
 *   label="联系人"
 *   schemas={schemas}
 *   value={contactList}
 *   onChange={(val) => setContactList(val)}
 * />
 * ```
 */
export const ProFormList = forwardRef<ProFormListInstance, ProFormListProps>(
  (
    {
      name,
      label,
      itemTitle,
      schemas,
      min = 0,
      max = Infinity,
      addText = '添加',
      removeText = '删除',
      showAddButton = true,
      showRemoveButton = true,
      onAdd,
      onRemove,
      initialValue = [],
      disabled = false,
      readonly = false,
      card = false,
      cardProps,
      copyText = '复制',
      showCopyButton = false,
      moveUpText = '上移',
      moveDownText = '下移',
      showMoveButtons = false,
      clearText = '清空',
      showClearButton = false,
      creatorRecord,
      onCopy,
      onMove,
      onClear,
      value,
      onChange,
      itemRender,
      emptyText = '暂无数据',
      className,
      style,
    },
    ref,
  ) => {
    const rootContext = useRootContext();
    const proFormContext = useProFormContext();

    const internalStore = useMemo(() => createFormStore(), []);
    const store: FormStore = proFormContext?.store ?? internalStore;
    const arcoForm = rootContext?.arcoForm;

    const isControlled = value !== undefined;

    const [innerItems, setInnerItems] = useState<unknown[]>(() => {
      if (isControlled) return value;
      const raw = store.getValue(name);
      return Array.isArray(raw) ? raw : initialValue;
    });

    const items = isControlled ? value : innerItems;

    const isStandalone = !proFormContext;

    // ========== 扁平字段值读写 ==========
    // 行内字段以 `name[index].field` 形式注册到 store，与数组值 `name` 相互独立。
    // 结构变更时需主动重排扁平字段值，保证显示与数据一致。
    const readRowValues = useCallback(
      (index: number): Record<string, unknown> => {
        const data: Record<string, unknown> = {};
        schemas.forEach((s) => {
          const fieldKey = getFieldKey(s.name);
          data[fieldKey] = store?.getValue(`${name}[${index}].${fieldKey}`);
        });
        return data;
      },
      [schemas, name, store],
    );

    const writeRowValues = useCallback(
      (index: number, data: Record<string, unknown>) => {
        schemas.forEach((s) => {
          const fieldKey = getFieldKey(s.name);
          store?.setValue(`${name}[${index}].${fieldKey}`, data[fieldKey]);
        });
      },
      [schemas, name, store],
    );

    // ========== 受控模式下 value 变化时同步扁平字段值 ==========
    useEffect(() => {
      if (isControlled && store) {
        items.forEach((item, index) => {
          writeRowValues(index, item as Record<string, unknown>);
        });
      }
    }, [isControlled, items, store, writeRowValues]);

    // ========== 统一变更应用 ==========
    // 受控模式：只通知 onChange，由父组件更新 value
    // 非受控模式：更新内部 state + 同步数组到 store + 通知
    const applyChange = useCallback(
      (newItems: unknown[]) => {
        if (isControlled) {
          onChange?.(newItems);
        } else {
          setInnerItems(newItems);
          store.setValue(name, newItems);
          rootContext?.onValuesChange?.({ [name]: newItems }, store.getValues());
          onChange?.(newItems);
        }
      },
      [isControlled, store, name, rootContext, onChange],
    );

    // ========== 操作实现 ==========
    const add = useCallback(
      (record?: Record<string, unknown>) => {
        if (items.length >= max) return;
        const data = record || creatorRecord || {};
        const newIndex = items.length;
        // 预置扁平字段值，使新增行的 FieldNode 挂载时读取到正确初始值
        writeRowValues(newIndex, data);
        applyChange([...items, data]);
        onAdd?.(newIndex);
      },
      [items, max, creatorRecord, writeRowValues, applyChange, onAdd],
    );

    const remove = useCallback(
      (index: number) => {
        if (items.length <= min) return;
        // 捕获当前所有行的扁平值（从 store 读，非过期快照），删除后重排
        const currentData = items.map((_, i) => readRowValues(i));
        currentData.splice(index, 1);
        const newItems = [...items];
        newItems.splice(index, 1);
        applyChange(newItems);
        // 按新顺序重写扁平字段值，修正移位后的显示
        currentData.forEach((data, i) => writeRowValues(i, data));
        onRemove?.(index);
      },
      [items, min, readRowValues, writeRowValues, applyChange, onRemove],
    );

    const copy = useCallback(
      (index: number) => {
        if (items.length >= max) return;
        const sourceData = readRowValues(index);
        const newIndex = items.length;
        writeRowValues(newIndex, sourceData);
        applyChange([...items, sourceData]);
        onCopy?.(index);
      },
      [items, max, readRowValues, writeRowValues, applyChange, onCopy],
    );

    const move = useCallback(
      (from: number, to: number) => {
        if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return;
        const currentData = items.map((_, i) => readRowValues(i));
        const [moved] = currentData.splice(from, 1);
        currentData.splice(to, 0, moved);
        const newItems = [...items];
        const [movedItem] = newItems.splice(from, 1);
        newItems.splice(to, 0, movedItem);
        applyChange(newItems);
        // 按新顺序重写扁平字段值，FieldNode watch 会自动更新显示
        currentData.forEach((data, i) => writeRowValues(i, data));
        onMove?.(from, to);
      },
      [items, readRowValues, writeRowValues, applyChange, onMove],
    );

    const moveUp = useCallback((index: number) => move(index, index - 1), [move]);
    const moveDown = useCallback((index: number) => move(index, index + 1), [move]);

    const clear = useCallback(() => {
      const keep = Math.min(min, items.length);
      const newItems = items.slice(0, keep);
      applyChange(newItems);
      onClear?.();
    }, [items, min, applyChange, onClear]);

    const actions: ProFormListActions = useMemo(
      () => ({ add, remove, copy, moveUp, moveDown, move, clear }),
      [add, remove, copy, moveUp, moveDown, move, clear],
    );

    // ========== 命令式 ref ==========
    useImperativeHandle(
      ref,
      (): ProFormListInstance => ({
        ...actions,
        getList: () => items.map((_, i) => readRowValues(i)),
        getLength: () => items.length,
      }),
      [actions, items, readRowValues],
    );

    // ========== 行标题 ==========
    const getItemTitle = useCallback(
      (index: number) => {
        if (typeof itemTitle === 'function') {
          return itemTitle(index);
        }
        return itemTitle ? `${itemTitle} ${index + 1}` : `项目 ${index + 1}`;
      },
      [itemTitle],
    );

    // ========== 单项渲染 ==========
    const renderItem = (index: number) => {
      const itemSchemas = schemas.map((schema) => ({
        ...schema,
        name: `${name}[${index}].${getFieldKey(schema.name)}`,
      }));

      const defaultContent = (
        <div style={{ position: 'relative' }}>
          {store &&
            arcoForm &&
            itemSchemas.map((schema, childIndex) => (
              <FormField key={childIndex} schema={schema} formStore={store} arcoForm={arcoForm} />
            ))}
          {!readonly && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              {showRemoveButton && (
                <Button
                  type='text'
                  size='small'
                  icon={<IconDelete />}
                  disabled={disabled || items.length <= min}
                  onClick={() => remove(index)}
                >
                  {removeText}
                </Button>
              )}
              {showCopyButton && (
                <Button
                  type='text'
                  size='small'
                  icon={<IconCopy />}
                  disabled={disabled || items.length >= max}
                  onClick={() => copy(index)}
                >
                  {copyText}
                </Button>
              )}
              {showMoveButtons && (
                <>
                  <Button
                    type='text'
                    size='small'
                    icon={<IconUp />}
                    disabled={disabled || index === 0}
                    onClick={() => moveUp(index)}
                  >
                    {moveUpText}
                  </Button>
                  <Button
                    type='text'
                    size='small'
                    icon={<IconDown />}
                    disabled={disabled || index === items.length - 1}
                    onClick={() => moveDown(index)}
                  >
                    {moveDownText}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      );

      const itemNode = itemRender ? itemRender(defaultContent, index, actions) : defaultContent;

      if (card) {
        return (
          <Card
            key={index}
            title={getItemTitle(index)}
            style={{ marginBottom: 16 }}
            {...(cardProps as Record<string, unknown>)}
          >
            {itemNode}
          </Card>
        );
      }

      return (
        <div
          key={index}
          style={{
            marginBottom: 24,
            padding: 16,
            border: '1px solid #e5e6eb',
            borderRadius: 4,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <span style={{ fontWeight: 500 }}>{getItemTitle(index)}</span>
          </div>
          {itemNode}
        </div>
      );
    };

    const listContent = (
      <div className={className} style={style}>
        {label && <div style={{ marginBottom: 12, fontWeight: 500 }}>{label}</div>}
        {items.length === 0 ? (
          <div
            style={{
              padding: 24,
              textAlign: 'center',
              color: '#86909c',
              border: '1px dashed #e5e6eb',
              borderRadius: 4,
              marginBottom: 8,
            }}
          >
            {emptyText}
          </div>
        ) : (
          items.map((_, index) => renderItem(index))
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          {showAddButton && !readonly && (
            <Button
              type='dashed'
              icon={<IconPlus />}
              disabled={disabled || items.length >= max}
              onClick={() => add()}
              style={{ flex: showClearButton ? 1 : undefined, width: showClearButton ? undefined : '100%' }}
            >
              {addText}
            </Button>
          )}
          {showClearButton && !readonly && (
            <Button type='outline' icon={<IconEraser />} disabled={disabled || items.length <= min} onClick={clear}>
              {clearText}
            </Button>
          )}
        </div>
      </div>
    );

    if (isStandalone) {
      return (
        <ProFormContext.Provider value={{ store, arcoForm: arcoForm!, instance: {} as never, bindingProps: {} }}>
          {listContent}
        </ProFormContext.Provider>
      );
    }

    return listContent;
  },
);

ProFormList.displayName = 'ProFormList';
