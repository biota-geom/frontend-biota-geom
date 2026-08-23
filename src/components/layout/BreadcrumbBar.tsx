import { Link } from 'react-router-dom';
import styles from './BreadcrumbBar.module.css';

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
    <nav aria-label="Breadcrumb" className={styles.bar}>
      <ol className={styles.list}>
        <li className={styles.backIcon}>
          <BackIcon />
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li className={styles.item} key={`${item.label}-${index}`}>
              {item.to && !isLast ? (
                <Link className={styles.link} to={item.to}>
                  {item.label}
                </Link>
              ) : (
                <span className={styles.current}>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
