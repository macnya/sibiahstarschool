import Link from 'next/link';

type Stage = { title: string; description: string };

export function EducationTimeline({ stages, links }: { stages: Stage[]; links: string[] }) {
  return (
    <div className="relative grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6">
      <div
        className="hidden md:block absolute top-7 left-[16.5%] right-[16.5%] h-0.5 bg-border"
        aria-hidden="true"
      />
      {stages.map((stage, i) => (
        <div key={stage.title} className="relative px-2">
          <div className="w-14 h-14 rounded-full bg-primary text-accent flex items-center justify-center font-bold text-lg mb-5 relative z-10">
            {i + 1}
          </div>
          <h3 className="text-xl font-semibold text-primary mb-2">{stage.title}</h3>
          <p className="text-foreground/80 text-sm mb-3">{stage.description}</p>
          <Link
            href={links[i] ?? '/curriculum'}
            className="text-sm font-semibold text-primary hover:text-accent transition-colors"
          >
            Learn more
          </Link>
        </div>
      ))}
    </div>
  );
}
