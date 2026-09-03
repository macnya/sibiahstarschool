import type { FC, ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string | ReactNode;
  className?: string;
}

export const PageHeader: FC<PageHeaderProps> = ({ title, subtitle, className = "py-8 md:py-12" }) => {
  return (
    <div className={`bg-secondary text-secondary-foreground ${className}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary">{title}</h1>
        {subtitle && (
          <div className="mt-2 md:mt-4 text-base md:text-lg max-w-2xl mx-auto">
            {typeof subtitle === 'string' ? <p>{subtitle}</p> : subtitle}
          </div>
        )}
      </div>
    </div>
  );
};
