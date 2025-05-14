import { PageHeader } from '@/components/shared/page-header';
import { EventCard, type EventProps } from '@/components/shared/event-card';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Events',
  description: 'Stay updated with the latest events, workshops, and important dates at Sibiah Star School.',
};

const sampleEvents: EventProps[] = [
  {
    title: "Annual Sports Day",
    date: "March 15, 2025",
    location: "Sports Ground",
    description: "Join us for a day of thrilling athletic competitions, team spirit, and fun for the whole family.",
    imageUrl: "https://placehold.co/600x400.png",
    imageHint: "sports day",
    slug: "annual-sports-day-2025"
  },
  {
    title: "CBC Exhibition",
    date: "April 22, 2025",
    location: "School Ground",
    description: "Witness the innovative projects and talents of our students from all grades.",
    imageUrl: "https://placehold.co/600x400.png",
    imageHint: "science fair",
    slug: "science-fair-2025"
  },
  {
    title: "Parent-Teacher Conference",
    date: "May 10, 2025",
    location: "Respective Classrooms",
    description: "An opportunity for parents to discuss their child's progress with teachers.",
    imageUrl: "https://placehold.co/600x400.png",
    imageHint: "meeting conference",
    slug: "parent-teacher-conference-may-2025"
  },
  {
    title: "Cultural Day Celebration",
    date: "June 5, 2025",
    location: "School Ground",
    description: "Experience a vibrant display of diverse cultures through music, dance, and drama performances.",
    imageUrl: "https://placehold.co/600x400.png",
    imageHint: "cultural festival",
    slug: "cultural-day-2025"
  },
    {
    title: "Pre-School Graduation",
    date: "July 12, 2025",
    location: "School Ground",
    description: "Celebrating our little stars as they move on to Primary school. A joyous occasion for PP2 students and their families.",
    imageUrl: "https://placehold.co/600x400.png",
    imageHint: "preschool graduation",
    slug: "preschool-graduation-2025"
  },
  {
    title: "Junior Secondary Open House",
    date: "August 20, 2025",
    location: "Junior Secondary Block",
    description: "Prospective students and parents are invited to explore our Junior Secondary facilities and meet our faculty.",
    imageUrl: "https://placehold.co/600x400.png",
    imageHint: "school open house",
    slug: "junior-secondary-open-house-2025"
  },
];


export default function EventsPage() {
  return (
    <div>
      <PageHeader
        title="School Events"
        subtitle="Find out about upcoming events, important dates, and celebrations at Sibiah Star School."
      />

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {sampleEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sampleEvents.map((event) => (
                <EventCard key={event.slug} {...event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-xl text-muted-foreground">No upcoming events at the moment. Please check back soon!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// Placeholder for individual event page structure, if needed in future
// src/app/events/[slug]/page.tsx
// export default function EventDetailPage({ params }: { params: { slug: string } }) {
//   // Fetch event details based on params.slug
//   return ( <div>Event: {params.slug} details here...</div> )
// }
