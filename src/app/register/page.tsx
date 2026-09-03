
import { PageHeader } from '@/components/shared/page-header';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function RegistrationRemovedPage() {
  return (
    <div>
      <PageHeader
        title="User Registration"
        subtitle="User registration functionality is currently not enabled for this application."
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 text-center">
        <p className="text-lg text-foreground/80 mb-8">
          If you believe this is an error, please contact the site administrator.
        </p>
        <Button asChild size="lg">
          <Link href="/">Return to Homepage</Link>
        </Button>
      </div>
    </div>
  );
}
