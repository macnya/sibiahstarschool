import { PageHeader } from '@/components/shared/page-header';
import { BlogPostCard } from '@/components/shared/blog-post-card';
import { getPublishedPosts } from '@/lib/queries';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Read the latest news, articles, and insights from Sibiah Star School.',
};

export const revalidate = 60;

export default async function BlogPage() {
  const posts = await getPublishedPosts();

  return (
    <div>
      <PageHeader
        title="School Blog"
        subtitle="Stay informed with news, insights, and stories from the Sibiah Star School community."
      />

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <BlogPostCard key={post.slug} {...post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-xl text-muted-foreground">
                No posts published yet. Check back soon.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
