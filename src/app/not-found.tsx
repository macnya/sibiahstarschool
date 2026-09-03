
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div>
      <PageHeader
        title="Page Not Found"
        subtitle={
          <div className="flex flex-col items-center space-y-2">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <p>Oops! The page you are looking for does not exist or may have been moved.</p>
          </div>
        }
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-lg text-foreground/80 mb-8">
          You can return to the homepage or try navigating using the main menu.
        </p>
        <Button asChild size="lg">
          <Link href="/">Return to Homepage</Link>
        </Button>
      </div>
    </div>
  );
}
