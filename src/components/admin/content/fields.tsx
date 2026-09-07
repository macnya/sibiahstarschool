'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { ImageUploadField } from './image-upload-field';

export function TextField({
  label, value, onChange, hint,
}: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function TextAreaField({
  label, value, onChange, rows = 3, hint,
}: { label: string; value: string; onChange: (v: string) => void; rows?: number; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Editable list of plain strings (e.g. "Key Learning Areas"). */
export function StringListEditor({
  label, items, onChange, itemLabel = 'Item',
}: { label: string; items: string[]; onChange: (items: string[]) => void; itemLabel?: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={item}
              onChange={(e) => {
                const next = [...items];
                next[i] = e.target.value;
                onChange(next);
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              aria-label={`Remove ${itemLabel.toLowerCase()}`}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, ''])}>
        <Plus className="mr-1.5 h-3.5 w-3.5" /> Add {itemLabel.toLowerCase()}
      </Button>
    </div>
  );
}

/**
 * Editable list of objects with a fixed set of string fields, e.g.
 * [{ title, description }]. `fields` describes each column's key,
 * label, and whether it renders as an <Input> or <Textarea>.
 */
export function ObjectListEditor<T extends Record<string, string>>({
  label, items, onChange, fields, itemLabel = 'Item', minItems = 0,
}: {
  label: string;
  items: T[];
  onChange: (items: T[]) => void;
  fields: { key: keyof T; label: string; multiline?: boolean; image?: boolean; imagePreviewClassName?: string }[];
  itemLabel?: string;
  minItems?: number;
}) {
  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={i} className="rounded-md border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {itemLabel} {i + 1}
              </span>
              {items.length > minItems && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5 text-destructive" /> Remove
                </Button>
              )}
            </div>
            {fields.map((f) => (
              <div key={String(f.key)} className="space-y-1.5">
                {f.image ? (
                  <ImageUploadField
                    label={f.label}
                    value={item[f.key] ?? ''}
                    onChange={(url) => {
                      const next = [...items];
                      next[i] = { ...next[i], [f.key]: url } as T;
                      onChange(next);
                    }}
                    previewClassName={f.imagePreviewClassName ?? 'h-40 w-full max-w-sm'}
                  />
                ) : (
                  <>
                    <Label className="text-xs">{f.label}</Label>
                    {f.multiline ? (
                      <Textarea
                        rows={3}
                        value={item[f.key] ?? ''}
                        onChange={(e) => {
                          const next = [...items];
                          next[i] = { ...next[i], [f.key]: e.target.value };
                          onChange(next);
                        }}
                      />
                    ) : (
                      <Input
                        value={item[f.key] ?? ''}
                        onChange={(e) => {
                          const next = [...items];
                          next[i] = { ...next[i], [f.key]: e.target.value };
                          onChange(next);
                        }}
                      />
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          const blank = Object.fromEntries(fields.map((f) => [f.key, ''])) as T;
          onChange([...items, blank]);
        }}
      >
        <Plus className="mr-1.5 h-3.5 w-3.5" /> Add {itemLabel.toLowerCase()}
      </Button>
    </div>
  );
}

export function SaveBar({
  onSave, pending, error, saved,
}: { onSave: () => void; pending: boolean; error: string | null; saved: boolean }) {
  return (
    <div className="sticky bottom-0 -mx-1 flex items-center gap-4 border-t bg-background/95 px-1 py-4 backdrop-blur">
      <Button type="button" onClick={onSave} disabled={pending}>
        {pending ? 'Saving…' : 'Save changes'}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!error && saved && <p className="text-sm text-muted-foreground">Saved.</p>}
    </div>
  );
}
