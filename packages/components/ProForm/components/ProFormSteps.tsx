import React, { useState, useCallback, forwardRef, useImperativeHandle, useRef } from 'react';
import { Steps, Button, Space } from '@arco-design/web-react';
import { ProForm } from '../index';
import type { ProFormInstance } from '../types';
import type { ProFormStepsProps, ProFormStepsInstance, ProFormStepSchema } from './types';

const { Step } = Steps;
/**
 * 分步表单（ProFormSteps）
 *
 * 将复杂表单拆分为多个步骤，引导用户逐步完成填写。
 * 每步可以配置独立的 Schema 和标题。
 *
 * 特性：
 * - 步骤导航（Steps 组件）
 * - 上一步/下一步切换
 * - 支持步骤验证（validateOnNext / validateStep）
 * - 命令式步骤控制（prev / next / goTo / reset / submit）
 * - 横向/垂直布局
 * - 重置按钮与自定义提交回调
 * - 支持受控/非受控双模式（步骤索引）
 * - 支持独立使用（内部自动创建 FormStore）
 *
 * 受控模式：提供 current prop，步骤索引由父组件控制，所有变更通过 onChange 回调通知父组件。
 * 非受控模式：不提供 current prop，步骤索引由组件内部 state 主导。
 *
 * 实现说明：
 * 每步通过内嵌一个 <ProForm> 渲染该步字段，并通过 ref 获取内嵌实例，
 * 使 validateStep / submit / reset 能精确作用于当前步的字段。
 * 内部 <ProForm> 会自动创建 FormStore，因此可独立使用无需父级 ProForm 包裹。
 *
 * @example
 * ```tsx
 * // 独立使用（推荐）
 * <ProFormSteps
 *   steps={[
 *     { title: '基本信息', schemas: [basicSchemas] },
 *     { title: '联系方式', schemas: [contactSchemas] },
 *   ]}
 *   onFinish={(values) => console.log(values)}
 * />
 *
 * // 受控模式
 * <ProFormSteps
 *   steps={steps}
 *   current={currentStep}
 *   onChange={(val) => setCurrentStep(val)}
 *   onFinish={(values) => console.log(values)}
 * />
 * ```
 */
export const ProFormSteps = forwardRef<ProFormStepsInstance, ProFormStepsProps>(
  (
    {
      steps,
      current: controlledCurrent,
      defaultCurrent = 0,
      onChange,
      onStepChange,
      prevText = '上一步',
      nextText = '下一步',
      submitText = '提交',
      validateOnNext = true,
      showSteps = true,
      direction = 'horizontal',
      stepsProps,
      showButton = true,
      // 新增 props
      onFinish,
      showResetButton = false,
      resetText = '重置',
      onReset,
      className,
      style,
      ...restProps
    },
    ref,
  ) => {
    const [innerCurrent, setInnerCurrent] = useState(defaultCurrent);
    // 内嵌 ProForm 实例，用于精确校验/提交当前步字段
    const innerFormRef = useRef<ProFormInstance>(null);

    const isControlled = typeof controlledCurrent !== 'undefined';
    const current = isControlled ? controlledCurrent : innerCurrent;

    const setCurrent = useCallback(
      (next: number) => {
        if (!isControlled) {
          setInnerCurrent(next);
        }
        onChange?.(next);
      },
      [isControlled, onChange],
    );

    // ========== 步骤校验 ==========
    /**
     * 校验指定步骤的所有字段，返回是否全部通过。
     * 默认校验当前步；通过内嵌实例的 store 访问 FieldNode。
     */
    const validateStep = useCallback(
      async (index?: number): Promise<boolean> => {
        const stepIndex = index ?? current;
        const step = steps[stepIndex];
        if (!step) return true;
        const store = innerFormRef.current?.store;
        if (!store) return true;
        let hasError = false;
        for (const s of step.schemas) {
          const fName = Array.isArray(s.name) ? s.name[0] : s.name;
          const field = store.getField(fName);
          if (field) {
            const error = await field.validate();
            if (error) hasError = true;
          }
        }
        return !hasError;
      },
      [steps, current],
    );

    // ========== 提交 ==========
    const submit = useCallback(async () => {
      const values = innerFormRef.current?.getFieldsValue() ?? {};
      await onFinish?.(values);
    }, [onFinish]);

    // ========== 步骤切换 ==========
    const handlePrev = useCallback(() => {
      const next = Math.max(0, current - 1);
      onStepChange?.(current, next);
      setCurrent(next);
    }, [current, setCurrent, onStepChange]);

    const handleNext = useCallback(async () => {
      // 最后一步：触发提交
      if (current >= steps.length - 1) {
        await submit();
        return;
      }
      if (validateOnNext) {
        const ok = await validateStep(current);
        if (!ok) return;
      }
      const next = Math.min(steps.length - 1, current + 1);
      onStepChange?.(current, next);
      setCurrent(next);
    }, [current, steps.length, validateOnNext, validateStep, setCurrent, onStepChange, submit]);

    const handleGoTo = useCallback(
      (index: number) => {
        if (index >= 0 && index < steps.length) {
          onStepChange?.(current, index);
          setCurrent(index);
        }
      },
      [steps.length, current, setCurrent, onStepChange],
    );

    // ========== 重置 ==========
    const reset = useCallback(() => {
      setCurrent(0);
      innerFormRef.current?.clearValidate();
      onReset?.();
    }, [setCurrent, onReset]);

    // ========== 命令式 ref ==========
    useImperativeHandle(
      ref,
      (): ProFormStepsInstance => ({
        prev: handlePrev,
        next: handleNext,
        goTo: handleGoTo,
        getCurrent: () => current,
        getStep: (index: number): ProFormStepSchema | undefined => steps[index],
        getSteps: (): ProFormStepSchema[] => steps,
        validateStep,
        reset,
        submit,
      }),
      [handlePrev, handleNext, handleGoTo, current, steps, validateStep, reset, submit],
    );

    const currentStep = steps[current];

    const renderSteps = () => {
      if (!showSteps) {
        return null;
      }
      return (
        <Steps
          current={current}
          direction={direction}
          {...(stepsProps as Record<string, unknown>)}
          style={{ marginBottom: 24 }}
        >
          {steps.map((step, index) => (
            <Step key={index} title={step.title} description={step.description} />
          ))}
        </Steps>
      );
    };

    const renderButtons = () => {
      if (!showButton) {
        return null;
      }
      return (
        <Space
          style={{
            marginTop: 24,
            justifyContent: 'flex-end',
            width: '100%',
            display: 'flex',
          }}
        >
          {showResetButton && <Button onClick={reset}>{resetText}</Button>}
          {current > 0 && <Button onClick={handlePrev}>{prevText}</Button>}
          {current < steps.length - 1 ? (
            <Button type='primary' onClick={handleNext}>
              {nextText}
            </Button>
          ) : (
            <Button type='primary' onClick={submit}>
              {submitText}
            </Button>
          )}
        </Space>
      );
    };

    return (
      <div className={className} style={style}>
        {renderSteps()}
        <ProForm ref={innerFormRef} {...restProps} schemas={currentStep?.schemas || []} showButton={false} />
        {renderButtons()}
      </div>
    );
  },
);

ProFormSteps.displayName = 'ProFormSteps';
