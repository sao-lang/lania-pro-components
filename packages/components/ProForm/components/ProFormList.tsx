import React, { FC, useCallback, useMemo } from 'react';
import { Button, Card } from '@arco-design/web-react';
import { IconPlus, IconDelete } from '@arco-design/web-react/icon';
import { useRootContext } from '../context/RootContext';
import { FormField } from '../FormField';
import { useProFormContext } from '../useProForm';

import type { ProFormListProps } from './types';

export const ProFormList: FC<ProFormListProps> = ({
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
}) => {
  const { onValuesChange, arcoForm } = useRootContext();
  const { formStore } = useProFormContext();

  const listValue = useMemo(() => {
    const value = formStore?.getValue(name);
    return Array.isArray(value) ? value : initialValue;
  }, [formStore, name, initialValue]);

  const handleAdd = useCallback(() => {
    const currentValue = (formStore?.getValue(name) as unknown[]) || [];
    const newValue = [...currentValue, {}];
    formStore?.setValue(name, newValue);
    onValuesChange?.({ [name]: newValue }, formStore?.getValues() || {});
    onAdd?.(newValue.length - 1);
  }, [formStore, name, onAdd, onValuesChange]);

  const handleRemove = useCallback(
    (index: number) => {
      const currentValue = (formStore?.getValue(name) as unknown[]) || [];
      const newValue = currentValue.filter((_, i: number) => i !== index);
      formStore?.setValue(name, newValue);
      onValuesChange?.({ [name]: newValue }, formStore?.getValues() || {});
      onRemove?.(index);
    },
    [formStore, name, onRemove, onValuesChange],
  );

  const getItemTitle = useCallback(
    (index: number) => {
      if (typeof itemTitle === 'function') {
        return itemTitle(index);
      }
      return itemTitle ? `${itemTitle} ${index + 1}` : `项目 ${index + 1}`;
    },
    [itemTitle],
  );

  const renderItem = (index: number) => {
    const itemSchemas = schemas.map((schema) => ({
      ...schema,
      name: `${Array.isArray(name) ? name.join('.') : name}[${index}].${Array.isArray(schema.name) ? schema.name.join('.') : schema.name}`,
    }));

    const itemContent = (
      <div style={{ position: 'relative' }}>
        {formStore &&
          arcoForm &&
          itemSchemas.map((schema, childIndex) => (
            <FormField key={childIndex} schema={schema} formStore={formStore} arcoForm={arcoForm} />
          ))}
        {showRemoveButton && !readonly && (
          <Button
            type='text'
            icon={<IconDelete />}
            disabled={disabled || listValue.length <= min}
            onClick={() => handleRemove(index)}
            style={{ position: 'absolute', top: 0, right: 0 }}
          >
            {removeText}
          </Button>
        )}
      </div>
    );

    if (card) {
      return (
        <Card
          key={index}
          title={getItemTitle(index)}
          style={{ marginBottom: 16 }}
          {...(cardProps as Record<string, unknown>)}
        >
          {itemContent}
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
        {itemContent}
      </div>
    );
  };

  return (
    <div>
      {label && <div style={{ marginBottom: 12, fontWeight: 500 }}>{label}</div>}
      {listValue.map((_, index) => renderItem(index))}
      {showAddButton && !readonly && (
        <Button
          type='dashed'
          icon={<IconPlus />}
          disabled={disabled || listValue.length >= max}
          onClick={handleAdd}
          style={{ width: '100%', marginTop: 8 }}
        >
          {addText}
        </Button>
      )}
    </div>
  );
};
