import logo from '../../assets/logos/biota-geom-logo.svg';
import { cn } from '../../utils/cn';

type BiotaLogoVariant = 'horizontal' | 'stacked';

type BiotaLogoProps = {
  className?: string;
  nameAs?: 'h1' | 'span';
  tagline?: string;
  variant?: BiotaLogoVariant;
};

export function BiotaLogo({
  className,
  nameAs: Name = 'span',
  tagline,
  variant = 'horizontal',
}: BiotaLogoProps) {
  const isStacked = variant === 'stacked';
  return (
    <div
      className={cn(
        'inline-flex shrink-0 flex-col',
        isStacked ? 'items-center gap-2 text-center' : 'items-start gap-1',
        className
      )}
      aria-label="BiotaGeom"
    >
      <Name className="m-0 flex max-w-full">
        <img
          className={cn(
            'max-w-full object-contain',
            isStacked ? 'h-12 w-auto' : 'h-9 w-auto'
          )}
          src={logo}
          alt="BiotaGeom"
          width={252}
          height={56}
        />
      </Name>
      {tagline && (
        <span
          className={
            isStacked
              ? 'text-sm font-medium text-text-secondary'
              : 'text-[9px] font-bold text-text-secondary'
          }
        >
          {tagline}
        </span>
      )}
    </div>
  );
}
