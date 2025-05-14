import { PageHeader } from '@/components/shared/page-header';
import { BlogPostCard, type BlogPostProps } from '@/components/shared/blog-post-card';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Read the latest news, articles, and insights from Sibiah Star School.',
};

const sampleBlogPosts: BlogPostProps[] = [
  {
    title: "The Importance of Early Childhood Education",
    date: "February 28, 2025",
    author: "Dr. Emily Carter, Head of Pre-school",
    excerpt: "Discover why the foundational years in pre-school are crucial for a child's lifelong learning journey and overall development.",
    imageUrl: "https://placehold.co/600x400.png",
    imageHint: "children learning",
    slug: "importance-early-childhood-education"
  },
  {
    title: "Fostering a Love for Reading in Primary Students",
    date: "March 5, 2025",
    author: "Mr. David Lee, Grade 3 Teacher",
    excerpt: "Tips and strategies for parents and educators to encourage primary school children to develop a passion for reading.",
    imageUrl: "https://placehold.co/600x400.png",
    imageHint: "child reading book",
    slug: "fostering-love-for-reading"
  },
  {
    title: "Navigating Junior Secondary: A Guide for Students and Parents",
    date: "March 12, 2025",
    author: "Ms. Sarah Chen, School Counselor",
    excerpt: "Practical advice for students transitioning to junior secondary and how parents can support them during this important phase.",
    imageUrl: "https://placehold.co/600x400.png",
    imageHint: "teenager student",
    slug: "navigating-junior-secondary"
  },
  {
    title: "The Role of Extracurricular Activities in Holistic Development",
    date: "March 19, 2025",
    author: "Mr. Tom Baker, Sports Coordinator",
    excerpt: "Exploring how activities like sports, music, and clubs contribute to a well-rounded education and personal growth.",
    imageUrl: "https://placehold.co/600x400.png",
    imageHint: "students playing sports",
    slug: "role-extracurricular-activities"
  }
];

export default function BlogPage() {
  return (
    <div>
      <PageHeader
        title="School Blog"
        subtitle="Stay informed with news, insights, and stories from the Sibiah Star School community."
      />

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {sampleBlogPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sampleBlogPosts.map((post) => (
                <BlogPostCard key={post.slug} {...post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-xl text-muted-foreground">No blog posts available yet. Please check back soon!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// Placeholder for individual blog post page structure
// src/app/blog/[slug]/page.tsx
// export default function BlogPostDetailPage({ params }: { params: { slug: string } }) {
//   // Fetch blog post details based on params.slug
//   return ( <div>Blog Post: {params.slug} content here...</div> )
// }
