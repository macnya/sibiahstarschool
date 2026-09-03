import Link from 'next/link';
import { getAllEvents } from '@/lib/queries';
import { deleteEvent } from '../../actions';
import { DeleteButton } from '@/components/admin/delete-button';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminEventsPage() {
  const events = await getAllEvents();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-primary">Events</h1>
        <Button asChild size="sm">
          <Link href="/admin/events/new">
            <Plus className="mr-1.5 h-4 w-4" /> Add event
          </Link>
        </Button>
      </div>

      {events.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No events yet.</p>
          <Button asChild size="sm" className="mt-4">
            <Link href="/admin/events/new">Add your first event</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead className="hidden md:table-cell">Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/events/${event.id}`} className="hover:underline">
                      {event.title}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {new Date(`${event.event_date}T00:00:00`).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {event.location}
                  </TableCell>
                  <TableCell>
                    <Badge variant={event.published ? 'default' : 'secondary'}>
                      {event.published ? 'Live' : 'Draft'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/events/${event.id}`}>Edit</Link>
                      </Button>
                      <DeleteButton
                        action={deleteEvent}
                        id={event.id}
                        confirmText={`Delete "${event.title}"? This cannot be undone.`}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
