'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, AlertCircle } from 'lucide-react';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

/**
 * Controlled image picker for the site-content admin forms (Home,
 * Admissions, Curriculum, Facilities, Contact, About). Uploads straight
 * from the browser to the same "media" bucket the gallery uploader uses,
 * then reports the public URL back via onChange — so it plugs into the
 * same controlled-state pattern as TextField/TextAreaField instead of
 * the hidden-input/FormData pattern the gallery form uses.
 */
export function ImageUploadField({
  label,
  value,
  onChange,
  previewClassName = 'h-40 w-full max-w-sm',
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  previewClassName?: string;
}) {
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
    // Random name under a content/ prefix: keeps these separate from
    // gallery uploads in the same bucket and avoids filename collisions.
    const path = `content/${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(path, file, { cacheControl: '31536000', upsert: false });

    if (uploadError) {
      setError(`Upload failed: ${uploadError.message}`);
      setBusy(false);
      return;
    }

    const { data } = supabase.storage.from('media').getPublicUrl(path);
    onChange(data.publicUrl);
    setBusy(false);
  }

  return (
    <div className="space-y-3">
      <Label className="text-xs">{label}</Label>

      {value && (
        <div className={`relative overflow-hidden rounded-md border ${previewClassName}`}>
          <Image src={value} alt="" fill sizes="384px" className="object-cover" />
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
          {busy ? 'Uploading…' : value ? 'Replace image' : 'Upload image'}
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange('')}>
            Remove
          </Button>
        )}
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
