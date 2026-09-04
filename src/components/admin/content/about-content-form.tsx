'use client';

import { useState, useTransition } from 'react';
import { updateSiteContent } from '@/app/admin/actions';
import type { AboutContent } from '@/lib/site-content/defaults';
import { TextField, TextAreaField, StringListEditor, ObjectListEditor, SaveBar } from './fields';

export function AboutContentForm({ initial }: { initial: AboutContent }) {
  const [content, setContent] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateSiteContent('about', content);
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
        <h2 className="font-semibold text-primary">Our story</h2>
        <TextField
          label="Heading"
          value={content.story.heading}
          onChange={(v) => setContent({ ...content, story: { ...content.story, heading: v } })}
        />
        <TextAreaField
          label="Paragraph 1"
          rows={5}
          value={content.story.paragraph1}
          onChange={(v) => setContent({ ...content, story: { ...content.story, paragraph1: v } })}
        />
        <TextAreaField
          label="Paragraph 2"
          rows={4}
          value={content.story.paragraph2}
          onChange={(v) => setContent({ ...content, story: { ...content.story, paragraph2: v } })}
        />
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-primary">Mission</h2>
        <TextField
          label="Heading"
          value={content.mission.heading}
          onChange={(v) => setContent({ ...content, mission: { ...content.mission, heading: v } })}
        />
        <TextAreaField
          label="Text"
          value={content.mission.text}
          onChange={(v) => setContent({ ...content, mission: { ...content.mission, text: v } })}
        />
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-primary">Vision</h2>
        <TextField
          label="Heading"
          value={content.vision.heading}
          onChange={(v) => setContent({ ...content, vision: { ...content.vision, heading: v } })}
        />
        <TextAreaField
          label="Text"
          value={content.vision.text}
          onChange={(v) => setContent({ ...content, vision: { ...content.vision, text: v } })}
        />
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-primary">Core values</h2>
        <TextField
          label="Heading"
          value={content.values.heading}
          onChange={(v) => setContent({ ...content, values: { ...content.values, heading: v } })}
        />
        <StringListEditor
          label="Values"
          items={content.values.items}
          onChange={(items) => setContent({ ...content, values: { ...content.values, items } })}
          itemLabel="Value"
        />
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-primary">Director&apos;s message</h2>
        <TextField
          label="Section heading"
          value={content.director.heading}
          onChange={(v) => setContent({ ...content, director: { ...content.director, heading: v } })}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Director's name"
            value={content.director.name}
            onChange={(v) => setContent({ ...content, director: { ...content.director, name: v } })}
          />
          <TextField
            label="Title"
            value={content.director.title}
            onChange={(v) => setContent({ ...content, director: { ...content.director, title: v } })}
          />
        </div>
        <TextAreaField
          label="Quote — paragraph 1"
          rows={4}
          value={content.director.quote1}
          onChange={(v) => setContent({ ...content, director: { ...content.director, quote1: v } })}
        />
        <TextAreaField
          label="Quote — paragraph 2"
          rows={4}
          value={content.director.quote2}
          onChange={(v) => setContent({ ...content, director: { ...content.director, quote2: v } })}
        />
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-primary">Our team</h2>
        <TextField
          label="Heading"
          value={content.team.heading}
          onChange={(v) => setContent({ ...content, team: { ...content.team, heading: v } })}
        />
        <TextAreaField
          label="Intro text"
          value={content.team.intro}
          onChange={(v) => setContent({ ...content, team: { ...content.team, intro: v } })}
        />
        <ObjectListEditor
          label="Team members"
          items={content.team.members}
          onChange={(members) => setContent({ ...content, team: { ...content.team, members } })}
          fields={[
            { key: 'name', label: 'Name' },
            { key: 'role', label: 'Role' },
          ]}
          itemLabel="Member"
        />
      </section>

      <SaveBar onSave={save} pending={pending} error={error} saved={saved} />
    </div>
  );
}
