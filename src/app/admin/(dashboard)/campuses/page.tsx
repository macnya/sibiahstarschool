import Link from 'next/link';
import { Plus } from 'lucide-react';
import { createCampus } from '@/app/admin/admissions-actions';
import { getCampusesAndGrades, requireGroupAdmin } from '@/lib/admissions/admin-queries';
import { STAGE_LABEL, STAGE_ORDER } from '@/lib/admissions/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export const dynamic = 'force-dynamic';

export default async function CampusesPage({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const { error, ok } = await searchParams;
  const { supabase } = await requireGroupAdmin();
  const { campuses, grades } = await getCampusesAndGrades();
  const { data: links } = await supabase.from('campus_grades').select('campus_id');
  const gradeCount = new Map<string, number>();
  for (const l of (links ?? []) as { campus_id: string }[]) gradeCount.set(l.campus_id, (gradeCount.get(l.campus_id) ?? 0) + 1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-primary">Schools</h1>
        <p className="text-sm text-muted-foreground">
          Every school or campus in the group. Add a new one whenever the group opens another campus — it appears on the website straight away.
        </p>
      </div>

      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      {ok && <div role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{ok}</div>}

      <div className="grid gap-4 md:grid-cols-2">
        {campuses.map((c) => (
          <Card key={c.id}>
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div>
                <p className="font-semibold text-primary">{c.name}</p>
                <p className="font-mono text-xs text-muted-foreground">{c.code} · /schools/{c.slug}</p>
                <p className="mt-1 text-sm text-muted-foreground">{gradeCount.get(c.id) ?? 0} classes offered</p>
                <div className="mt-2 flex gap-1.5">
                  <Badge variant={c.is_active ? 'default' : 'secondary'}>{c.is_active ? 'Visible' : 'Hidden'}</Badge>
                  <Badge variant={c.admissions_open ? 'default' : 'secondary'}>{c.admissions_open ? 'Admissions open' : 'Admissions closed'}</Badge>
                </div>
              </div>
              <Button asChild variant="outline" size="sm"><Link href={`/admin/campuses/${c.id}`}>Manage</Link></Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Plus className="h-5 w-5" />Add a school</CardTitle></CardHeader>
        <CardContent>
          <form action={createCampus} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">School name</Label>
              <Input id="name" name="name" required minLength={3} maxLength={120} placeholder="e.g. Sibiah Star Junior Academy" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Short code <span className="text-muted-foreground">(2–6 capital letters, used in admission numbers)</span></Label>
              <Input id="code" name="code" required pattern="[A-Za-z]{2,6}" maxLength={6} placeholder="SSJ" className="uppercase" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input id="tagline" name="tagline" maxLength={160} placeholder="Pre-school to Grade 3" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">About the school</Label>
              <Textarea id="description" name="description" rows={3} maxLength={4000} />
            </div>
            <div className="space-y-2"><Label htmlFor="address">Address</Label><Input id="address" name="address" maxLength={200} /></div>
            <div className="space-y-2"><Label htmlFor="town">Town</Label><Input id="town" name="town" maxLength={80} /></div>
            <div className="space-y-2"><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" maxLength={40} /></div>
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" maxLength={120} /></div>
            <div className="space-y-2"><Label htmlFor="website_url">Website</Label><Input id="website_url" name="website_url" maxLength={300} placeholder="https://" /></div>
            <div className="space-y-2"><Label htmlFor="map_url">Google Maps link</Label><Input id="map_url" name="map_url" maxLength={400} placeholder="https://maps.google.com/…" /></div>

            <div className="space-y-2"><Label htmlFor="paybill_number">M-Pesa Paybill number</Label><Input id="paybill_number" name="paybill_number" maxLength={20} /></div>
            <div className="space-y-2"><Label htmlFor="till_number">M-Pesa Till number</Label><Input id="till_number" name="till_number" maxLength={20} /></div>
            <fieldset className="sm:col-span-2">
              <legend className="mb-2 text-sm font-medium">Classes this school offers</legend>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {STAGE_ORDER.map((stage) => (
                  <div key={stage}>
                    <p className="mb-1.5 text-xs font-semibold text-muted-foreground">{STAGE_LABEL[stage]}</p>
                    {grades.filter((g) => g.stage === stage).map((g) => (
                      <label key={g.id} className="flex items-center gap-2 py-0.5 text-sm">
                        <input type="checkbox" name="grade_id" value={g.id} defaultChecked /> {g.name}
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            </fieldset>

            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" name="admissions_open" defaultChecked /> Accepting online applications
            </label>
            <div className="sm:col-span-2"><Button type="submit">Add school</Button></div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
