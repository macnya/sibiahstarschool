'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, AlertCircle } from 'lucide-react';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

/**
 * Image picker that uploads straight from the browser to Supabase
 * Storage, then stores the resulting public URL in a hidden input.
 *
 * Uploading client-side keeps large files out of your Render instance's
 * memory and off the Server Action request body, which has a 1 MB
 * default limit.
 */
export function ImageField({
  defaultUrl = '',
  defaultHint = '',
  label = 'Image',
}: {
  defaultUrl?: string;
  defaultHint?: string;
  label?: string;
}) {
  const [url, setUrl] = useState(defaultUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);

    if (!ALLOWED.includes(file.type)) {
      setError('Use a JPEG, PNG, WebP or AVIF image.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('That image is over 5 MB. Please resize it first.');
      return;
    }

    setBusy(true);
    const supabase = createClient();

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    // Random name: avoids collisions and stops one upload overwriting
    // another that happens to share a filename.
    const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(path, file, { cacheControl: '31536000', upsert: false });

    if (uploadError) {
      setError(`Upload failed: ${uploadError.message}`);
      setBusy(false);
      return;
    }

    const { data } = supabase.storage.from('media').getPublicUrl(path);
    setUrl(data.publicUrl);
    setBusy(false);
  }

  return (
    <div className="space-y-3">
      <Label>{label}</Label>

      {/* The value the server action reads. */}
      <input type="hidden" name="image_url" value={url} />

      {url && (
        <div className="relative h-40 w-full max-w-sm overflow-hidden rounded-md border">
          <Image src={url} alt="" fill sizes="384px" className="object-cover" />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept={ALLOWED.join(',')}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="mr-1.5 h-3.5 w-3.5" />
          {busy ? 'Uploading…' : url ? 'Replace image' : 'Upload image'}
        </Button>
        {url && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setUrl('')}
          >
            Remove
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="image_hint" className="text-xs font-normal text-muted-foreground">
          Short description of the photo (optional)
        </Label>
        <Input
          id="image_hint"
          name="image_hint"
          defaultValue={defaultHint}
          placeholder="students in classroom"
        />
      </div>

      {error && (
        <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
