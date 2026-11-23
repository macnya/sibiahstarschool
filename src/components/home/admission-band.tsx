import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function AdmissionBand({ text }: { text: string }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary to-blue-800 text-primary-foreground" aria-labelledby="admission-title">
      <div className="star-pattern absolute inset-0" aria-hidden="true" />
      <div className="container relative mx-auto px-4 py-20 text-center sm:px-6 md:py-28 lg:px-8">
        <p className="eyebrow mb-4">Admissions</p>
        <h2 id="admission-title" className="display-title mx-auto max-w-3xl text-4xl leading-tight md:text-6xl">Your child’s bright future starts here</h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-primary-foreground/85">{text}</p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Button asChild size="lg" className="bg-accent px-8 text-base font-semibold text-accent-foreground shadow-lg hover:bg-accent/90"><Link href="/admissions/apply">Apply online</Link></Button>
          <Button asChild size="lg" variant="outline" className="border-white/60 bg-transparent px-8 text-base font-semibold text-white hover:bg-white hover:text-primary"><Link href="/contact">Book a visit</Link></Button>
          <Button asChild size="lg" variant="ghost" className="text-base font-semibold text-white hover:bg-white/10 hover:text-accent"><Link href="/admissions/status">Track an application</Link></Button>
        </div>
      </div>
    </section>
  );
}
