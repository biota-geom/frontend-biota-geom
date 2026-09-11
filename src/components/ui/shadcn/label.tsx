import * as React from 'react';
import { cn } from '@/utils/cn';
import { Label as LabelPrimitive } from 'radix-ui';

/*
 * Forked from the shadcn generator: same Radix primitive, but carrying the
 * BiotaGeom field-label type scale instead of the stock `text-sm font-medium`.
 */
function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn('text-[13px] font-bold text-text-primary', className)}
      {...props}
    />
  );
}

export { Label };
