import { Award, Bus, Globe, Lightbulb, Music, ShieldCheck } from 'lucide-react';

const ICONS = [ShieldCheck, Lightbulb, Bus, Award, Globe, Music];

export function Highlights({ heading, items }: { heading: string; items: { title: string; description: string }[] }) {
  if (items.length === 0) return null;
  return (
    <section className="section-pad" aria-labelledby="why-title">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="eyebrow mb-3">Why families choose us</p>
          <h2 id="why-title" className="display-title text-4xl text-primary md:text-5xl">{heading}</h2>
        </div>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((h, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <li key={h.title} className="reveal rounded-lg border-t-4 border-accent bg-card p-7 shadow-md">
                <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-accent"><Icon className="h-6 w-6" aria-hidden="true" /></span>
                <h3 className="display-title text-xl text-primary">{h.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/75">{h.description}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
