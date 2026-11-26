import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getAdminContext } from '@/lib/admissions/admin-queries';
import { CommentsPanel } from '@/components/exams/comments-panel';

export const dynamic = 'force-dynamic';

export default async function AdminCommentsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ class?: string; error?: string; ok?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const ctx = await getAdminContext();
  return (
    <div className="max-w-3xl space-y-5">
      <Link href={`/admin/exams/${id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-1 h-4 w-4" />Exam</Link>
      <h1 className="text-2xl font-semibold text-primary">Report comments</h1>
      {sp.error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{sp.error}</p>}
      {sp.ok && <p role="status" className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">{sp.ok}</p>}
      {sp.class && /^[0-9a-f-]{36}$/i.test(sp.class) ? <CommentsPanel supabase={ctx.supabase} classId={sp.class} examId={id} returnTo="admin" isStaff /> : <p className="text-sm text-muted-foreground">Choose a class from the exam page.</p>}
    </div>
  );
}
