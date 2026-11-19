import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { getApplication, requireAdmissionsStaff } from '@/lib/admissions/admin-queries';
import { CAN_ENROL, NEXT_STATUSES, STATUS_LABEL, STATUS_TONE, formatDate } from '@/lib/admissions/constants';
import { changeApplicationStatus, enrolApplication, saveApplicationNotes } from '@/app/admin/admissions-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

export const dynamic = 'force-dynamic';

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm">{value || <span className="text-muted-foreground">—</span>}</dd>
    </div>
  );
}

export default async function ApplicationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { id } = await params;
  const { error, ok } = await searchParams;
  await requireAdmissionsStaff();
  const data = await getApplication(id);
  if (!data) notFound();
  const { application: a, events, campus, grade, student } = data;
  const next = NEXT_STATUSES[a.status];

  return (
    <div className="space-y-6">
      <Link href="/admin/admissions" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" />All applications
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-primary">{a.student_first_name} {a.student_middle_name} {a.student_last_name}</h1>
          <p className="font-mono text-sm text-muted-foreground">{a.reference}</p>
          <p className="text-sm text-muted-foreground">{campus?.name} · {grade?.name} · {a.intake_year} Term {a.intake_term}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_TONE[a.status]}`}>{STATUS_LABEL[a.status]}</span>
      </div>

      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      {ok && <div role="status" className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"><CheckCircle2 className="h-4 w-4" />{ok}</div>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Child</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-3">
                <Field label="Date of birth" value={formatDate(a.date_of_birth)} />
                <Field label="Gender" value={a.gender === 'female' ? 'Girl' : 'Boy'} />
                <Field label="Nationality" value={a.nationality} />
                <Field label="Birth certificate no." value={a.birth_cert_number} />
                <Field label="Previous school" value={a.previous_school} />
                <Field label="Last class attended" value={a.previous_grade} />
                <div className="sm:col-span-3"><Field label="Medical information" value={a.medical_notes} /></div>
                <div className="sm:col-span-3"><Field label="Learning needs / support" value={a.special_needs} /></div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Parent / guardian</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <Field label="Name" value={`${a.guardian_name} (${a.guardian_relationship})`} />
                <Field label="Phone" value={a.guardian_phone} />
                <Field label="Email" value={a.guardian_email} />
                <Field label="Occupation" value={a.guardian_occupation} />
                <div className="sm:col-span-2"><Field label="Address" value={a.guardian_address} /></div>
                {(a.guardian2_name || a.guardian2_phone) && (
                  <div className="sm:col-span-2"><Field label="Second contact" value={[a.guardian2_name, a.guardian2_relationship, a.guardian2_phone].filter(Boolean).join(' · ')} /></div>
                )}
                <Field label="Needs transport" value={a.wants_transport ? 'Yes' : 'No'} />
                <Field label="Heard about us" value={a.how_heard} />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Internal notes <span className="text-xs font-normal text-muted-foreground">(never shown to the family)</span></CardTitle></CardHeader>
            <CardContent>
              <form action={saveApplicationNotes} className="space-y-3">
                <input type="hidden" name="id" value={a.id} />
                <Textarea name="internal_notes" rows={4} defaultValue={a.internal_notes ?? ''} maxLength={4000} />
                <Button type="submit" variant="outline" size="sm">Save notes</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {a.status === 'enrolled' && student ? (
            <Card className="border-green-300">
              <CardHeader><CardTitle className="text-base text-green-800">Enrolled</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>Admission number</p>
                <p className="font-mono text-xl font-bold text-primary">{student.admission_number}</p>
                <Button asChild variant="outline" size="sm"><Link href={`/admin/students?q=${encodeURIComponent(student.admission_number)}`}>View student</Link></Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {next.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Move this application</CardTitle></CardHeader>
                  <CardContent>
                    <form action={changeApplicationStatus} className="space-y-3">
                      <input type="hidden" name="id" value={a.id} />
                      <div>
                        <label htmlFor="status" className="mb-1 block text-xs text-muted-foreground">New status</label>
                        <select id="status" name="status" required defaultValue="" className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                          <option value="" disabled>Choose…</option>
                          {next.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="assessment_date" className="mb-1 block text-xs text-muted-foreground">Assessment date <span>(only for “Assessment / interview”)</span></label>
                        <input id="assessment_date" name="assessment_date" type="date" defaultValue={a.assessment_date ?? ''} className="h-10 w-full rounded-md border bg-background px-3 text-sm" />
                      </div>
                      <div>
                        <label htmlFor="decision_note" className="mb-1 block text-xs text-muted-foreground">Message to the family <span>(shown on their tracking page)</span></label>
                        <Textarea id="decision_note" name="decision_note" rows={3} defaultValue={a.decision_note ?? ''} maxLength={1000} />
                      </div>
                      <Button type="submit" className="w-full">Update status</Button>
                    </form>
                  </CardContent>
                </Card>
              )}

              {CAN_ENROL.includes(a.status) && (
                <Card className="border-primary/40">
                  <CardHeader><CardTitle className="text-base">Enrol the child</CardTitle></CardHeader>
                  <CardContent>
                    <p className="mb-3 text-sm text-muted-foreground">Creates the student record and issues the admission number.</p>
                    <form action={enrolApplication}>
                      <input type="hidden" name="id" value={a.id} />
                      <Button type="submit" className="w-full">Enrol student</Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          <Card>
            <CardHeader><CardTitle className="text-base">History</CardTitle></CardHeader>
            <CardContent>
              <ol className="space-y-3 border-l-2 border-muted pl-4">
                {events.map((e) => (
                  <li key={e.id} className="relative text-sm">
                    <span className="absolute -left-[22px] top-1.5 h-2.5 w-2.5 rounded-full bg-accent" />
                    <p className="font-medium">{e.to_status ? STATUS_LABEL[e.to_status as keyof typeof STATUS_LABEL] ?? e.to_status : e.event}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(e.created_at)}</p>
                    {e.note && <p className="mt-0.5 text-xs">{e.note}</p>}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
