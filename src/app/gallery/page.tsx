import { PageHeader } from '@/components/shared/page-header';
import Image from 'next/image';
import { getPublishedGallery } from '@/lib/queries';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gallery',
  description: 'Explore moments from Sibiah Star School life, events, and activities through our photo gallery.',
};

export const revalidate = 60;

export default async function GalleryPage() {
  const images = await getPublishedGallery();

  return (
    <div>
      <PageHeader
        eyebrow="Life at Sibiah Star"
        title="School Gallery"
        subtitle="A glimpse into the vibrant life at Sibiah Star School. Capturing moments of learning, joy, and community."
      />

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {images.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="group bg-card border-t-4 border-accent rounded-md overflow-hidden transform transition-transform duration-300 hover:scale-105"
                >
                  <div className="relative w-full aspect-[3/2]">
                    <Image
                      src={image.image_url}
                      alt={image.alt_text}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                      data-ai-hint={image.image_hint ?? undefined}
                    />
                    {image.caption && (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-opacity duration-300 flex items-end justify-center">
                        <p className="text-white text-sm p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center">
                          {image.caption}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-xl text-muted-foreground">
                No photos yet. Check back soon.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
