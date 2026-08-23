import { BiotaLogo } from '../../components/ui/BiotaLogo'
import { LoginForm } from './components/LoginForm'
import styles from './LoginPage.module.css'

export function LoginPage() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <BiotaLogo
          className={styles.logo}
          nameAs="h1"
          tagline="Acesso Administrativo"
          variant="stacked"
        />
        <LoginForm />
      </section>
    </main>
  )
}
