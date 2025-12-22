import { useState } from 'react';
import type { AppointmentStep, StepOptions } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';

interface GuiComponentsProps {
  step: AppointmentStep;
  options: StepOptions;
  isActive: boolean;
  selectedValue: string | undefined;
  onSelect: (step: AppointmentStep, value: string, label: string) => void;
}

export function GuiComponents({
  step,
  options,
  isActive,
  selectedValue,
  onSelect,
}: GuiComponentsProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  // ButtonGroup
  if (options.component === 'ButtonGroup' && options.options) {
    return (
      <div className="mt-3 flex flex-wrap gap-2">
        {options.options.map((option) => {
          const isSelected = selectedValue === option.value;
          return (
            <Button
              key={option.value}
              onClick={() => {
                if (isActive && !isProcessing) {
                  setIsProcessing(true);
                  onSelect(step, option.value, option.label);
                }
              }}
              variant={isSelected ? 'default' : 'outline'}
              disabled={!isActive || isProcessing}
              className={!isActive || isProcessing ? 'cursor-default' : ''}
            >
              {option.label}
            </Button>
          );
        })}
      </div>
    );
  }

  // Select
  if (options.component === 'Select' && options.options) {
    const handleSelectChange = (value: string) => {
      if (isActive && !isProcessing) {
        const selectedOption = options.options?.find((opt) => opt.value === value);
        if (selectedOption) {
          setIsProcessing(true);
          onSelect(step, value, selectedOption.label);
        }
      }
    };

    return (
      <div className="mt-3">
        <Select
          onValueChange={handleSelectChange}
          value={selectedValue}
          disabled={!isActive || isProcessing}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select an option..." />
          </SelectTrigger>
          <SelectContent>
            {options.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Input
  if (options.component === 'Input') {
    if (!isActive && selectedValue) {
      return (
        <div className="mt-3">
          <Input type="text" value={selectedValue} disabled className="cursor-default max-w-[200px]" />
        </div>
      );
    }

    if (isActive) {
      const handleInputSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (isProcessing) return;

        const target = e.currentTarget;
        const value = target.value.trim();
        if (value) {
          setIsProcessing(true);
          onSelect(step, value, value);
          target.value = '';
        }
      };

      return (
        <div className="mt-3">
          <Input
            type="text"
            placeholder={options.placeholder}
            disabled={isProcessing}
            className="max-w-[200px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleInputSubmit(e);
              }
            }}
          />
        </div>
      );
    }
    return null;
  }

  // Calendar
  if (options.component === 'Calendar') {
    const handleDateSelect = (date: Date | undefined) => {
      if (isActive && !isProcessing && date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;
        setIsProcessing(true);
        onSelect(step, dateString, dateString);
      }
    };

    const selectedDate = selectedValue ? new Date(selectedValue + 'T00:00:00') : undefined;
    const minDate = options.calendarProps?.minDate
      ? new Date(options.calendarProps.minDate + 'T00:00:00')
      : new Date();
    const disabledDaysOfWeek = options.calendarProps?.disabledDaysOfWeek || [];

    if (!isActive && selectedValue) {
      return (
        <div className="mt-3 text-sm text-gray-600">
          Selected date: <span className="font-medium">{selectedValue}</span>
        </div>
      );
    }

    return (
      <div className="mt-3">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          disabled={(date) => {
            if (isProcessing) return true;
            if (date < minDate) return true;
            if (disabledDaysOfWeek.includes(date.getDay())) return true;
            return false;
          }}
          className="rounded-lg border"
        />
      </div>
    );
  }

  return null;
}
