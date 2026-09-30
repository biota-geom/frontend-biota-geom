import * as React from 'react';
import { cn } from '@/utils/cn';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'rounded-control min-h-24 w-full resize-y border border-border bg-surface px-2.5 py-2 text-text-primary shadow-control outline-0 transition-[border-color,box-shadow] duration-[160ms] placeholder:text-text-muted focus:border-focus focus:shadow-[0_0_0_3px_rgba(59,130,246,0.14)] aria-invalid:border-destructive aria-invalid:shadow-[0_0_0_3px_rgba(180,35,24,0.12)]',
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
