'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { saveGalleryImage, type ActionState } from '@/app/admin/actions';
import { ImageField } from './image-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Plus } from 'lucide-react';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Adding…' : 'Add to gallery'}
    </Button>
  );
}

export function GalleryUploader({ nextSortOrder }: { nextSortOrder: number }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<ActionState, FormData>(
    saveGalleryImage,
    { error: null }
  );

  // Remount the form after each successful save so every field clears and
  // staff can add several photos in a row. Keyed on a counter rather than
  // on state.ok, which stays true and would never trigger a second reset.
  const [formKey, setFormKey] = useState(0);
  const lastOk = useRef(false);

  useEffect(() => {
    if (state.ok && !lastOk.current) setFormKey((k) => k + 1);
    lastOk.current = Boolean(state.ok);
  }, [state]);

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-1.5 h-4 w-4" /> Add photo
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Add a photo</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6" key={formKey}>
          <ImageField label="Photo" />

          <div className="space-y-2">
            <Label htmlFor="alt_text">Description for screen readers</Label>
            <Input
              id="alt_text"
              name="alt_text"
              placeholder="Students working together in the science lab"
              required
            />
            <p className="text-xs text-muted-foreground">
              Read aloud to visitors who cannot see the photo. Describe what is
              happening, not the word &quot;photo&quot;.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="caption">Caption (optional)</Label>
              <Input id="caption" name="caption" placeholder="Science Fair 2025" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sort_order">Position</Label>
              <Input
                id="sort_order"
                name="sort_order"
                type="number"
                min={0}
                defaultValue={nextSortOrder}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-md border p-4">
            <Switch id="published" name="published" defaultChecked />
            <Label htmlFor="published">Show on the website</Label>
          </div>

          {state.error && (
            <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {state.error}
            </p>
          )}

          {state.ok && (
            <p className="text-sm text-muted-foreground">
              Photo added. Add another, or close this form.
            </p>
          )}

          <div className="flex gap-3">
            <Submit />
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
