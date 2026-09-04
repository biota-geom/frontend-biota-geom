import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

/*
 * Forked from the shadcn generator. The stock card is a `div` shell driven by
 * a `--card-spacing` variable, `rounded-xl`, a `ring-1` border, an
 * `overflow-hidden` body and a `@container` header grid — none of which this
 * product's card uses. Every class string below is transcribed verbatim from
 * the markup it replaces, and each part renders the semantic element that
 * markup already used (`article`, `header`, `h2`, `p`, `dl`, `footer`).
 *
 * As with `Button`, `variant` is required and every visual decision lives in
 * it — including the ones that look per-instance (`max-[520px]:p-5`, the
 * `[&_dd]:…` metric styling). They describe this card, and keeping them here
 * means a call site never passes a `className` that tailwind-merge could
 * silently resolve against them.
 */
const cardVariants = cva('', {
  variants: {
    variant: {
      /* Admin company listing card. */
      company:
        'rounded-panel flex min-h-[230px] flex-col border border-border-strong bg-surface p-6 shadow-control max-[520px]:p-5',
    },
  },
});

type CardVariant = NonNullable<VariantProps<typeof cardVariants>['variant']>;

const cardHeaderVariants = cva('', {
  variants: {
    variant: {
      company:
        'flex justify-between gap-4 border-b border-border pb-[18px] max-[520px]:flex-col max-[520px]:items-start',
    },
  },
});

const cardTitleVariants = cva('', {
  variants: {
    variant: {
      company: 'm-0 text-xl leading-[1.2] font-bold text-text-primary',
    },
  },
});

const cardDescriptionVariants = cva('', {
  variants: {
    variant: {
      company: 'mt-1 mb-0 text-[13px] leading-[1.45] text-text-secondary',
    },
  },
});

const cardActionVariants = cva('', {
  variants: {
    variant: {
      company: 'flex items-start gap-[9px]',
    },
  },
});

const cardContentVariants = cva('', {
  variants: {
    variant: {
      company:
        'm-0 grid grid-cols-4 gap-3.5 border-b border-border px-0 pt-5 pb-[18px] [&_dd]:m-0 [&_dd]:flex [&_dd]:items-center [&_dd]:gap-[7px] [&_dd]:text-[21px] [&_dd]:leading-none [&_dd]:font-extrabold [&_dd]:text-text-primary [&_div]:min-w-0 [&_dt]:mb-1.5 [&_dt]:text-xs [&_dt]:text-text-muted max-[520px]:grid-cols-2',
    },
  },
});

const cardFooterVariants = cva('', {
  variants: {
    variant: {
      company:
        'mt-auto flex items-center justify-between gap-4 pt-5 text-[13px] text-text-secondary max-[520px]:flex-col max-[520px]:items-start',
    },
  },
});

function Card({
  className,
  variant,
  ...props
}: React.ComponentProps<'article'> & { variant: CardVariant }) {
  return (
    <article
      data-slot="card"
      data-variant={variant}
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  );
}

function CardHeader({
  className,
  variant,
  ...props
}: React.ComponentProps<'header'> & { variant: CardVariant }) {
  return (
    <header
      data-slot="card-header"
      data-variant={variant}
      className={cn(cardHeaderVariants({ variant }), className)}
      {...props}
    />
  );
}

function CardTitle({
  className,
  variant,
  ...props
}: React.ComponentProps<'h2'> & { variant: CardVariant }) {
  return (
    <h2
      data-slot="card-title"
      data-variant={variant}
      className={cn(cardTitleVariants({ variant }), className)}
      {...props}
    />
  );
}

function CardDescription({
  className,
  variant,
  ...props
}: React.ComponentProps<'p'> & { variant: CardVariant }) {
  return (
    <p
      data-slot="card-description"
      data-variant={variant}
      className={cn(cardDescriptionVariants({ variant }), className)}
      {...props}
    />
  );
}

/* Trailing cluster of a `CardHeader`: status badge plus row actions. */
function CardAction({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & { variant: CardVariant }) {
  return (
    <div
      data-slot="card-action"
      data-variant={variant}
      className={cn(cardActionVariants({ variant }), className)}
      {...props}
    />
  );
}

/* Renders a `dl`: the card body is a description list of metrics. */
function CardContent({
  className,
  variant,
  ...props
}: React.ComponentProps<'dl'> & { variant: CardVariant }) {
  return (
    <dl
      data-slot="card-content"
      data-variant={variant}
      className={cn(cardContentVariants({ variant }), className)}
      {...props}
    />
  );
}

function CardFooter({
  className,
  variant,
  ...props
}: React.ComponentProps<'footer'> & { variant: CardVariant }) {
  return (
    <footer
      data-slot="card-footer"
      data-variant={variant}
      className={cn(cardFooterVariants({ variant }), className)}
      {...props}
    />
  );
}

export {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  cardVariants,
  type CardVariant,
};
