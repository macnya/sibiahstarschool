'use client';

import { useState, useTransition } from 'react';
import { updateSiteContent } from '@/app/admin/actions';
import type { FacilitiesContent } from '@/lib/site-content/defaults';
import { TextField, TextAreaField, StringListEditor, ObjectListEditor, SaveBar } from './fields';
import { ImageUploadField } from './image-upload-field';

export function FacilitiesContentForm({ initial }: { initial: FacilitiesContent }) {
  const [content, setContent] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateSiteContent('facilities', content);
      if (result.error) setError(result.error);
      else setSaved(true);
    });
  }

  return (
    <div className="max-w-2xl space-y-8 pb-4">
      <section className="space-y-4">
        <h2 className="font-semibold text-primary">Page header</h2>
        <TextField
          label="Eyebrow text (small line above the title)"
          value={content.header.eyebrow}
          onChange={(v) => setContent({ ...content, header: { ...content.header, eyebrow: v } })}
        />
        <TextField
          label="Title"
          value={content.header.title}
          onChange={(v) => setContent({ ...content, header: { ...content.header, title: v } })}
        />
        <TextAreaField
          label="Subtitle"
          value={content.header.subtitle}
          onChange={(v) => setContent({ ...content, header: { ...content.header, subtitle: v } })}
        />
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-primary">Facilities</h2>
        <p className="text-xs text-muted-foreground">
          The icon shown on each card cycles automatically and isn&apos;t editable here.
        </p>
        <ObjectListEditor
          label="Facility list"
          items={content.facilities}
          onChange={(facilities) => setContent({ ...content, facilities })}
          fields={[
            { key: 'name', label: 'Name' },
            { key: 'description', label: 'Description', multiline: true },
            { key: 'imageUrl', label: 'Photo', image: true },
          ]}
          itemLabel="Facility"
        />
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-primary">Transportation</h2>
        <TextField
          label="Heading"
          value={content.transport.heading}
          onChange={(v) => setContent({ ...content, transport: { ...content.transport, heading: v } })}
        />
        <TextAreaField
          label="Paragraph"
          rows={4}
          value={content.transport.paragraph}
          onChange={(v) => setContent({ ...content, transport: { ...content.transport, paragraph: v } })}
        />
        <StringListEditor
          label="Feature checklist"
          items={content.transport.features}
          onChange={(features) => setContent({ ...content, transport: { ...content.transport, features } })}
          itemLabel="Feature"
        />
        <TextAreaField
          label="Closing paragraph"
          value={content.transport.closing}
          onChange={(v) => setContent({ ...content, transport: { ...content.transport, closing: v } })}
        />
        <ImageUploadField
          label="Photo (bus / transport)"
          value={content.transport.imageUrl}
          onChange={(url) => setContent({ ...content, transport: { ...content.transport, imageUrl: url } })}
        />
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-primary">Other amenities</h2>
        <TextField
          label="Heading"
          value={content.amenitiesHeading}
          onChange={(v) => setContent({ ...content, amenitiesHeading: v })}
        />
        <ObjectListEditor
          label="Amenities"
          items={content.amenities}
          onChange={(amenities) => setContent({ ...content, amenities })}
          fields={[{ key: 'name', label: 'Name' }]}
          itemLabel="Amenity"
        />
      </section>

      <SaveBar onSave={save} pending={pending} error={error} saved={saved} />
    </div>
  );
}
