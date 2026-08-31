import { Link } from 'react-router-dom';

export type BreadcrumbItem = {
  label: string;
  to?: string;
};

type BreadcrumbBarProps = {
  items: BreadcrumbItem[];
};

function BackIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="18"
      viewBox="0 0 24 24"
      width="18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M15 6L9 12L15 18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

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
