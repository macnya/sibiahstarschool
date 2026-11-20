import Link from 'next/link';
import { createFeeItem, saveFeeStructure, saveTerm, setCurrentTerm, toggleFeeItem } from '@/app/admin/fees-actions';
import { getAdminContext, getCampusesAndGrades } from '@/lib/admissions/admin-queries';
import { getFeeItems, getFeeStructure, getTerms } from '@/lib/fees/admin-queries';
import { formatDate } from '@/lib/admissions/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export const dynamic = 'force-dynamic';

type SP = { campus?: string; year?: string; term?: string; error?: string; ok?: string };

export default async function FeeSetupPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const ctx = await getAdminContext();
  const [terms, items, { campuses, grades }] = await Promise.all([getTerms(), getFeeItems(), getCampusesAndGrades()]);

  const myCampuses = ctx.campusId ? campuses.filter((c) => c.id === ctx.campusId) : campuses;
  const campus = myCampuses.find((c) => c.id === sp.campus) ?? myCampuses[0];
  const now = new Date().getFullYear();
  const year = Number(sp.year) || terms.find((t) => t.is_current)?.year || now;
  const term = [1, 2, 3].includes(Number(sp.term)) ? Number(sp.term) : 1;

  const structure = campus ? await getFeeStructure(campus.id, year) : [];
  const amount = (gradeId: string, itemId: string) => structure.find((r) => r.grade_id === gradeId && r.fee_item_id === itemId && r.term_number === term)?.amount_cents;
  let offered: string[] = [];
  if (campus) {
    const { data } = await ctx.supabase.from('campus_grades').select('grade_id').eq('campus_id', campus.id);
    offered = ((data ?? []) as { grade_id: string }[]).map((r) => r.grade_id);
  }
  const campusGrades = grades.filter((g) => offered.includes(g.id));
  const activeItems = items.filter((i) => i.is_active);

  return (
    <div className="space-y-8">
      {sp.error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{sp.error}</div>}
      {sp.ok && <div role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{sp.ok}</div>}

      <Card>
        <CardHeader><CardTitle className="text-base">1. Fee structure — what each class pays</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <form className="flex flex-wrap items-end gap-3">
            {myCampuses.length > 1 && (
              <div>
                <label htmlFor="campus" className="mb-1 block text-xs text-muted-foreground">School</label>
                <select id="campus" name="campus" defaultValue={campus?.id} className="h-10 rounded-md border bg-background px-3 text-sm">
                  {myCampuses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label htmlFor="year" className="mb-1 block text-xs text-muted-foreground">Year</label>
              <Input id="year" name="year" type="number" min={2000} max={2100} defaultValue={year} className="w-24" />
            </div>
            <div>
              <label htmlFor="term" className="mb-1 block text-xs text-muted-foreground">Term</label>
              <select id="term" name="term" defaultValue={term} className="h-10 rounded-md border bg-background px-3 text-sm">
                {[1, 2, 3].map((t) => <option key={t} value={t}>Term {t}</option>)}
              </select>
            </div>
            <Button type="submit" variant="outline">Show</Button>
          </form>

          {!campus ? <p className="text-sm text-muted-foreground">Add a school first.</p> : campusGrades.length === 0 ? (
            <p className="text-sm text-muted-foreground">This school has no classes yet. Set them under Schools → Manage.</p>
          ) : activeItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">Add fee types below first (Tuition, Lunch…).</p>
          ) : (
            <form action={saveFeeStructure} className="space-y-4">
              <input type="hidden" name="campus_id" value={campus.id} />
              <input type="hidden" name="year" value={year} />
              <input type="hidden" name="term" value={term} />
              <p className="text-sm text-muted-foreground">
                Amounts in KES per child for <strong>{campus.name}</strong>, Term {term} {year}. Leave a box empty if a class does not pay that fee.
                Optional fees (marked ✱) are only charged to children who take them.
              </p>
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs">
                    <tr>
                      <th className="p-2">Class</th>
                      {activeItems.map((i) => <th key={i.id} className="p-2">{i.name}{i.is_optional ? ' ✱' : ''}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {campusGrades.map((g) => (
                      <tr key={g.id} className="border-t">
                        <td className="p-2 font-medium whitespace-nowrap">{g.name}</td>
                        {activeItems.map((i) => (
                          <td key={i.id} className="p-1">
                            <Input name={`amt_${g.id}_${i.id}`} inputMode="decimal" defaultValue={amount(g.id, i.id) ? String(amount(g.id, i.id)! / 100) : ''} className="h-8 w-28" aria-label={`${g.name} ${i.name}`} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="apply_all_terms" /> Use these amounts for all three terms of {year}</label>
              <Button type="submit">Save fees</Button>
            </form>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">2. Terms</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {terms.length === 0 && <p className="text-sm text-muted-foreground">No terms yet. Add Term 1 of this year to begin.</p>}
            <ul className="divide-y text-sm">
              {terms.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-2">
                  <div>
                    <span className="font-medium">{t.name} {t.year}</span>
                    {t.is_current && <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">Current</span>}
                    <p className="text-xs text-muted-foreground">{formatDate(t.start_date)} – {formatDate(t.end_date)} · fees due {formatDate(t.due_date)}</p>
                  </div>
                  {!t.is_current && ctx.isGroupAdmin && (
                    <form action={setCurrentTerm}><input type="hidden" name="id" value={t.id} /><Button type="submit" size="sm" variant="outline">Make current</Button></form>
                  )}
                </li>
              ))}
            </ul>
            {ctx.isGroupAdmin ? (
              <form action={saveTerm} className="grid grid-cols-2 gap-3 border-t pt-4">
                <div><label className="mb-1 block text-xs text-muted-foreground" htmlFor="ty">Year</label><Input id="ty" name="year" type="number" defaultValue={now} required /></div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground" htmlFor="tn">Term</label>
                  <select id="tn" name="number" className="h-10 w-full rounded-md border bg-background px-3 text-sm">{[1, 2, 3].map((t) => <option key={t} value={t}>Term {t}</option>)}</select>
                </div>
                <div><label className="mb-1 block text-xs text-muted-foreground" htmlFor="ts">Opens</label><Input id="ts" name="start_date" type="date" /></div>
                <div><label className="mb-1 block text-xs text-muted-foreground" htmlFor="te">Closes</label><Input id="te" name="end_date" type="date" /></div>
                <div className="col-span-2"><label className="mb-1 block text-xs text-muted-foreground" htmlFor="td">Fees due by</label><Input id="td" name="due_date" type="date" /></div>
                <div className="col-span-2"><Button type="submit" variant="outline">Add / update term</Button></div>
              </form>
            ) : <p className="text-xs text-muted-foreground">Only group administrators can change terms.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">3. Fee types</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <ul className="divide-y text-sm">
              {items.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 py-2">
                  <span className={i.is_active ? '' : 'text-muted-foreground line-through'}>{i.name}{i.is_optional ? ' ✱ optional' : ''}</span>
                  {ctx.isGroupAdmin && (
                    <form action={toggleFeeItem}>
                      <input type="hidden" name="id" value={i.id} />
                      <input type="hidden" name="active" value={i.is_active ? '0' : '1'} />
                      <Button type="submit" size="sm" variant="ghost">{i.is_active ? 'Hide' : 'Show'}</Button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
            {ctx.isGroupAdmin && (
              <form action={createFeeItem} className="space-y-3 border-t pt-4">
                <Input name="name" placeholder="e.g. Swimming, Exam fee, Boarding" required minLength={2} maxLength={80} />
                <select name="kind" className="h-10 w-full rounded-md border bg-background px-3 text-sm" defaultValue="other">
                  <option value="tuition">Tuition</option><option value="meals">Meals</option><option value="transport">Transport</option>
                  <option value="activity">Activity</option><option value="exam">Exam</option><option value="admission">Admission</option><option value="other">Other</option>
                </select>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_optional" /> Optional (only for children who take it)</label>
                <Button type="submit" variant="outline">Add fee type</Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
      <p className="text-xs text-muted-foreground">Payment details (Paybill / Till) are set per school under <Link href="/admin/campuses" className="underline">Schools</Link>.</p>
    </div>
  );
}
