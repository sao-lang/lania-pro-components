/**
 * ProSelect 组件 — 增强版选择器组件
 *
 * 基于 Arco Design Select 封装的高级选择器组件，支持以下特性：
 * - 远程数据请求（request + 分页加载）
 * - 本地搜索（带防抖延迟）
 * - 自定义字段映射（fieldNames）
 * - 选项分组渲染
 * - 全选/取消全选（多选模式）
 * - 标签模式（tagMode）
 * - 虚拟滚动（大数据量优化）
 * - 动态创建选项（allowCreate + validateCreate）
 * - 自定义选项渲染（optionRender）/ 空状态（emptyRender）
 * - 下拉框头部/底部自定义（dropdownHeader / dropdownFooter）
 * - ref 暴露 refresh / loadMore / selectAll / create 等方法
 *
 * @example
 * ```tsx
 * // 远程搜索分页
 * <ProSelect
 *   search
 *   pagination
 *   request={async ({ keyword, page, pageSize }) => {
 *     const res = await fetchData({ keyword, page, pageSize });
 *     return { data: res.list, total: res.total };
 *   }}
 * />
 * ```
 */
import React, { forwardRef, useImperativeHandle, useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Select, Spin, Empty, Tag, Checkbox } from '@arco-design/web-react';
import type { ProSelectProps, ProSelectInstance, ProSelectOption, ProSelectRequestResult, SelectProps } from './types';

const ProSelectComponent = forwardRef<ProSelectInstance, ProSelectProps>((props: ProSelectProps, ref) => {
  const {
    options: initialOptions = [],
    request,
    search = false,
    debounceTime = 300,
    pagination = false,
    pageSize = 20,
    showLoading = true,
    optionRender,
    emptyRender,
    formatOptions,
    fieldNames = {
      label: 'label',
      value: 'value',
      disabled: 'disabled',
      group: 'group',
    },
    tagMode = false,
    tagProps,
    tagRender,
    showSelectAll = false,
    selectAllText = '全选',
    unselectAllText = '取消全选',
    virtual = false,
    virtualHeight = 256,
    virtualItemHeight = 32,
    showOptionIcon = false,
    optionIconRender,
    clearSearchOnSelect = false,
    maxTagCount,
    allowCreate = false,
    validateCreate,
    formatCreateOption,
    dropdownHeader,
    dropdownFooter,
    mode,
    value,
    defaultValue,
    onChange,
    onVisibleChange,
    placeholder,
    createdOptionPrefix,
    ...restProps
  } = props;

  // When allowCreate is enabled, search must be active so the user can type to create options
  const effectiveSearch = search || allowCreate;

  const [optionsState, setOptionsState] = useState<ProSelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [pageNum, setPageNum] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [innerValue, setInnerValue] = useState<SelectProps['value']>(
    defaultValue !== undefined ? defaultValue : mode === 'multiple' ? [] : undefined,
  );
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoadRef = useRef(true);
  const selectRef = useRef<React.ElementRef<typeof Select>>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : innerValue;

  const getFieldName = (field: 'label' | 'value' | 'disabled' | 'group'): string => {
    const names = fieldNames;
    return names[field] ?? field;
  };

  const formatOptionData = useCallback(
    (data: unknown[]): ProSelectOption[] => {
      if (formatOptions) {
        return formatOptions(data);
      }
      const labelField = getFieldName('label');
      const valueField = getFieldName('value');
      const disabledField = getFieldName('disabled');
      const groupField = getFieldName('group');
      return data.map((item) => {
        const record = item as Record<string, unknown>;
        return {
          label: record[labelField] as React.ReactNode,
          value: record[valueField] as string | number,
          disabled: record[disabledField] as boolean | undefined,
          group: record[groupField] as string | undefined,
          ...record,
        };
      });
    },
    [formatOptions, fieldNames],
  );

  const fetchData = useCallback(
    async (fetchParams: { keyword?: string; page?: number; isLoadMore?: boolean }) => {
      if (!request) {
        return;
      }

      setLoading(true);
      try {
        const result = await (
          request as (params: {
            keyword: string;
            page: number;
            pageSize: number;
          }) => Promise<ProSelectRequestResult | ProSelectOption[]>
        )({
          keyword: fetchParams.keyword || '',
          page: fetchParams.page || 1,
          pageSize,
        });

        let newOptions: ProSelectOption[] = [];
        let hasMoreData = false;

        if (Array.isArray(result)) {
          newOptions = formatOptionData(result);
          hasMoreData = result.length === pageSize;
        } else {
          const resultObj = result;
          newOptions = formatOptionData(resultObj.data || []);
          hasMoreData = resultObj.hasMore ?? (resultObj.total ? newOptions.length < resultObj.total : false);
        }

        if (fetchParams.isLoadMore) {
          setOptionsState((prev) => [...prev, ...newOptions]);
        } else {
          setOptionsState(newOptions);
        }

        setHasMore(hasMoreData);
      } catch (error) {
        console.error('ProSelect fetch data error:', error);
      } finally {
        setLoading(false);
      }
    },
    [request, pageSize, formatOptionData],
  );

  const refresh = useCallback(async () => {
    setPageNum(1);
    setKeyword('');
    await fetchData({ keyword: '', page: 1 });
  }, [fetchData]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) {
      return;
    }
    const nextPage = pageNum + 1;
    setPageNum(nextPage);
    await fetchData({ keyword, page: nextPage, isLoadMore: true });
  }, [hasMore, loading, pageNum, keyword, fetchData]);

  const clearOptions = useCallback(() => {
    setOptionsState([]);
    setPageNum(1);
    setHasMore(true);
  }, []);

  const getOptions = useCallback(() => optionsState, [optionsState]);

  const setOptionsData = useCallback((newOptions: ProSelectOption[]) => {
    setOptionsState(newOptions);
  }, []);

  const getSelectedOptions = useCallback((): ProSelectOption[] => {
    const selectedValues = Array.isArray(currentValue) ? currentValue : [currentValue];
    return optionsState.filter((opt) => selectedValues.includes(opt.value));
  }, [currentValue, optionsState]);

  const handleChange = useCallback(
    async (newValue: SelectProps['value'], option?: unknown) => {
      if (allowCreate && keyword.trim() && !optionsState.some((opt) => opt.value === keyword.trim())) {
        const selectedValue = Array.isArray(newValue) ? newValue[newValue.length - 1] : newValue;
        const selectedValuePrimitive =
          typeof selectedValue === 'object' && selectedValue !== null && 'value' in selectedValue
            ? selectedValue.value
            : selectedValue;

        if (selectedValuePrimitive === keyword.trim()) {
          const trimmedValue = keyword.trim();

          if (validateCreate) {
            const isValid = await validateCreate(trimmedValue);
            if (!isValid) {
              if (!isControlled) {
                setInnerValue(newValue);
              }
              (onChange as (value: SelectProps['value'], option?: unknown) => void)?.(newValue, option);
              if (clearSearchOnSelect) {
                setKeyword('');
              }
              return;
            }
          }

          const newOption = formatCreateOption
            ? formatCreateOption(trimmedValue)
            : { label: trimmedValue, value: trimmedValue };

          setOptionsState((prev) => [...prev, newOption]);

          let finalValue: SelectProps['value'];
          if (mode === 'multiple') {
            const baseValues = Array.isArray(newValue)
              ? newValue.filter((v) => {
                  const valToCheck = typeof v === 'object' && v !== null && 'value' in v ? v.value : v;
                  return valToCheck !== trimmedValue;
                })
              : [];
            finalValue = [...baseValues, newOption.value] as SelectProps['value'];
          } else {
            finalValue = newOption.value;
          }

          if (!isControlled) {
            setInnerValue(finalValue);
          }
          (onChange as (value: SelectProps['value'], option?: unknown) => void)?.(finalValue, option);

          if (clearSearchOnSelect) {
            setKeyword('');
          }
          return;
        }
      }

      if (!isControlled) {
        setInnerValue(newValue);
      }
      (onChange as (value: SelectProps['value'], option?: unknown) => void)?.(newValue, option);

      if (clearSearchOnSelect) {
        setKeyword('');
      }
    },
    [
      isControlled,
      onChange,
      clearSearchOnSelect,
      allowCreate,
      keyword,
      optionsState,
      validateCreate,
      formatCreateOption,
      mode,
    ],
  );

  const selectAll = useCallback(async () => {
    if (mode !== 'multiple') {
      return;
    }
    const allValues = optionsState.filter((opt) => !opt.disabled).map((opt) => opt.value) as SelectProps['value'];
    await handleChange(allValues);
  }, [mode, optionsState, handleChange]);

  const unselectAll = useCallback(async () => {
    if (mode !== 'multiple') {
      return;
    }
    await handleChange([]);
  }, [mode, handleChange]);

  const focus = useCallback(() => {
    const selectElement = selectRef.current;
    if (selectElement) {
      (selectElement as unknown as { focus: () => void }).focus();
    }
  }, []);

  const blur = useCallback(() => {
    const selectElement = selectRef.current;
    if (selectElement) {
      (selectElement as unknown as { blur: () => void }).blur();
    }
  }, []);

  const handleCreate = useCallback(
    async (inputValue: string) => {
      if (!allowCreate || !inputValue.trim()) {
        return;
      }

      const trimmedValue = inputValue.trim();

      if (validateCreate) {
        const isValid = await validateCreate(trimmedValue);
        if (!isValid) {
          return;
        }
      }

      const newOption = formatCreateOption
        ? formatCreateOption(trimmedValue)
        : { label: trimmedValue, value: trimmedValue };

      setOptionsState((prev) => [...prev, newOption]);

      let finalValue: SelectProps['value'];
      if (mode === 'multiple') {
        const newValues = Array.isArray(currentValue) ? [...currentValue, newOption.value] : [newOption.value];
        finalValue = newValues as SelectProps['value'];
      } else {
        finalValue = newOption.value;
      }

      if (!isControlled) {
        setInnerValue(finalValue);
      }
      (onChange as (value: SelectProps['value'], option?: unknown) => void)?.(finalValue, newOption);

      if (clearSearchOnSelect) {
        setKeyword('');
      }
    },
    [allowCreate, validateCreate, formatCreateOption, mode, currentValue, isControlled, onChange, clearSearchOnSelect],
  );

  useImperativeHandle(ref, () => ({
    refresh,
    loadMore,
    clearOptions,
    getOptions,
    setOptions: setOptionsData,
    selectAll,
    unselectAll,
    getSelectedOptions,
    focus,
    blur,
    create: handleCreate,
  }));

  const handleSearch = useCallback(
    (searchValue: string) => {
      setKeyword(searchValue);

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        setPageNum(1);
        void fetchData({ keyword: searchValue, page: 1 });
      }, debounceTime);
    },
    [debounceTime, fetchData],
  );

  const handleDropdownVisibleChange = useCallback(
    (visible: boolean) => {
      setDropdownOpen(visible);
      (onVisibleChange as (visible: boolean) => void)?.(visible);

      if (visible && request && isFirstLoadRef.current && optionsState.length === 0) {
        isFirstLoadRef.current = false;
        void fetchData({ keyword: '', page: 1 });
      }
    },
    [request, optionsState.length, fetchData, onVisibleChange],
  );

  // Use IntersectionObserver on a sentinel element to detect when the user
  // scrolls near the bottom and trigger loadMore. This works for both normal
  // pagination scroll (on the wrapper div) and virtual scroll (where the
  // virtual list has its own internal scroll container).
  useEffect(() => {
    if (!pagination || !dropdownOpen) {
      return;
    }

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          void loadMore();
        }
      },
      {
        rootMargin: '100px 0px 0px 0px',
      },
    );

    observer.observe(sentinel);
    observerRef.current = observer;

    return () => {
      observer.disconnect();
    };
  }, [pagination, dropdownOpen, hasMore, loading, loadMore]);

  useEffect(
    () => () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!request) {
      setOptionsState(initialOptions);
    }
  }, [initialOptions, request]);

  const groupedOptions = useMemo(() => {
    const groups: Record<string, ProSelectOption[]> = {};
    const ungrouped: ProSelectOption[] = [];

    optionsState.forEach((option) => {
      if (option.group) {
        if (!groups[option.group]) {
          groups[option.group] = [];
        }
        groups[option.group].push(option);
      } else {
        ungrouped.push(option);
      }
    });

    return { groups, ungrouped };
  }, [optionsState]);

  const renderOptions = useMemo(() => {
    const renderOptionItem = (option: ProSelectOption) => (
      <Select.Option key={option.value} disabled={option.disabled} {...option}>
        {optionRender ? (
          (optionRender as (option: ProSelectOption) => React.ReactNode)(option)
        ) : (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {showOptionIcon &&
              optionIconRender &&
              (optionIconRender as (option: ProSelectOption) => React.ReactNode)(option)}
            {option.label}
          </span>
        )}
      </Select.Option>
    );

    const result: React.ReactNode[] = [];

    if (groupedOptions.ungrouped.length > 0) {
      result.push(...groupedOptions.ungrouped.map(renderOptionItem));
    }

    Object.entries(groupedOptions.groups).forEach(([groupName, groupOptions]) => {
      result.push(
        <Select.OptGroup key={groupName} label={groupName}>
          {groupOptions.map(renderOptionItem)}
        </Select.OptGroup>,
      );
    });

    if (allowCreate && keyword.trim() && !optionsState.some((opt) => opt.value === keyword.trim())) {
      const prefix =
        typeof createdOptionPrefix === 'function'
          ? createdOptionPrefix({ label: keyword, value: keyword })
          : createdOptionPrefix;
      result.push(
        <Select.Option key={'__create__'} value={keyword.trim()}>
          <span style={{ color: '#165dff' }}>{prefix + '"'.concat(keyword.trim(), '"')}</span>
        </Select.Option>,
      );
    }

    return result;
  }, [groupedOptions, optionRender, showOptionIcon, optionIconRender, allowCreate, keyword, optionsState]);

  const renderTag = useCallback(
    (tagPropsArg: { label: React.ReactNode; value: unknown; onClose: () => void }) => {
      const option = optionsState.find((opt) => opt.value === (tagPropsArg.value as string | number));
      const tagColor = option?.tagColor;

      if (tagRender) {
        return (tagRender as (option: ProSelectOption, onClose: () => void) => React.ReactNode)(
          option || {
            label: tagPropsArg.label,
            value: tagPropsArg.value as string | number,
          },
          tagPropsArg.onClose,
        );
      }

      const mergedStyle = {
        margin: '2px 4px 2px 0' as const,
        ...(tagProps as { style?: React.CSSProperties })?.style,
      };

      return (
        <Tag
          closable
          onClose={tagPropsArg.onClose}
          color={tagColor}
          {...(tagProps as Record<string, unknown>)}
          style={mergedStyle}
        >
          {tagPropsArg.label}
        </Tag>
      );
    },
    [optionsState, tagRender, tagProps],
  );

  const dropdownRender = useCallback(
    (menu: React.ReactNode) => (
      <div style={virtual ? undefined : { maxHeight: 300, overflowY: 'auto' }}>
        {dropdownHeader}
        {showSelectAll && mode === 'multiple' && optionsState.length > 0 && (
          <div style={{ padding: '8px 7px', borderBottom: '1px solid #f0f0f0' }}>
            <Checkbox
              checked={
                Array.isArray(currentValue) &&
                currentValue.length === optionsState.filter((opt) => !opt.disabled).length &&
                currentValue.length > 0
              }
              indeterminate={
                Array.isArray(currentValue) &&
                currentValue.length > 0 &&
                currentValue.length < optionsState.filter((opt) => !opt.disabled).length
              }
              onChange={(checked: boolean) => {
                if (checked) {
                  void selectAll();
                } else {
                  void unselectAll();
                }
              }}
            >
              {Array.isArray(currentValue) && currentValue.length === optionsState.filter((opt) => !opt.disabled).length
                ? unselectAllText
                : selectAllText}
            </Checkbox>
          </div>
        )}
        {menu}
        {/* Sentinel element for IntersectionObserver to detect when user scrolls near the bottom */}
        {pagination && hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}
        {pagination && loading && dropdownOpen && (
          <div style={{ padding: '8px 0', textAlign: 'center' }}>
            <Spin size={14} />
          </div>
        )}
        {pagination && !hasMore && optionsState.length > 0 && (
          <div
            style={{
              padding: '8px 0',
              textAlign: 'center',
              color: '#999',
              fontSize: 12,
            }}
          >
            没有更多数据了
          </div>
        )}
        {dropdownFooter}
      </div>
    ),
    [
      virtual,
      dropdownHeader,
      showSelectAll,
      mode,
      optionsState,
      currentValue,
      selectAll,
      unselectAll,
      selectAllText,
      unselectAllText,
      pagination,
      loading,
      hasMore,
      dropdownOpen,
      dropdownFooter,
    ],
  );

  const renderNotFoundContent = useMemo(() => {
    if (loading && showLoading) {
      return (
        <div style={{ padding: '24px 0', textAlign: 'center' }}>
          <Spin size={14} />
        </div>
      );
    }
    if (emptyRender) {
      return emptyRender;
    }
    return <Empty description={'暂无数据'} />;
  }, [loading, showLoading, emptyRender]);

  return (
    <Select
      ref={selectRef}
      {...(restProps as Record<string, unknown>)}
      mode={mode}
      value={currentValue}
      onChange={handleChange}
      showSearch={effectiveSearch}
      placeholder={placeholder}
      onSearch={effectiveSearch ? handleSearch : undefined}
      onVisibleChange={handleDropdownVisibleChange}
      dropdownRender={dropdownRender}
      notFoundContent={renderNotFoundContent}
      renderTag={(tagMode && mode === 'multiple' ? renderTag : undefined) as SelectProps['renderTag']}
      maxTagCount={maxTagCount}
      filterOption={request ? false : undefined}
      virtualListProps={
        virtual
          ? {
              height: virtualHeight,
              itemHeight: virtualItemHeight,
            }
          : undefined
      }
    >
      {renderOptions}
    </Select>
  );
});

ProSelectComponent.displayName = 'ProSelect';

export const ProSelect = ProSelectComponent;
export type { ProSelectProps, ProSelectInstance, ProSelectOption, ProSelectRequestResult } from './types';
export default ProSelect;
