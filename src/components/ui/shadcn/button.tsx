import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';
import { Slot } from 'radix-ui';

/*
 * Forked from the shadcn generator. The stock variants are replaced by the
 * BiotaGeom button styles, transcribed verbatim from the markup they came
 * from so the rendered pixels are unchanged.
 *
 * There is deliberately no shared base string: shadcn's base sets `h-8`,
 * `rounded-lg`, `px-2.5`, `font-medium` and, critically,
 * `[&_svg:not([class*='size-'])]:size-4` — which would shrink every icon in
 * `ui/icons.tsx` from its 20px attribute size to 16px. Every visual decision
 * therefore lives in exactly one variant.
 */
const buttonVariants = cva('', {
  variants: {
    variant: {
      /* Primary form submit — the login/register call to action. */
      primary:
        'rounded-panel min-h-[45px] border-0 bg-primary text-[15px] font-extrabold text-white shadow-control transition-[background-color,transform] duration-[160ms] hover:bg-primary-strong active:translate-y-px focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/30 disabled:cursor-not-allowed disabled:opacity-70',
      /* Page-header action, e.g. "Nova Empresa". */
      action:
        'rounded-panel inline-flex min-h-[38px] items-center justify-center gap-2 border-0 bg-primary px-4 text-sm font-extrabold text-white disabled:cursor-default disabled:opacity-100 max-[720px]:w-full',
      /* Listing filter dropdown trigger. */
      filter:
        'rounded-control inline-flex min-h-[38px] items-center justify-center gap-2 border border-border bg-surface px-4 text-text-secondary disabled:cursor-default disabled:opacity-100',
      /* Header company-context switcher. */
      context:
        'rounded-panel inline-flex min-h-[34px] items-center justify-center gap-2 border border-border bg-surface-muted px-3 text-[13px] font-bold text-text-primary disabled:cursor-default disabled:opacity-100',
      /* Low-emphasis bordered action, e.g. "Sair". */
      subtle:
        'rounded border border-border px-2.5 py-1.5 text-[13px] font-semibold text-text-secondary hover:bg-surface-muted hover:text-text-primary',
      /* Borderless icon button sitting inside a field, e.g. reveal password. */
      iconGhost:
        'rounded-control grid size-8 shrink-0 place-items-center border-0 bg-transparent p-0 text-text-muted hover:bg-surface-muted hover:text-text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
      /* Circular header icon button, e.g. notifications. */
      iconRound:
        'relative inline-flex size-[38px] items-center justify-center rounded-full border border-border bg-surface-muted text-text-secondary disabled:cursor-default disabled:opacity-100',
      /* Tinted icon button on a card header, e.g. edit. */
      iconSoft:
        'rounded-control grid size-[26px] place-items-center border-0 bg-[#d8f8ea] p-0 text-primary-strong disabled:cursor-default disabled:opacity-100',
      /* Destructive counterpart of `iconSoft`, e.g. delete. */
      iconDanger:
        'rounded-control grid size-[26px] place-items-center border-0 bg-red-100 p-0 text-red-500 disabled:cursor-default disabled:opacity-100',
    },
  },
});

type ButtonVariant = NonNullable<
  VariantProps<typeof buttonVariants>['variant']
>;

/*
 * `variant` is required rather than defaulted: these styles are page-specific,
 * so silently falling back to one of them would hide a mistake at the call
 * site instead of surfacing it at the type level.
 */
function Button({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> & {
  asChild?: boolean;
  variant: ButtonVariant;
}) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      className={cn(buttonVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants, type ButtonVariant };
