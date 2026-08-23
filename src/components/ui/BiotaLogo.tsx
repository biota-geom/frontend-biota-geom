import logoMark from '../../assets/logos/biota-geom-mark.svg'
import styles from './BiotaLogo.module.css'

type BiotaLogoVariant = 'horizontal' | 'stacked'

type BiotaLogoProps = {
  className?: string
  nameAs?: 'h1' | 'span'
  tagline?: string
  variant?: BiotaLogoVariant
}

export function BiotaLogo({
  className,
  nameAs = 'span',
  tagline = 'PLATAFORMA ESG',
  variant = 'horizontal',
}: BiotaLogoProps) {
  const logoClassName = [styles.logo, styles[variant], className]
    .filter(Boolean)
    .join(' ')
  const brandName = (
    <>
      Biota<span className={styles.nameAccent}>Geom</span>
    </>
  )

  return (
    <div className={logoClassName} aria-label="BiotaGeom">
      <img className={styles.mark} src={logoMark} alt="" />
      <div className={styles.text}>
        {nameAs === 'h1' ? (
          <h1 className={styles.name}>{brandName}</h1>
        ) : (
          <span className={styles.name}>{brandName}</span>
        )}
        <span className={styles.tagline}>{tagline}</span>
      </div>
    </div>
  )
}
