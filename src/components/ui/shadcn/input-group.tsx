import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

/*
 * Forked from the shadcn generator. Fields in this product are composites —
 * a bordered shell that owns the focus ring, an inline icon, and a
 * chrome-less input — so the shell lives here and `Input` renders only the
 * inner control. Classes are transcribed verbatim from the markup they
 * replace; the stock shadcn styling would change height, radius and ring.
 */
const inputGroupVariants = cva(
  'rounded-control flex items-center gap-2.5 px-2.5',
  {
    variants: {
      variant: {
        /* Labelled form field (login, register). */
        field:
          'min-h-[42px] border border-border bg-surface text-text-muted shadow-control transition-[border-color,box-shadow] duration-[160ms] focus-within:border-focus focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.14)]',
        /* Filter-bar search box: no border, sits on the muted surface. */
        search: 'min-h-[38px] bg-surface-muted text-text-secondary',
      },
    },
  }
);

type InputGroupVariant = NonNullable<
  VariantProps<typeof inputGroupVariants>['variant']
>;

/*
 * `as` exists because the search box wraps its own control and is a <label>,
 * while form fields are <div>s paired with an external <label htmlFor>.
 */
function InputGroup({
  as = 'div',
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  as?: 'div' | 'label';
  variant: InputGroupVariant;
}) {
  // Widened to ElementType: a `'div' | 'label'` union makes TS resolve the
  // intrinsic props (and `ref`) to an impossible intersection.
  const Comp = as as React.ElementType;

  return (
    <Comp
      data-slot="input-group"
      data-variant={variant}
      className={cn(inputGroupVariants({ variant }), className)}
      {...props}
    />
  );
}

/* Inline icon slot inside a `field` shell. */
function InputGroupAddon({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="input-group-addon"
      className={cn('shrink-0 text-text-muted', className)}
      {...props}
    />
  );
}

export {
  InputGroup,
  InputGroupAddon,
  inputGroupVariants,
  type InputGroupVariant,
};
