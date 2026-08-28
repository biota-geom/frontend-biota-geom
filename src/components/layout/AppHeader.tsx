import { Link, NavLink } from 'react-router-dom';
import { APP_ROUTES } from '../../app/router/routes';
import { useAuth } from '../../features/auth/useAuth';
import { BiotaLogo } from '../ui/BiotaLogo';
import styles from './AppHeader.module.css';

export type AppNavigationItem = {
  end?: boolean;
  label: string;
  to: string;
};

type AppHeaderProps = {
  contextLabel?: string;
  navItems: AppNavigationItem[];
};

function BuildingIcon() {
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
        d="M7 20.25V4.75H17V20.25"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M4.75 20.25H19.25"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M10 8.25H14M10 12.25H14M10 16.25H14"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="16"
      viewBox="0 0 24 24"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7 10L12 15L17 10"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function SettingsIcon() {
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
        d="M12 15.25C13.795 15.25 15.25 13.795 15.25 12C15.25 10.205 13.795 8.75 12 8.75C10.205 8.75 8.75 10.205 8.75 12C8.75 13.795 10.205 15.25 12 15.25Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M18.25 12C18.25 11.55 18.2 11.12 18.11 10.7L20.15 9.12L18.15 5.65L15.73 6.62C15.08 6.12 14.35 5.75 13.55 5.54L13.25 3H9.25L8.95 5.54C8.15 5.75 7.42 6.12 6.77 6.62L4.35 5.65L2.35 9.12L4.39 10.7C4.3 11.12 4.25 11.55 4.25 12C4.25 12.45 4.3 12.88 4.39 13.3L2.35 14.88L4.35 18.35L6.77 17.38C7.42 17.88 8.15 18.25 8.95 18.46L9.25 21H13.25L13.55 18.46C14.35 18.25 15.08 17.88 15.73 17.38L18.15 18.35L20.15 14.88L18.11 13.3C18.2 12.88 18.25 12.45 18.25 12Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="19"
      viewBox="0 0 24 24"
      width="19"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6.75 10.8C6.75 7.9 8.5 5.75 12 5.75C15.5 5.75 17.25 7.9 17.25 10.8V15.25L19 17H5L6.75 15.25V10.8Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M10 19.25C10.44 19.86 11.15 20.25 12 20.25C12.85 20.25 13.56 19.86 14 19.25"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const initials =
    parts.length > 1 ? [parts[0], parts[parts.length - 1]] : parts;
  return initials.map((part) => part.charAt(0).toUpperCase()).join('');
}

export function AppHeader({ contextLabel, navItems }: AppHeaderProps) {
  const user = useAuth((state) => state.user);
  const logout = useAuth((state) => state.logout);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link className={styles.logoLink} to={APP_ROUTES.admin.companies}>
          <BiotaLogo />
        </Link>

        <nav aria-label="Navegação principal" className={styles.nav}>
          {navItems.map((item) => (
            <NavLink
              className={({ isActive }) =>
                [styles.navLink, isActive ? styles.activeNavLink : '']
                  .filter(Boolean)
                  .join(' ')
              }
              end={item.end}
              key={item.to}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.actions}>
          {contextLabel ? (
            <button
              aria-label="Empresa em contexto"
              className={styles.contextButton}
              disabled
              type="button"
            >
              <BuildingIcon />
              <span>{contextLabel}</span>
              <ChevronDownIcon />
            </button>
          ) : null}

          <span className={styles.adminLabel}>
            <SettingsIcon />
            Admin
          </span>

          <button
            aria-label="Notificações"
            className={styles.iconButton}
            disabled
            type="button"
          >
            <BellIcon />
            <span className={styles.notificationDot} />
          </button>

          <span
            aria-label={user ? user.name : 'Usuário administrador'}
            className={styles.avatar}
          >
            {user ? getInitials(user.name) : 'US'}
          </span>

          <button
            className={styles.logoutButton}
            onClick={logout}
            type="button"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
