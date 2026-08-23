import styles from './RoutePlaceholder.module.css'

type RoutePlaceholderProps = {
  description: string
}

export function RoutePlaceholder({ description }: RoutePlaceholderProps) {
  return (
    <section className={styles.panel} aria-label="Conteúdo em preparação">
      <span className={styles.status}>Em preparação</span>
      <p>{description}</p>
    </section>
  )
}
