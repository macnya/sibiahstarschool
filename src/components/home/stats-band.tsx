interface Props { schools: number; classes: number }

export function StatsBand({ schools, classes }: Props) {
  const stats = [
    { value: String(Math.max(schools, 1)), label: schools === 1 ? 'School in our family' : 'Schools in our family' },
    { value: String(classes || 12), label: 'Classes, Playgroup to Grade 9' },
    { value: '20+', label: 'Years nurturing learners' },
    { value: '5 min', label: 'To apply online' },
  ];
  return (
    <section aria-label="Our school at a glance" className="relative bg-primary text-primary-foreground">
      <div className="star-pattern absolute inset-0" aria-hidden="true" />
      <div className="container relative mx-auto px-4 py-14 sm:px-6 lg:px-8">
        <dl className="grid grid-cols-2 gap-8 text-center lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="reveal">
              <dt className="sr-only">{s.label}</dt>
              <dd className="display-title text-5xl text-accent md:text-6xl" aria-hidden="true">{s.value}</dd>
              <dd className="mt-2 text-sm uppercase tracking-[0.15em] text-primary-foreground/80">{s.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
