import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { saveCampusGrades, updateCampus } from '@/app/admin/admissions-actions';
import { getCampusesAndGrades, requireGroupAdmin } from '@/lib/admissions/admin-queries';
import { STAGE_LABEL, STAGE_ORDER } from '@/lib/admissions/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export const dynamic = 'force-dynamic';

export default async function CampusDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { id } = await params;
  const { error, ok } = await searchParams;
  const { supabase } = await requireGroupAdmin();
  const { campuses, grades } = await getCampusesAndGrades();
  const campus = campuses.find((c) => c.id === id);
  if (!campus) notFound();

  const { data: links } = await supabase.from('campus_grades').select('*').eq('campus_id', id);
  const offered = new Map(((links ?? []) as { grade_id: string; capacity: number }[]).map((l) => [l.grade_id, l.capacity]));

  return (
    <div className="space-y-6">
      <Link href="/admin/campuses" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" />All schools
      </Link>
      <div>
        <h1 className="text-2xl font-semibold text-primary">{campus.name}</h1>
        <p className="font-mono text-xs text-muted-foreground">{campus.code} · public page: /schools/{campus.slug}</p>
      </div>

      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      {ok && <div role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{ok}</div>}

      <Card>
        <CardHeader><CardTitle className="text-base">School details</CardTitle></CardHeader>
        <CardContent>
          <form action={updateCampus} className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="id" value={campus.id} />
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="name">School name</Label><Input id="name" name="name" required minLength={3} maxLength={120} defaultValue={campus.name} /></div>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="tagline">Tagline</Label><Input id="tagline" name="tagline" maxLength={160} defaultValue={campus.tagline ?? ''} /></div>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="description">About the school</Label><Textarea id="description" name="description" rows={4} maxLength={4000} defaultValue={campus.description ?? ''} /></div>
            <div className="space-y-2"><Label htmlFor="address">Address</Label><Input id="address" name="address" maxLength={200} defaultValue={campus.address ?? ''} /></div>
            <div className="space-y-2"><Label htmlFor="town">Town</Label><Input id="town" name="town" maxLength={80} defaultValue={campus.town ?? ''} /></div>
            <div className="space-y-2"><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" maxLength={40} defaultValue={campus.phone ?? ''} /></div>
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" maxLength={120} defaultValue={campus.email ?? ''} /></div>
            <div className="space-y-2"><Label htmlFor="website_url">Website</Label><Input id="website_url" name="website_url" maxLength={300} defaultValue={campus.website_url ?? ''} /></div>
            <div className="space-y-2"><Label htmlFor="map_url">Google Maps link</Label><Input id="map_url" name="map_url" maxLength={400} defaultValue={campus.map_url ?? ''} /></div>
            <fieldset className="space-y-4 rounded-lg border p-4 sm:col-span-2">
              <legend className="px-2 text-sm font-semibold text-primary">How parents pay fees</legend>
              <p className="text-xs text-muted-foreground">Fill in only what this school uses. Parents see exactly these instructions on the fees page and on invoices.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="paybill_number">M-Pesa Paybill number</Label><Input id="paybill_number" name="paybill_number" maxLength={20} defaultValue={campus.paybill_number ?? ''} placeholder="e.g. 247247" /></div>
                <div className="space-y-2"><Label htmlFor="paybill_account_format">Paybill account number <span className="text-muted-foreground">(a Paybill always asks for one)</span></Label><Input id="paybill_account_format" name="paybill_account_format" maxLength={80} defaultValue={campus.paybill_account_format ?? ''} placeholder="empty = child’s admission number" /><p className="text-xs text-muted-foreground">Use {'{admission}'} for the child’s number, e.g. <code>{'FEES{admission}'}</code>, or type one fixed account for everyone.</p></div>
                <div className="space-y-2"><Label htmlFor="till_number">M-Pesa Till number <span className="text-muted-foreground">(Buy Goods, no account number)</span></Label><Input id="till_number" name="till_number" maxLength={20} defaultValue={campus.till_number ?? ''} /></div>
                <div className="space-y-2"><Label htmlFor="kcb_till_number">KCB Lipa Karo school number</Label><Input id="kcb_till_number" name="kcb_till_number" maxLength={30} defaultValue={campus.kcb_till_number ?? ''} /></div>
                <div className="space-y-2"><Label htmlFor="kcb_paybill_number">KCB Paybill number</Label><Input id="kcb_paybill_number" name="kcb_paybill_number" maxLength={30} defaultValue={campus.kcb_paybill_number ?? ''} placeholder="e.g. 522522" /></div>
                <div className="space-y-2"><Label htmlFor="kcb_account_format">KCB account number format</Label><Input id="kcb_account_format" name="kcb_account_format" maxLength={80} defaultValue={campus.kcb_account_format ?? ''} placeholder="{till}#{admission}" /><p className="text-xs text-muted-foreground">{'{till}'} = the KCB school number above. Default: <code>{'{till}#{admission}'}</code>.</p></div>
              </div>
            </fieldset>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="payment_instructions">Other payment instructions <span className="text-muted-foreground">(bank account, branch…)</span></Label><Textarea id="payment_instructions" name="payment_instructions" rows={3} maxLength={600} defaultValue={campus.payment_instructions ?? ''} /></div>
            <div className="flex flex-wrap gap-6 sm:col-span-2">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" defaultChecked={campus.is_active} /> Show this school on the website</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="admissions_open" defaultChecked={campus.admissions_open} /> Accepting online applications</label>
            </div>
            <div className="sm:col-span-2"><Button type="submit">Save details</Button></div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Classes and capacity</CardTitle></CardHeader>
        <CardContent>
          <form action={saveCampusGrades} className="space-y-5">
            <input type="hidden" name="id" value={campus.id} />
            <div className="grid gap-6 sm:grid-cols-2">
              {STAGE_ORDER.map((stage) => (
                <div key={stage}>
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">{STAGE_LABEL[stage]}</p>
                  <div className="space-y-1.5">
                    {grades.filter((g) => g.stage === stage).map((g) => (
                      <div key={g.id} className="flex items-center gap-3">
                        <label className="flex w-28 items-center gap-2 text-sm">
                          <input type="checkbox" name={`offer_${g.id}`} defaultChecked={offered.has(g.id)} /> {g.name}
                        </label>
                        <Input name={`capacity_${g.id}`} type="number" min={0} max={500} defaultValue={offered.get(g.id) ?? 30} className="h-8 w-20" aria-label={`${g.name} capacity`} />
                        <span className="text-xs text-muted-foreground">places</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Button type="submit">Save classes</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
