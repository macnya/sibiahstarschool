import Link from 'next/link';
import { getAllPosts } from '@/lib/queries';
import { deletePost } from '../../actions';
import { DeleteButton } from '@/components/admin/delete-button';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminBlogPage() {
  const posts = await getAllPosts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-primary">Blog</h1>
        <Button asChild size="sm">
          <Link href="/admin/blog/new">
            <Plus className="mr-1.5 h-4 w-4" /> Write post
          </Link>
        </Button>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No posts yet.</p>
          <Button asChild size="sm" className="mt-4">
            <Link href="/admin/blog/new">Write your first post</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">Author</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/blog/${post.id}`} className="hover:underline">
                      {post.title}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {post.author}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {new Date(`${post.published_at}T00:00:00`).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={post.published ? 'default' : 'secondary'}>
                      {post.published ? 'Live' : 'Draft'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/blog/${post.id}`}>Edit</Link>
                      </Button>
                      <DeleteButton
                        action={deletePost}
                        id={post.id}
                        confirmText={`Delete "${post.title}"? This cannot be undone.`}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
