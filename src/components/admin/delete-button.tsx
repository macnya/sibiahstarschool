'use client';

import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

/**
 * Delete control. Uses a native confirm() so a mis-tap cannot silently
 * destroy content — the AlertDialog component would need client state
 * plumbed through every list row for the same effect.
 */
export function DeleteButton({
  action,
  id,
  label = 'Delete',
  confirmText = 'Delete this permanently? This cannot be undone.',
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  label?: string;
  confirmText?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Inner label={label} />
    </form>
  );
}

function Inner({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="ghost"
      size="sm"
      disabled={pending}
      className="text-destructive hover:text-destructive"
      aria-label={label}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}
