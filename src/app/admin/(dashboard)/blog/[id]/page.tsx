import { notFound } from 'next/navigation';
import { getPostById } from '@/lib/queries';
import { PostForm } from '@/components/admin/post-form';

export const dynamic = 'force-dynamic';

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-primary">Edit post</h1>
      <PostForm post={post} />
    </div>
  );
}
