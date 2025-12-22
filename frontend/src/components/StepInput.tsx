import { useState } from 'react';
import type { StepOptions } from '../types';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface StepInputProps {
  options: StepOptions;
  onSubmit: (value: string) => void;
}

export function StepInput({ options, onSubmit }: StepInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSubmit(inputValue.trim());
      setInputValue('');
    }
  };

  // Input component
  if (options.component === 'Input') {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="text"
          placeholder={options.placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="flex-1"
        />
        <Button type="submit">Send</Button>
      </form>
    );
  }

  // ButtonGroup component - simple buttons that submit immediately
  if (options.component === 'ButtonGroup' && options.options) {
    return (
      <div className="flex flex-wrap gap-2">
        {options.options.map((option) => (
          <Button
            key={option.value}
            onClick={() => onSubmit(option.value)}
            variant="outline"
          >
            {option.label}
          </Button>
        ))}
      </div>
    );
  }

  // Select component
  if (options.component === 'Select' && options.options) {
    return (
      <Select onValueChange={onSubmit}>
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
    );
  }

  // Calendar component - for now, use a simple date input
  if (options.component === 'Calendar') {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="date"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          min={options.calendarProps?.minDate}
          className="flex-1"
        />
        <Button type="submit">Send</Button>
      </form>
    );
  }

  return null;
}
