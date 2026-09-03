'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { saveEvent, type ActionState } from '@/app/admin/actions';
import { ImageField } from './image-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import type { EventRow } from '@/lib/supabase/types';
import { AlertCircle } from 'lucide-react';

function Submit({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving…' : editing ? 'Save changes' : 'Publish event'}
    </Button>
  );
}

export function EventForm({ event }: { event?: EventRow }) {
  const [state, formAction] = useActionState<ActionState, FormData>(saveEvent, {
    error: null,
  });

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      {event && <input type="hidden" name="id" value={event.id} />}

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" defaultValue={event?.title} required />
        <p className="text-xs text-muted-foreground">
          The web address is made from the title, so changing it changes the link.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="event_date">Date</Label>
          <Input
            id="event_date"
            name="event_date"
            type="date"
            defaultValue={event?.event_date}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            name="location"
            defaultValue={event?.location}
            placeholder="Sports Ground"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={event?.description}
          required
        />
      </div>

      <ImageField
        defaultUrl={event?.image_url ?? ''}
        defaultHint={event?.image_hint ?? ''}
      />

      <div className="flex items-center gap-3 rounded-md border p-4">
        <Switch
          id="published"
          name="published"
          defaultChecked={event?.published ?? false}
        />
        <div>
          <Label htmlFor="published">Show on the website</Label>
          <p className="text-xs text-muted-foreground">
            Leave off to save a draft only staff can see.
          </p>
        </div>
      </div>

      {state.error && (
        <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {state.error}
        </p>
      )}

      <div className="flex gap-3">
        <Submit editing={Boolean(event)} />
        <Button variant="ghost" asChild>
          <Link href="/admin/events">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
