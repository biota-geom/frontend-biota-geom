import { type FormEvent, type MouseEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_ROUTES } from '../../../app/router/routes';
import { EyeIcon, LockIcon, MailIcon } from '../../../components/ui/icons';

export function LoginForm() {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const navigate = useNavigate();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // TODO: replace temporary navigation with backend authentication.
    navigate(APP_ROUTES.admin.companies);
  }

  function handleForgotPasswordClick(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
  }

  return (
    <form className="mt-[30px] flex flex-col gap-5" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2">
        <label
          className="text-[13px] font-bold text-text-primary"
          htmlFor="email"
        >
          E-mail corporativo
        </label>
        <div className="rounded-control flex min-h-[42px] items-center gap-2.5 border border-border bg-surface px-2.5 text-text-muted shadow-control transition-[border-color,box-shadow] duration-[160ms] focus-within:border-focus focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.14)]">
          <span className="shrink-0 text-text-muted">
            <MailIcon />
          </span>
          <input
            autoComplete="email"
            className="w-full min-w-0 border-0 bg-transparent text-text-primary outline-0 placeholder:text-text-muted"
            id="email"
            name="email"
            placeholder="admin@biotageom.com.br"
            type="email"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4 max-[520px]:flex-col max-[520px]:items-start max-[520px]:gap-1.5">
          <label
            className="text-[13px] font-bold text-text-primary"
            htmlFor="password"
          >
            Senha de acesso
          </label>
          <a
            className="text-xs font-medium text-link no-underline hover:underline"
            href="#"
            onClick={handleForgotPasswordClick}
          >
            Esqueceu a senha?
          </a>
        </div>
        <div className="rounded-control flex min-h-[42px] items-center gap-2.5 border border-border bg-surface px-2.5 text-text-muted shadow-control transition-[border-color,box-shadow] duration-[160ms] focus-within:border-focus focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.14)]">
          <span className="shrink-0 text-text-muted">
            <LockIcon />
          </span>
          <input
            autoComplete="current-password"
            className="w-full min-w-0 border-0 bg-transparent text-text-primary outline-0 placeholder:text-text-muted"
            id="password"
            name="password"
            placeholder="••••••••••••"
            type={isPasswordVisible ? 'text' : 'password'}
          />
          <button
            aria-label={isPasswordVisible ? 'Ocultar senha' : 'Exibir senha'}
            aria-pressed={isPasswordVisible}
            className="rounded-control grid size-8 shrink-0 place-items-center border-0 bg-transparent p-0 text-text-muted hover:bg-surface-muted hover:text-text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            onClick={() => setIsPasswordVisible((current) => !current)}
            type="button"
          >
            <EyeIcon />
          </button>
        </div>
      </div>

      <button
        className="rounded-panel mt-3 min-h-[45px] border-0 bg-primary text-[15px] font-extrabold text-white shadow-control transition-[background-color,transform] duration-[160ms] hover:bg-primary-strong active:translate-y-px focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/30"
        type="submit"
      >
        Entrar na plataforma
      </button>

      <p className="mx-auto my-0 max-w-[310px] text-center text-xs leading-[1.35] text-text-muted">
        Segurança em conformidade com as normas ISO 27001 e LGPD.
      </p>
    </form>
  );
}
