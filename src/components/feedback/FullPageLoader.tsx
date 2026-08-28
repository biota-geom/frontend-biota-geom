import styles from './FullPageLoader.module.css';

export function FullPageLoader() {
  return (
    <div className={styles.wrapper} role="status">
      <span className={styles.label}>Carregando...</span>
    </div>
  );
}
