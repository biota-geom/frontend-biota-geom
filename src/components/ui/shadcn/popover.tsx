import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';
import { Popover as PopoverPrimitive } from 'radix-ui';

// Forked for the notification panel; dimensions and styling live in the variant.
const contentVariants = cva('', {
  variants: {
    variant: {
      notifications:
        'z-50 flex max-h-[min(36rem,var(--radix-popover-content-available-height))] w-[min(25rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-panel border border-border bg-surface text-text-primary shadow-card outline-none motion-safe:duration-150 motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:fade-in-0 motion-safe:data-[state=closed]:animate-out motion-safe:data-[state=closed]:fade-out-0',
    },
  },
});

function Popover({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverContent({
  className,
  variant,
  align = 'center',
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content> & {
  variant: NonNullable<VariantProps<typeof contentVariants>['variant']>;
}) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(contentVariants({ variant }), className)}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

function PopoverClose(
  props: React.ComponentProps<typeof PopoverPrimitive.Close>
) {
  return <PopoverPrimitive.Close data-slot="popover-close" {...props} />;
}

export { Popover, PopoverContent, PopoverClose, PopoverTrigger };
