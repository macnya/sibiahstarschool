import { PageHeader } from '@/components/shared/page-header';
import Image from 'next/image';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gallery',
  description: 'Explore moments from Sibiah Star School life, events, and activities through our photo gallery.',
};

const galleryImages = [
  { src: "https://placehold.co/600x400.png", alt: "Students in classroom", caption: "Engaged Learning in Classroom", hint: "students classroom" },
  { src: "https://placehold.co/600x400.png", alt: "School sports day", caption: "Annual Sports Day Fun", hint: "school sports" },
  { src: "https://placehold.co/600x400.png", alt: "Science fair project", caption: "Innovative Science Fair Projects", hint: "science fair" },
  { src: "https://placehold.co/600x400.png", alt: "Music class performance", caption: "Musical Talents on Display", hint: "music class" },
  { src: "https://placehold.co/600x400.png", alt: "Art exhibition", caption: "Creative Art Exhibition", hint: "art exhibition" },
  { src: "https://placehold.co/600x400.png", alt: "School assembly", caption: "Morning Assembly Gatherings", hint: "school assembly" },
  { src: "https://placehold.co/600x400.png", alt: "Students in library", caption: "Exploring Worlds in the Library", hint: "library students" },
  { src: "https://placehold.co/600x400.png", alt: "Graduation ceremony", caption: "Celebrating Achievements: Graduation", hint: "graduation ceremony" },
  { src: "https://placehold.co/600x400.png", alt: "Scout camp activity", caption: "Adventures at Scout Camp", hint: "scout camp" },
];

export default function GalleryPage() {
  return (
    <div>
      <PageHeader
        title="School Gallery"
        subtitle="A glimpse into the vibrant life at Sibiah Star School. Capturing moments of learning, joy, and community."
      />

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {galleryImages.map((image, index) => (
              <div key={index} className="group bg-card rounded-lg shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105">
                <div className="relative w-full aspect-[3/2]">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    layout="fill"
                    objectFit="cover"
                    className="transition-transform duration-300 group-hover:scale-110"
                    data-ai-hint={image.hint}
                  />
                   <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity duration-300 flex items-end justify-center">
                    <p className="text-white text-sm p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center">{image.caption}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
