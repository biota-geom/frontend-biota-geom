import logoMark from '../../assets/logos/biota-geom-mark.svg';

type BiotaLogoVariant = 'horizontal' | 'stacked';

type BiotaLogoProps = {
  className?: string;
  nameAs?: 'h1' | 'span';
  tagline?: string;
  variant?: BiotaLogoVariant;
};

export function BiotaLogo({
  className,
  nameAs = 'span',
  tagline = 'PLATAFORMA ESG',
  variant = 'horizontal',
}: BiotaLogoProps) {
  const isStacked = variant === 'stacked';
  const logoClassName = [
    'inline-flex items-center gap-2 text-text-primary',
    isStacked ? 'flex-col gap-3.5 text-center' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  const brandName = (
    <>
      Biota<span className="font-medium text-link">Geom</span>
    </>
  );

  return (
    <div className={logoClassName} aria-label="BiotaGeom">
      <img
        className={isStacked ? 'size-[34px] shrink-0' : 'size-8 shrink-0'}
        src={logoMark}
        alt=""
      />
      <div
        className={[
          'flex flex-col leading-none',
          isStacked ? 'items-center gap-2' : 'items-start',
        ].join(' ')}
      >
        {nameAs === 'h1' ? (
          <h1
            className={
              isStacked
                ? 'm-0 text-2xl leading-[1.15] font-extrabold'
                : 'm-0 text-lg font-extrabold'
            }
          >
            {brandName}
          </h1>
        ) : (
          <span
            className={
              isStacked
                ? 'm-0 text-2xl leading-[1.15] font-extrabold'
                : 'm-0 text-lg font-extrabold'
            }
          >
            {brandName}
          </span>
        )}
        <span
          className={
            isStacked
              ? 'mt-0 text-sm font-medium text-text-secondary normal-case'
              : 'mt-[3px] text-[9px] font-bold text-text-secondary'
          }
        >
          {tagline}
        </span>
      </div>
    </div>
  );
}
