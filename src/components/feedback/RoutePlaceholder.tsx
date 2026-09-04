type RoutePlaceholderProps = {
  description: string;
};

export function RoutePlaceholder({ description }: RoutePlaceholderProps) {
  return (
    <section
      className="rounded-panel border border-border bg-surface p-8 shadow-control max-[640px]:p-6"
      aria-label="Conteúdo em preparação"
    >
      <span className="rounded-control mb-4 inline-flex bg-[#d8f8ea] px-2.5 py-1.5 text-[13px] font-bold text-primary-strong">
        Em preparação
      </span>
      <p className="mt-3 mb-0 max-w-[580px] text-base leading-[1.6] text-text-secondary">
        {description}
      </p>
    </section>
  );
}
