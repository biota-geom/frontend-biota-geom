import { BiotaLogo } from '../../components/ui/BiotaLogo';
import styles from '../Login/LoginPage.module.css';
import { RegisterForm } from './components/RegisterForm';

export function RegisterPage() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <BiotaLogo
          className={styles.logo}
          nameAs="h1"
          tagline="Criar Conta"
          variant="stacked"
        />
        <RegisterForm />
      </section>
    </main>
  );
}
