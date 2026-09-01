import { Link, NavLink } from 'react-router-dom';
import { APP_ROUTES } from '../../app/router/routes';
import { BiotaLogo } from '../ui/BiotaLogo';
import {
  BellIcon,
  BuildingIcon,
  ChevronDownIcon,
  SettingsIcon,
} from '../ui/icons';

export type AppNavigationItem = {
  end?: boolean;
  label: string;
  to: string;
};

type AppHeaderProps = {
  contextLabel?: string;
  navItems: AppNavigationItem[];
};

export function AppHeader({ contextLabel, navItems }: AppHeaderProps) {
  return (
    <header className="min-h-[72px] border-b border-border bg-surface">
      <div className="flex min-h-[72px] items-center gap-9 px-10 max-[980px]:flex-wrap max-[980px]:gap-x-6 max-[980px]:gap-y-0 max-[980px]:px-6 max-[980px]:py-3.5 max-[640px]:px-4 max-[640px]:py-3">
        <Link
          className="inline-flex text-inherit no-underline"
          to={APP_ROUTES.admin.companies}
        >
          <BiotaLogo />
        </Link>

        <nav
          aria-label="Navegação principal"
          className="flex min-w-0 items-center gap-[26px] max-[980px]:order-3 max-[980px]:w-full max-[980px]:overflow-x-auto"
        >
          {navItems.map((item) => (
            <NavLink
              className={({ isActive }) =>
                [
                  'inline-flex min-h-[72px] items-center border-b-2 border-transparent text-[15px] font-medium text-text-secondary no-underline hover:text-primary-strong max-[980px]:min-h-11 max-[980px]:shrink-0',
                  isActive ? 'border-primary-strong text-primary-strong' : '',
                ]
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

        <div className="ml-auto flex items-center gap-4 max-[640px]:gap-2.5">
          {contextLabel ? (
            <button
              aria-label="Empresa em contexto"
              className="rounded-panel inline-flex min-h-[34px] items-center justify-center gap-2 border border-border bg-surface-muted px-3 text-[13px] font-bold text-text-primary disabled:cursor-default disabled:opacity-100"
              disabled
              type="button"
            >
              <BuildingIcon />
              <span className="max-[640px]:hidden">{contextLabel}</span>
              <ChevronDownIcon />
            </button>
          ) : null}

          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary max-[640px]:hidden">
            <SettingsIcon />
            Admin
          </span>

          <button
            aria-label="Notificações"
            className="relative inline-flex size-[38px] items-center justify-center rounded-full border border-border bg-surface-muted text-text-secondary disabled:cursor-default disabled:opacity-100"
            disabled
            type="button"
          >
            <BellIcon />
            <span className="absolute top-[7px] right-2 size-[7px] rounded-full border border-white bg-red-500" />
          </button>

          <span
            aria-label="Usuário administrador"
            className="grid size-9 place-items-center rounded-full bg-[#6847d8] text-sm font-extrabold text-white"
          >
            US
          </span>
        </div>
      </div>
    </header>
  );
}
