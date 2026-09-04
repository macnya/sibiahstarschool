'use client';

import { useState, useTransition } from 'react';
import { updateSiteContent } from '@/app/admin/actions';
import type { CurriculumContent, CurriculumLevel } from '@/lib/site-content/defaults';
import { TextField, TextAreaField, StringListEditor, ObjectListEditor, SaveBar } from './fields';

const LEVEL_KEYS: { key: keyof CurriculumContent['levels']; label: string }[] = [
  { key: 'preschool', label: 'Pre-school' },
  { key: 'primary', label: 'Primary' },
  { key: 'juniorSecondary', label: 'Junior Secondary' },
];

export function CurriculumContentForm({ initial }: { initial: CurriculumContent }) {
  const [content, setContent] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function updateLevel(key: keyof CurriculumContent['levels'], patch: Partial<CurriculumLevel>) {
    setContent({
      ...content,
      levels: { ...content.levels, [key]: { ...content.levels[key], ...patch } },
    });
  }

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateSiteContent('curriculum', content);
      if (result.error) setError(result.error);
      else setSaved(true);
    });
  }

  return (
    <div className="max-w-2xl space-y-8 pb-4">
      <section className="space-y-4">
        <h2 className="font-semibold text-primary">Page header</h2>
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
        <h2 className="font-semibold text-primary">Educational levels</h2>
        <TextField
          label="Section heading"
          value={content.levelsHeading}
          onChange={(v) => setContent({ ...content, levelsHeading: v })}
        />
        {LEVEL_KEYS.map(({ key, label }) => {
          const level = content.levels[key];
          return (
            <div key={key} className="rounded-md border p-4 space-y-3">
              <h3 className="text-sm font-medium text-primary">{label}</h3>
              <TextField
                label="Title"
                value={level.title}
                onChange={(v) => updateLevel(key, { title: v })}
              />
              <TextAreaField
                label="Description"
                rows={4}
                value={level.description}
                onChange={(v) => updateLevel(key, { description: v })}
              />
              <StringListEditor
                label="Key learning areas"
                items={level.keyAreas}
                onChange={(keyAreas) => updateLevel(key, { keyAreas })}
                itemLabel="Area"
              />
            </div>
          );
        })}
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-primary">Extracurricular activities</h2>
        <TextField
          label="Heading"
          value={content.extracurricularHeading}
          onChange={(v) => setContent({ ...content, extracurricularHeading: v })}
        />
        <TextAreaField
          label="Intro text"
          value={content.extracurricularIntro}
          onChange={(v) => setContent({ ...content, extracurricularIntro: v })}
        />
        <ObjectListEditor
          label="Activities"
          items={content.extracurricular}
          onChange={(extracurricular) => setContent({ ...content, extracurricular })}
          fields={[
            { key: 'name', label: 'Name' },
            { key: 'description', label: 'Description', multiline: true },
          ]}
          itemLabel="Activity"
        />
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-primary">Educational approach</h2>
        <TextField
          label="Heading"
          value={content.approachHeading}
          onChange={(v) => setContent({ ...content, approachHeading: v })}
        />
        <TextAreaField
          label="Text"
          rows={5}
          value={content.approachText}
          onChange={(v) => setContent({ ...content, approachText: v })}
        />
      </section>

      <SaveBar onSave={save} pending={pending} error={error} saved={saved} />
    </div>
  );
}
