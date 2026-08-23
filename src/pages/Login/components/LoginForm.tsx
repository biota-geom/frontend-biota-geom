import { type FormEvent, type MouseEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { APP_ROUTES } from '../../../app/router/routes'
import styles from '../LoginPage.module.css'

function MailIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="20"
      viewBox="0 0 24 24"
      width="20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4.75 6.75H19.25V17.25H4.75V6.75Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M5.5 7.5L12 12.25L18.5 7.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="20"
      viewBox="0 0 24 24"
      width="20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7.75 10.25V8.5C7.75 6.15 9.35 4.75 12 4.75C14.65 4.75 16.25 6.15 16.25 8.5V10.25"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M6.75 10.25H17.25V18.25H6.75V10.25Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="20"
      viewBox="0 0 24 24"
      width="20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4.75 12C6.2 8.95 8.65 7.25 12 7.25C15.35 7.25 17.8 8.95 19.25 12C17.8 15.05 15.35 16.75 12 16.75C8.65 16.75 6.2 15.05 4.75 12Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M12 14.25C13.24 14.25 14.25 13.24 14.25 12C14.25 10.76 13.24 9.75 12 9.75C10.76 9.75 9.75 10.76 9.75 12C9.75 13.24 10.76 14.25 12 14.25Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

export function LoginForm() {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const navigate = useNavigate()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // TODO: replace temporary navigation with backend authentication.
    navigate(APP_ROUTES.admin.companies)
  }

  function handleForgotPasswordClick(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault()
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="email">
          E-mail corporativo
        </label>
        <div className={styles.inputShell}>
          <span className={styles.inputIcon}>
            <MailIcon />
          </span>
          <input
            autoComplete="email"
            className={styles.input}
            id="email"
            name="email"
            placeholder="admin@biotageom.com.br"
            type="email"
          />
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <div className={styles.labelRow}>
          <label className={styles.label} htmlFor="password">
            Senha de acesso
          </label>
          <a
            className={styles.forgotPassword}
            href="#"
            onClick={handleForgotPasswordClick}
          >
            Esqueceu a senha?
          </a>
        </div>
        <div className={styles.inputShell}>
          <span className={styles.inputIcon}>
            <LockIcon />
          </span>
          <input
            autoComplete="current-password"
            className={styles.input}
            id="password"
            name="password"
            placeholder="••••••••••••"
            type={isPasswordVisible ? 'text' : 'password'}
          />
          <button
            aria-label={isPasswordVisible ? 'Ocultar senha' : 'Exibir senha'}
            aria-pressed={isPasswordVisible}
            className={styles.passwordToggle}
            onClick={() => setIsPasswordVisible((current) => !current)}
            type="button"
          >
            <EyeIcon />
          </button>
        </div>
      </div>

      <button className={styles.submitButton} type="submit">
        Entrar na plataforma
      </button>

      <p className={styles.securityNote}>
        Segurança em conformidade com as normas ISO 27001 e LGPD.
      </p>
    </form>
  )
}
