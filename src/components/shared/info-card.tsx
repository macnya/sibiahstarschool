import type { FC, ReactNode } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface InfoCardProps {
  title: string;
  description: string | ReactNode;
  icon?: ReactNode;
  linkHref?: string;
  linkText?: string;
  className?: string;
}

export const InfoCard: FC<InfoCardProps> = ({ title, description, icon, linkHref, linkText = "Learn More", className }) => {
  return (
    <Card className={`flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300 ${className}`}>
      <CardHeader className="flex flex-row items-start gap-4">
        {icon && <div className="text-accent p-2 bg-accent/10 rounded-md">{icon}</div>}
        <div className="flex-1">
          <CardTitle className="text-xl md:text-2xl text-primary">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        {typeof description === 'string' ? <CardDescription className="text-base text-foreground/80">{description}</CardDescription> : description}
      </CardContent>
      {linkHref && (
        <CardFooter>
          <Button asChild variant="link" className="text-accent p-0 hover:underline">
            <Link href={linkHref}>
              {linkText}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
