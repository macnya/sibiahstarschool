'use client';

import { useState, useTransition } from 'react';
import { updateSiteContent } from '@/app/admin/actions';
import type { HomeContent } from '@/lib/site-content/defaults';
import { TextField, TextAreaField, ObjectListEditor, SaveBar } from './fields';

export function HomeContentForm({ initial }: { initial: HomeContent }) {
  const [content, setContent] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateSiteContent('home', content);
      if (result.error) setError(result.error);
      else setSaved(true);
    });
  }

  return (
    <div className="max-w-2xl space-y-8 pb-4">
      <section className="space-y-4">
        <h2 className="font-semibold text-primary">Hero</h2>
        <TextField
          label="Title (before the highlighted name)"
          value={content.hero.title}
          onChange={(v) => setContent({ ...content, hero: { ...content.hero, title: v } })}
        />
        <TextField
          label="Highlighted school name"
          value={content.hero.highlight}
          onChange={(v) => setContent({ ...content, hero: { ...content.hero, highlight: v } })}
          hint={'Renders as: "' + content.hero.title + ' ' + content.hero.highlight + ' School"'}
        />
        <TextAreaField
          label="Subtitle"
          value={content.hero.subtitle}
          onChange={(v) => setContent({ ...content, hero: { ...content.hero, subtitle: v } })}
        />
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-primary">Educational journey section</h2>
        <TextField
          label="Heading"
          value={content.levelsHeading}
          onChange={(v) => setContent({ ...content, levelsHeading: v })}
        />
        <ObjectListEditor
          label="Levels (Pre-school / Primary / Junior Secondary — keep the order)"
          items={content.levels}
          onChange={(levels) => setContent({ ...content, levels })}
          fields={[
            { key: 'title', label: 'Title' },
            { key: 'description', label: 'Description', multiline: true },
          ]}
          itemLabel="Level"
          minItems={content.levels.length}
        />
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-primary">&quot;Why choose us&quot; section</h2>
        <TextField
          label="Heading"
          value={content.highlightsHeading}
          onChange={(v) => setContent({ ...content, highlightsHeading: v })}
        />
        <ObjectListEditor
          label="Highlights"
          items={content.highlights}
          onChange={(highlights) => setContent({ ...content, highlights })}
          fields={[
            { key: 'title', label: 'Title' },
            { key: 'description', label: 'Description', multiline: true },
          ]}
          itemLabel="Highlight"
          minItems={content.highlights.length}
        />
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-primary">&quot;Beyond the classroom&quot; section</h2>
        <TextField
          label="Heading"
          value={content.cocurricularHeading}
          onChange={(v) => setContent({ ...content, cocurricularHeading: v })}
        />
        <ObjectListEditor
          label="Programs (Music / Scout — keep the order)"
          items={content.cocurricular}
          onChange={(cocurricular) => setContent({ ...content, cocurricular })}
          fields={[
            { key: 'title', label: 'Title' },
            { key: 'description', label: 'Description', multiline: true },
          ]}
          itemLabel="Program"
          minItems={content.cocurricular.length}
        />
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-primary">&quot;Get involved&quot; section</h2>
        <TextField
          label="Heading"
          value={content.getInvolvedHeading}
          onChange={(v) => setContent({ ...content, getInvolvedHeading: v })}
        />
        <TextAreaField
          label="Text"
          value={content.getInvolvedText}
          onChange={(v) => setContent({ ...content, getInvolvedText: v })}
        />
      </section>

      <SaveBar onSave={save} pending={pending} error={error} saved={saved} />
    </div>
  );
}
