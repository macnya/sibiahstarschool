import type { FC, ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string | ReactNode;
  eyebrow?: string;
  className?: string;
}

export const PageHeader: FC<PageHeaderProps> = ({ title, subtitle, eyebrow, className = "py-16 md:py-20" }) => {
  return (
    <div className={`bg-gradient-to-r from-primary to-blue-700 text-primary-foreground ${className}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {eyebrow && (
          <p className="text-accent font-semibold text-sm tracking-wide mb-3">{eyebrow}</p>
        )}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">{title}</h1>
        {subtitle && (
          <div className="mt-2 md:mt-4 text-base md:text-lg max-w-2xl mx-auto text-primary-foreground/90">
            {typeof subtitle === 'string' ? <p>{subtitle}</p> : subtitle}
          </div>
        )}
      </div>
    </div>
  );
};
