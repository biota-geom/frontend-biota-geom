import { type ReactNode } from 'react';
import { BreadcrumbBar, type BreadcrumbItem } from './BreadcrumbBar';
import styles from './PageScaffold.module.css';

type PageAction = {
  icon?: 'plus' | 'none';
  label: string;
};

type PageScaffoldProps = {
  actions?: PageAction[];
  breadcrumbs?: BreadcrumbItem[];
  children: ReactNode;
  subtitle: string;
  title: string;
};

function PlusIcon() {
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
        d="M12 5V19M5 12H19"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.5"
      />
    </svg>
  );
}

export function PageScaffold({
  actions = [],
  breadcrumbs,
  children,
  subtitle,
  title,
}: PageScaffoldProps) {
  const breadcrumbItems = breadcrumbs ?? [];
  const hasBreadcrumbs = breadcrumbItems.length > 0;
  const pageClassName = [
    styles.page,
    hasBreadcrumbs ? '' : styles.pageWithoutBreadcrumbs,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      {hasBreadcrumbs ? (
        <div className={styles.breadcrumbWrap}>
          <BreadcrumbBar items={breadcrumbItems} />
        </div>
      ) : null}
      <main className={pageClassName}>
        <div className={styles.inner}>
          <header className={styles.header}>
            <div>
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>

            {actions.length > 0 ? (
              <div className={styles.actions}>
                {actions.map((action) => (
                  <button
                    className={styles.primaryAction}
                    disabled
                    key={action.label}
                    type="button"
                  >
                    {action.icon === 'none' ? null : <PlusIcon />}
                    {action.label}
                  </button>
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
