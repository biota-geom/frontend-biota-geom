import { Link } from 'react-router-dom';
import { BackIcon } from '../ui/icons';

export type BreadcrumbItem = {
  label: string;
  to?: string;
};

type BreadcrumbBarProps = {
  items: BreadcrumbItem[];
};

export function BreadcrumbBar({ items }: BreadcrumbBarProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex min-h-12 items-center border-b border-border bg-surface-muted"
    >
      <ol className="m-0 flex w-full list-none items-center gap-2.5 p-0 max-[640px]:overflow-x-auto">
        <li className="inline-flex text-primary-strong">
          <BackIcon />
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li
              className="inline-flex items-center gap-2.5 text-sm font-bold text-text-primary after:font-medium after:text-text-muted after:content-['/'] last:after:hidden max-[640px]:shrink-0"
              // Stryker disable next-line all: React `key` values aren't part
              // of rendered output, so no behavioral test can observe them.
              key={`${item.label}-${index}`}
            >
              {item.to && !isLast ? (
                <Link
                  className="text-primary-strong underline underline-offset-2"
                  to={item.to}
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-text-primary">{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
