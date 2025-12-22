import * as React from 'react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

// Helper function for generating button variant classes
export const buttonVariants = ({ variant = 'default', size = 'default' }: { variant?: ButtonProps['variant']; size?: ButtonProps['size'] } = {}) => {
  return cn(
    'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    {
      'bg-blue-600 text-white hover:bg-blue-700': variant === 'default',
      'border border-gray-300 bg-white hover:bg-gray-50': variant === 'outline',
      'hover:bg-gray-100': variant === 'ghost',
    },
    {
      'h-10 px-4 py-2': size === 'default',
      'h-9 px-3': size === 'sm',
      'h-11 px-8': size === 'lg',
      'h-10 w-10': size === 'icon',
    }
  );
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
