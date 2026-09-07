import { PageHeader } from '@/components/shared/page-header';
import { EventCard } from '@/components/shared/event-card';
import { getPublishedEvents } from '@/lib/queries';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Events',
  description: 'Stay updated with the latest events, workshops, and important dates at Sibiah Star School.',
};

// Re-fetch at most once a minute. Admin edits call revalidatePath, so
// changes still appear immediately after publishing.
export const revalidate = 60;

export default async function EventsPage() {
  const events = await getPublishedEvents();

  return (
    <div>
      <PageHeader
        eyebrow="Mark your calendar"
        title="School Events"
        subtitle="Find out about upcoming events, important dates, and celebrations at Sibiah Star School."
      />

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map((event) => (
                <EventCard key={event.slug} {...event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-xl text-muted-foreground">
                No upcoming events at the moment. Please check back soon.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
