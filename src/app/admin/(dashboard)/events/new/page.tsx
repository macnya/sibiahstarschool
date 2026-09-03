import { EventForm } from '@/components/admin/event-form';

export default function NewEventPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-primary">Add event</h1>
      <EventForm />
    </div>
  );
}
