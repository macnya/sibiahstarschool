import { notFound } from 'next/navigation';
import { getEventById } from '@/lib/queries';
import { EventForm } from '@/components/admin/event-form';

export const dynamic = 'force-dynamic';

// In Next.js 15 route params are a Promise and must be awaited.
export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-primary">Edit event</h1>
      <EventForm event={event} />
    </div>
  );
}
