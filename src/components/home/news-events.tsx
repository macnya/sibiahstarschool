import Link from 'next/link';
import { BlogPostCard, type BlogPostProps } from '@/components/shared/blog-post-card';
import { EventCard, type EventProps } from '@/components/shared/event-card';

export function NewsEvents({ posts, events }: { posts: BlogPostProps[]; events: EventProps[] }) {
  if (posts.length === 0 && events.length === 0) return null;
  return (
    <section className="section-pad bg-secondary/40" aria-labelledby="news-title">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="eyebrow mb-3">What is happening</p>
          <h2 id="news-title" className="display-title text-4xl text-primary md:text-5xl">News &amp; events</h2>
        </div>
        {events.length > 0 && (
          <div className="mb-14">
            <div className="mb-5 flex items-end justify-between"><h3 className="display-title text-2xl text-primary">Upcoming events</h3><Link href="/events" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">All events →</Link></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{events.map((e) => <EventCard key={e.slug} {...e} />)}</div>
          </div>
        )}
        {posts.length > 0 && (
          <div>
            <div className="mb-5 flex items-end justify-between"><h3 className="display-title text-2xl text-primary">Latest news</h3><Link href="/blog" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">All news →</Link></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{posts.map((p) => <BlogPostCard key={p.slug} {...p} />)}</div>
          </div>
        )}
      </div>
    </section>
  );
}
