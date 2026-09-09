import Link from 'next/link';
import { getDashboardCounts } from '@/lib/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function AdminOverviewPage() {
  const counts = await getDashboardCounts();

  const stats = [
    { label: 'Events',              value: counts.events,                    href: '/admin/events' },
    { label: 'Blog posts',          value: counts.posts,                     href: '/admin/blog' },
    { label: 'Gallery photos',      value: counts.images,                    href: '/admin/gallery' },
    { label: 'New messages',        value: counts.unreadMessages,            href: '/admin/messages' },
    { label: 'Pending scholarship applications', value: counts.pendingScholarshipRequests, href: '/admin/scholarships' },
    { label: 'Pending sponsor offers',           value: counts.pendingSponsorRequests,     href: '/admin/scholarships' },
    { label: 'Active scholarships', value: counts.activeScholarships,        href: '/admin/scholarships' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-primary">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Everything published here appears on the school website straight away.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Card className="h-full transition-colors hover:border-primary/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {s.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-primary">{s.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Common tasks</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild size="sm"><Link href="/admin/events/new">Add an event</Link></Button>
          <Button asChild size="sm" variant="secondary"><Link href="/admin/blog/new">Write a post</Link></Button>
          <Button asChild size="sm" variant="secondary"><Link href="/admin/gallery">Upload photos</Link></Button>
          <Button asChild size="sm" variant="secondary"><Link href="/admin/scholarships">Review scholarships</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}
