'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { savePost, type ActionState } from '@/app/admin/actions';
import { ImageField } from './image-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import type { BlogPostRow } from '@/lib/supabase/types';
import { AlertCircle } from 'lucide-react';

function Submit({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving…' : editing ? 'Save changes' : 'Publish post'}
    </Button>
  );
}

export function PostForm({ post }: { post?: BlogPostRow }) {
  const [state, formAction] = useActionState<ActionState, FormData>(savePost, {
    error: null,
  });

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      {post && <input type="hidden" name="id" value={post.id} />}

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" defaultValue={post?.title} required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="author">Author</Label>
          <Input
            id="author"
            name="author"
            defaultValue={post?.author}
            placeholder="Ms. Sarah Chen, School Counselor"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="published_at">Publish date</Label>
          <Input
            id="published_at"
            name="published_at"
            type="date"
            defaultValue={post?.published_at ?? today}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="excerpt">Excerpt</Label>
        <Textarea
          id="excerpt"
          name="excerpt"
          rows={3}
          defaultValue={post?.excerpt}
          required
        />
        <p className="text-xs text-muted-foreground">
          The summary shown on the blog listing page.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="body">Full article (optional)</Label>
        <Textarea id="body" name="body" rows={12} defaultValue={post?.body ?? ''} />
        <p className="text-xs text-muted-foreground">
          Stored for later. Individual post pages are not built yet, so only the
          excerpt is shown on the site for now.
        </p>
      </div>

      <ImageField
        defaultUrl={post?.image_url ?? ''}
        defaultHint={post?.image_hint ?? ''}
      />

      <div className="flex items-center gap-3 rounded-md border p-4">
        <Switch id="published" name="published" defaultChecked={post?.published ?? false} />
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
        <Submit editing={Boolean(post)} />
        <Button variant="ghost" asChild>
          <Link href="/admin/blog">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
