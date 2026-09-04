import * as React from 'react';
import { cn } from '@/utils/cn';

/*
 * Forked from the shadcn generator. The visible chrome (border, height,
 * radius, focus ring) belongs to `InputGroup`; this renders only the inner
 * control, so the stock classes — `h-8 rounded-lg border border-input px-2.5`
 * plus a focus ring — are deliberately gone.
 */
function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'w-full min-w-0 border-0 bg-transparent text-text-primary outline-0 placeholder:text-text-muted',
        className
      )}
      {...props}
    />
  );
}

export { Input };
