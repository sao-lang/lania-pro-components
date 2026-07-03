/**
 * 分步表单（ProFormSteps）
 *
 * 将复杂表单拆分为多个步骤，引导用户逐步完成填写。
 * 每步可以配置独立的 Schema 和标题。
 *
 * 特性：
 * - 步骤导航（Steps 组件）
 * - 上一步/下一步切换
 * - 支持步骤验证（validateOnNext）
 * - 命令式步骤控制（prev / next / goTo）
 * - 横向/垂直布局
 *
 * @example
 * ```tsx
 * <ProForm
 *   schemas={[...]}
 * >
 *   <ProFormSteps
 *     steps={[
 *       { title: '基本信息', schemas: [basicSchemas] },
 *       { title: '联系方式', schemas: [contactSchemas] },
 *     ]}
 *   />
 * </ProForm>
 * ```
 */
import React, { FC, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Steps, Button, Space } from '@arco-design/web-react';
import { ProForm } from '../index';
import { useProFormContext } from '../useProForm';
import type { ProFormStepsProps, ProFormStepsInstance } from './types';

const { Step } = Steps;

const ProFormStepsComponent = () => {
  const Component: FC<ProFormStepsProps> = forwardRef<ProFormStepsInstance, ProFormStepsProps>(
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
        ...restProps
      },
      ref,
    ) => {
      const [innerCurrent, setInnerCurrent] = useState(defaultCurrent);
      const { formStore } = useProFormContext();

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

      const handlePrev = useCallback(() => {
        const next = Math.max(0, current - 1);
        onStepChange?.(current, next);
        setCurrent(next);
      }, [current, setCurrent, onStepChange]);

      const handleNext = useCallback(async () => {
        if (validateOnNext && formStore) {
          // 验证当前步骤的所有字段
          const currentStepSchemas = steps[current]?.schemas || [];
          const fieldNames = currentStepSchemas.map((s) => s.name);
          let hasError = false;

          for (const fieldName of fieldNames) {
            const field = formStore.getField(fieldName);
            if (field) {
              const error = await field.validate();
              if (error) {
                hasError = true;
              }
            }
          }

          if (hasError) {
            return;
          }
        }
        const next = Math.min(steps.length - 1, current + 1);
        onStepChange?.(current, next);
        setCurrent(next);
      }, [current, steps, setCurrent, validateOnNext, formStore, onStepChange]);

      const handleGoTo = useCallback(
        (index: number) => {
          if (index >= 0 && index < steps.length) {
            onStepChange?.(current, index);
            setCurrent(index);
          }
        },
        [steps.length, current, setCurrent, onStepChange],
      );

      useImperativeHandle(ref, () => ({
        prev: handlePrev,
        next: handleNext,
        goTo: handleGoTo,
        getCurrent: () => current,
      }));

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
            {current > 0 && <Button onClick={handlePrev}>{prevText}</Button>}
            {current < steps.length - 1 ? (
              <Button type='primary' onClick={handleNext}>
                {nextText}
              </Button>
            ) : (
              <Button type='primary' htmlType='submit'>
                {submitText}
              </Button>
            )}
          </Space>
        );
      };

      return (
        <div>
          {renderSteps()}
          <ProForm {...restProps} schemas={currentStep.schemas} showButton={false} />
          {renderButtons()}
        </div>
      );
    },
  );

  Component.displayName = 'ProFormSteps';
  return Component;
};

export const ProFormSteps = ProFormStepsComponent();
