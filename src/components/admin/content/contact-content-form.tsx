'use client';

import { useState, useTransition } from 'react';
import { updateSiteContent } from '@/app/admin/actions';
import type { ContactContent } from '@/lib/site-content/defaults';
import { TextField, SaveBar } from './fields';

export function ContactContentForm({ initial }: { initial: ContactContent }) {
  const [content, setContent] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateSiteContent('contact', content);
      if (result.error) setError(result.error);
      else setSaved(true);
    });
  }

  return (
    <div className="max-w-2xl space-y-8 pb-4">
      <section className="space-y-4">
        <h2 className="font-semibold text-primary">Contact info block</h2>
        <p className="text-xs text-muted-foreground">
          This is the address/phone/email/hours shown on the Contact page. It does not change
          the form itself, or the Home/footer links.
        </p>
        <TextField
          label="Address"
          value={content.address}
          onChange={(v) => setContent({ ...content, address: v })}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Phone (as shown)"
            value={content.phoneDisplay}
            onChange={(v) => setContent({ ...content, phoneDisplay: v })}
          />
          <TextField
            label="Phone (tel: link, digits only)"
            value={content.phoneHref}
            onChange={(v) => setContent({ ...content, phoneHref: v })}
            hint="e.g. +254712345678"
          />
        </div>
        <TextField
          label="Email"
          value={content.email}
          onChange={(v) => setContent({ ...content, email: v })}
        />
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-primary">Office hours</h2>
        <TextField
          label="Weekday line"
          value={content.officeHours.weekday}
          onChange={(v) => setContent({ ...content, officeHours: { ...content.officeHours, weekday: v } })}
        />
        <TextField
          label="Saturday line"
          value={content.officeHours.saturday}
          onChange={(v) => setContent({ ...content, officeHours: { ...content.officeHours, saturday: v } })}
        />
        <TextField
          label="Sunday line"
          value={content.officeHours.sunday}
          onChange={(v) => setContent({ ...content, officeHours: { ...content.officeHours, sunday: v } })}
        />
      </section>

      <SaveBar onSave={save} pending={pending} error={error} saved={saved} />
    </div>
  );
}
