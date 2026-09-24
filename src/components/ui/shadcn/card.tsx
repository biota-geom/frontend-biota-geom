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
      /* Summary metric card (e.g. the licenses panel's Total/Regulares/... row). */
      stat: 'rounded-panel flex flex-col gap-2 border bg-surface p-5 shadow-control',
    },
  },
});

type CardVariant = NonNullable<VariantProps<typeof cardVariants>['variant']>;

/*
 * Color axis for `variant: "stat"` cards: each instance is one of a fixed set
 * of semantic tones (its border here, its value's text color below) rather
 * than an ad hoc className, so a call site can never drift from the palette.
 */
const cardToneVariants = cva('', {
  variants: {
    tone: {
      total: 'border-blue-200',
      regular: 'border-[#a6e9c9]',
      attention: 'border-amber-200',
      expired: 'border-red-200',
    },
  },
});

const cardValueToneVariants = cva('', {
  variants: {
    tone: {
      total: 'text-blue-700',
      regular: 'text-primary-strong',
      attention: 'text-amber-600',
      expired: 'text-red-600',
    },
  },
});

type CardTone = NonNullable<VariantProps<typeof cardToneVariants>['tone']>;

const cardHeaderVariants = cva('', {
  variants: {
    variant: {
      company:
        'flex justify-between gap-4 border-b border-border pb-[18px] max-[520px]:flex-col max-[520px]:items-start',
      /* Stat cards don't use CardHeader; entry only keeps CardVariant total. */
      stat: '',
    },
  },
});

const cardTitleVariants = cva('', {
  variants: {
    variant: {
      company: 'm-0 text-xl leading-[1.2] font-bold text-text-primary',
      /* The large tone-colored number; tone applied separately, see Card. */
      stat: 'm-0 text-3xl leading-[1.2] font-bold',
    },
  },
});

const cardDescriptionVariants = cva('', {
  variants: {
    variant: {
      company: 'mt-1 mb-0 text-[13px] leading-[1.45] text-text-secondary',
      stat: 'm-0 text-sm font-semibold text-text-secondary',
    },
  },
});

const cardActionVariants = cva('', {
  variants: {
    variant: {
      company: 'flex items-start gap-[9px]',
      /* Stat cards don't use CardAction; entry only keeps CardVariant total. */
      stat: '',
    },
  },
});

const cardContentVariants = cva('', {
  variants: {
    variant: {
      company:
        'm-0 grid grid-cols-4 gap-3.5 border-b border-border px-0 pt-5 pb-[18px] [&_dd]:m-0 [&_dd]:flex [&_dd]:items-center [&_dd]:gap-[7px] [&_dd]:text-[21px] [&_dd]:leading-none [&_dd]:font-extrabold [&_dd]:text-text-primary [&_div]:min-w-0 [&_dt]:mb-1.5 [&_dt]:text-xs [&_dt]:text-text-muted max-[520px]:grid-cols-2',
      /* Stat cards don't use CardContent; entry only keeps CardVariant total. */
      stat: '',
    },
  },
});

const cardFooterVariants = cva('', {
  variants: {
    variant: {
      company:
        'mt-auto flex items-center justify-between gap-4 pt-5 text-[13px] text-text-secondary max-[520px]:flex-col max-[520px]:items-start',
      /* Stat cards don't use CardFooter; entry only keeps CardVariant total. */
      stat: '',
    },
  },
});

function Card({
  className,
  variant,
  tone,
  ...props
}: React.ComponentProps<'article'> & {
  variant: CardVariant;
  /** Only meaningful for `variant: "stat"`; ignored otherwise. */
  tone?: CardTone;
}) {
  return (
    <article
      data-slot="card"
      data-variant={variant}
      data-tone={tone}
      className={cn(
        cardVariants({ variant }),
        tone && cardToneVariants({ tone }),
        className
      )}
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
  tone,
  ...props
}: React.ComponentProps<'h2'> & {
  variant: CardVariant;
  /** Only meaningful for `variant: "stat"`; ignored otherwise. */
  tone?: CardTone;
}) {
  return (
    <h2
      data-slot="card-title"
      data-variant={variant}
      className={cn(
        cardTitleVariants({ variant }),
        tone && cardValueToneVariants({ tone }),
        className
      )}
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
  type CardTone,
  type CardVariant,
};
