import { type ReactNode } from 'react';
import { Button } from '@/components/ui/shadcn/button';
import { PlusIcon } from '../ui/icons';
import { BreadcrumbBar, type BreadcrumbItem } from './BreadcrumbBar';

type PageAction = {
  icon?: 'plus' | 'none';
  label: string;
  onClick?: () => void;
};

type PageScaffoldProps = {
  actions?: PageAction[];
  breadcrumbs?: BreadcrumbItem[];
  children: ReactNode;
  subtitle: string;
  title: string;
  /**
   * Supporting node rendered beside the title, such as a record count. It is
   * a sibling of the `<h1>`, never part of it, so the page heading keeps the
   * title as its accessible name.
   */
  titleAside?: ReactNode;
};

export function PageScaffold({
  actions = [],
  breadcrumbs,
  children,
  subtitle,
  title,
  titleAside,
}: PageScaffoldProps) {
  const breadcrumbItems = breadcrumbs ?? [];
  const hasBreadcrumbs = breadcrumbItems.length > 0;
  const pageClassName = [
    hasBreadcrumbs ? 'min-h-[calc(100svh-121px)]' : 'min-h-[calc(100svh-72px)]',
    'bg-background px-10 pt-[42px] pb-16 max-[720px]:px-4 max-[720px]:pt-8 max-[720px]:pb-12',
  ].join(' ');

  return (
    <>
      {hasBreadcrumbs ? (
        <div className="border-b border-border bg-surface-muted px-10 max-[720px]:px-4">
          <BreadcrumbBar items={breadcrumbItems} />
        </div>
      ) : null}
      <main className={pageClassName}>
        <div className="mx-auto w-full">
          <header className="mb-8 flex items-start justify-between gap-6 max-[720px]:flex-col">
            <div>
              {/* Stryker disable next-line all: styling-only wrapper class, untested on purpose (see README) */}
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="m-0 text-3xl leading-[1.2] font-bold text-text-primary">
                  {title}
                </h1>
                {/* Undefined renders nothing, so pages that pass no aside keep
                the previous markup. */}
                {titleAside}
              </div>
              <p className="mt-1.5 mb-0 text-[15px] leading-[1.45] text-text-secondary">
                {subtitle}
              </p>
            </div>

            {/* With the default `actions = []`, an empty wrapper div and
            `null` render nothing visible either way — untested on purpose,
            see README. */}
            {actions.length > 0 ? (
              <div className="flex items-center gap-3 pt-1.5 max-[720px]:w-full">
                {actions.map((action) => (
                  <Button
                    className="rounded-panel inline-flex min-h-[38px] items-center justify-center gap-2 border-0 bg-primary px-4 text-sm font-extrabold text-white disabled:cursor-default disabled:opacity-100 max-[720px]:w-full"
                    key={action.label}
                    onClick={action.onClick}
                    type="button"
                    variant="action"
                  >
                    {action.icon === 'none' ? null : <PlusIcon />}
                    {action.label}
                  </Button>
                ))}
              </div>
            ) : null}
          </header>

          {children}
        </div>
      </main>
    </>
  );
}
