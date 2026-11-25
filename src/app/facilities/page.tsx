import { PageHeader } from '@/components/shared/page-header';
import Image from 'next/image';
import { BookOpen, FlaskConical, MonitorPlay, Bus, ShieldCheck, Wifi, Trees, ShoppingCart } from 'lucide-react';
import type { Metadata } from 'next';
import { getPageContent } from '@/lib/site-content/queries';

// Content on this page is admin-editable via /admin/content/facilities
// and stored in Supabase, so it must be fetched fresh on every request
// rather than baked into a static build-time page.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Facilities',
  description: 'Discover the modern facilities at Sibiah Star School, including classrooms, labs, library, sports areas, and our comprehensive transport service.',
};

// Icons cycle by index — structural, not editable copy. Photos now come
// from content.facilities[i].imageUrl (admin-editable).
const FACILITY_ICONS = [
  <BookOpen key="classrooms" className="h-10 w-10 text-accent" />,
  <FlaskConical key="labs" className="h-10 w-10 text-accent" />,
  <MonitorPlay key="ict" className="h-10 w-10 text-accent" />,
  <BookOpen key="library" className="h-10 w-10 text-accent" />,
  <Trees key="sports" className="h-10 w-10 text-accent" />,
];
const AMENITY_ICONS = [
  <Wifi key="wifi" className="h-8 w-8 text-accent" />,
  <ShieldCheck key="security" className="h-8 w-8 text-accent" />,
  <ShoppingCart key="shop" className="h-8 w-8 text-accent" />,
];

export default async function FacilitiesPage() {
  const content = await getPageContent('facilities');

  return (
    <div>
      <PageHeader
        eyebrow={content.header.eyebrow}
        title={content.header.title}
        subtitle={content.header.subtitle}
      />

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {content.facilities.map((facility, i) => {
              const icon = FACILITY_ICONS[i % FACILITY_ICONS.length];
              return (
                <div key={facility.name} className="bg-card border-t-4 border-accent rounded-md overflow-hidden flex flex-col">
                  <div className="relative h-56 w-full">
                    <Image
                      src={facility.imageUrl}
                      alt={facility.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-6 flex-grow flex flex-col">
                    <div className="flex items-center mb-3">
                      <div className="p-2 bg-accent/10 rounded-md mr-3">{icon}</div>
                      <h3 className="text-xl font-semibold text-primary">{facility.name}</h3>
                    </div>
                    <p className="text-foreground/80 text-sm leading-relaxed flex-grow">{facility.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="transport" className="py-16 md:py-20 bg-secondary/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <Image
                src={content.transport.imageUrl}
                alt="School bus"
                width={600}
                height={450}
                className="rounded-lg shadow-xl object-cover"
              />
            </div>
            <div>
              <div className="flex items-center mb-4">
                 <Bus className="h-12 w-12 text-accent mr-4" />
                 <h2 className="text-2xl md:text-3xl font-bold text-primary">{content.transport.heading}</h2>
              </div>
              <p className="text-foreground/80 mb-4 leading-relaxed">
                {content.transport.paragraph}
              </p>
              <ul className="space-y-2 text-foreground/80">
                {content.transport.features.map((feature) => (
                  <li key={feature} className="flex items-center"><ShieldCheck className="h-5 w-5 mr-2 text-green-500" /> {feature}</li>
                ))}
              </ul>
              <p className="mt-4 text-foreground/80 leading-relaxed">
                {content.transport.closing}
              </p>
            </div>
          </div>
        </div>
      </section>
      
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-primary text-center mb-10">{content.amenitiesHeading}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 text-center">
            {content.amenities.map((item, i) => (
              <div key={item.name} className="p-6 bg-card border-t-4 border-accent rounded-md">
                {AMENITY_ICONS[i % AMENITY_ICONS.length]}
                <h3 className="mt-2 font-semibold text-primary">{item.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
