import type { FC, ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string | ReactNode;
  eyebrow?: string;
  /** Vertical padding. Pages may pass a smaller value (e.g. "py-10"). */
  className?: string;
}

/** The banner at the top of every inner page: deep navy, gold accent, display type. */
export const PageHeader: FC<PageHeaderProps> = ({ title, subtitle, eyebrow, className = 'py-16 md:py-24' }) => {
  return (
    <section className="relative overflow-hidden bg-primary text-primary-foreground">
      <div className="star-pattern absolute inset-0" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 h-1 bg-accent" aria-hidden="true" />
      <div className={`container relative mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1 className="display-title max-w-4xl text-4xl leading-tight sm:text-5xl md:text-6xl">{title}</h1>
        {subtitle && (
          <div className="mt-5 max-w-2xl text-lg leading-relaxed text-primary-foreground/85">
            {typeof subtitle === 'string' ? <p>{subtitle}</p> : subtitle}
          </div>
        )}
      </div>
    </section>
  );
};
