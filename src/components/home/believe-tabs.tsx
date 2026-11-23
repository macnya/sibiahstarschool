'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Props { mission: string; vision: string; values: string[] }

/** "What we believe" — mission, vision and values as tabs, driven by the About page content. */
export function BelieveTabs({ mission, vision, values }: Props) {
  return (
    <section className="section-pad" aria-labelledby="believe-title">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <p className="eyebrow mb-3">What we believe</p>
          <h2 id="believe-title" className="display-title text-4xl text-primary md:text-5xl">The heart of our school</h2>
        </div>
        <Tabs defaultValue="mission" className="grid gap-8 lg:grid-cols-12">
          <TabsList className="flex h-auto flex-row gap-2 self-start bg-transparent p-0 lg:col-span-4 lg:flex-col lg:items-stretch">
            {[['mission', 'Our mission'], ['vision', 'Our vision'], ['values', 'Our values']].map(([v, label]) => (
              <TabsTrigger key={v} value={v} className="justify-start rounded-md border border-primary/15 bg-white px-5 py-4 text-left text-base font-semibold text-primary shadow-sm data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="rounded-lg bg-primary p-8 text-primary-foreground star-pattern md:p-12 lg:col-span-8">
            <TabsContent value="mission" className="mt-0"><p className="display-title text-2xl leading-snug md:text-4xl">{mission}</p></TabsContent>
            <TabsContent value="vision" className="mt-0"><p className="display-title text-2xl leading-snug md:text-4xl">{vision}</p></TabsContent>
            <TabsContent value="values" className="mt-0">
              <ul className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                {values.map((v) => (
                  <li key={v} className="flex items-start gap-3 text-lg leading-snug">
                    <span className="mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rotate-45 bg-accent" aria-hidden="true" />
                    <span className="display-title">{v}</span>
                  </li>
                ))}
              </ul>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </section>
  );
}
