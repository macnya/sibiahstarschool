import { PostForm } from '@/components/admin/post-form';

export default function NewPostPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-primary">Write post</h1>
      <PostForm />
    </div>
  );
}
