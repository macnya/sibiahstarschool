'use client';

import { useState, useTransition } from 'react';
import { updateSiteContent } from '@/app/admin/actions';
import type { AdmissionsContent } from '@/lib/site-content/defaults';
import { TextField, TextAreaField, ObjectListEditor, StringListEditor, SaveBar } from './fields';
import { Button } from '@/components/ui/button';
import { Trash2, Plus } from 'lucide-react';

export function AdmissionsContentForm({ initial }: { initial: AdmissionsContent }) {
  const [content, setContent] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateSiteContent('admissions', content);
      if (result.error) setError(result.error);
      else setSaved(true);
    });
  }

  function updateRequirement(i: number, patch: Partial<{ level: string; items: string[] }>) {
    const next = [...content.requirements];
    next[i] = { ...next[i], ...patch };
    setContent({ ...content, requirements: next });
  }

  return (
    <div className="max-w-2xl space-y-8 pb-4">
      <section className="space-y-4">
        <h2 className="font-semibold text-primary">Header</h2>
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
        <h2 className="font-semibold text-primary">Admission process</h2>
        <TextField
          label="Heading"
          value={content.processHeading}
          onChange={(v) => setContent({ ...content, processHeading: v })}
        />
        <ObjectListEditor
          label="Steps (shown in order, numbered automatically)"
          items={content.steps}
          onChange={(steps) => setContent({ ...content, steps })}
          fields={[
            { key: 'title', label: 'Title' },
            { key: 'description', label: 'Description', multiline: true },
          ]}
          itemLabel="Step"
          minItems={1}
        />
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-primary">Admission requirements</h2>
        <TextField
          label="Heading"
          value={content.requirementsHeading}
          onChange={(v) => setContent({ ...content, requirementsHeading: v })}
        />
        <div className="space-y-4">
          {content.requirements.map((req, i) => (
            <div key={i} className="rounded-md border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Level {i + 1}</span>
                {content.requirements.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setContent({
                        ...content,
                        requirements: content.requirements.filter((_, idx) => idx !== i),
                      })
                    }
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5 text-destructive" /> Remove
                  </Button>
                )}
              </div>
              <TextField
                label="Level name"
                value={req.level}
                onChange={(v) => updateRequirement(i, { level: v })}
              />
              <StringListEditor
                label="Required documents"
                items={req.items}
                onChange={(items) => updateRequirement(i, { items })}
                itemLabel="Document"
              />
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            setContent({
              ...content,
              requirements: [...content.requirements, { level: '', items: [''] }],
            })
          }
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add level
        </Button>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-primary">AI Admission Guide callout</h2>
        <TextField
          label="Heading"
          value={content.aiGuide.heading}
          onChange={(v) => setContent({ ...content, aiGuide: { ...content.aiGuide, heading: v } })}
        />
        <TextAreaField
          label="Text"
          value={content.aiGuide.text}
          onChange={(v) => setContent({ ...content, aiGuide: { ...content.aiGuide, text: v } })}
        />
        <TextField
          label="Button label"
          value={content.aiGuide.buttonLabel}
          onChange={(v) => setContent({ ...content, aiGuide: { ...content.aiGuide, buttonLabel: v } })}
        />
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-primary">Application forms</h2>
        <TextField
          label="Heading"
          value={content.formsHeading}
          onChange={(v) => setContent({ ...content, formsHeading: v })}
        />
        <TextAreaField
          label="Text"
          value={content.formsText}
          onChange={(v) => setContent({ ...content, formsText: v })}
        />
        <TextField
          label="Download button label"
          value={content.downloadButtonLabel}
          onChange={(v) => setContent({ ...content, downloadButtonLabel: v })}
        />
        <TextField
          label="Download URL"
          value={content.downloadUrl}
          onChange={(v) => setContent({ ...content, downloadUrl: v })}
        />
        <TextField
          label="Note below the button"
          value={content.formsNote}
          onChange={(v) => setContent({ ...content, formsNote: v })}
        />
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-primary">&quot;Have questions&quot; section</h2>
        <TextField
          label="Heading"
          value={content.questionsHeading}
          onChange={(v) => setContent({ ...content, questionsHeading: v })}
        />
        <TextAreaField
          label="Text"
          value={content.questionsText}
          onChange={(v) => setContent({ ...content, questionsText: v })}
        />
      </section>

      <SaveBar onSave={save} pending={pending} error={error} saved={saved} />
    </div>
  );
}
