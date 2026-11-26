import Link from 'next/link';
import { setStudentRouteAction } from '@/app/admin/staff-actions';
import { notFound } from 'next/navigation';
import { ArrowLeft, Wallet } from 'lucide-react';
import { placeOneStudentAction, removeFromClassAction } from '@/app/admin/classes-actions';
import { requireAdmissionsStaff } from '@/lib/admissions/admin-queries';
import { getStudentProfile } from '@/lib/classes/queries';
import { formatDate } from '@/lib/admissions/constants';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';
const field = 'h-10 rounded-md border bg-background px-3 text-sm';

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="grid grid-cols-3 gap-3 border-b py-2.5 text-sm last:border-0"><dt className="text-muted-foreground">{label}</dt><dd className="col-span-2">{value || '—'}</dd></div>;
}

export default async function StudentProfilePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; ok?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  await requireAdmissionsStaff();
  const p = await getStudentProfile(id);
  if (!p) notFound();
  const s = p.student;
  const here = `/admin/students/${s.id}`;

  return (
    <div className="space-y-6">
      <Link href="/admin/students" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-1 h-4 w-4" />Students</Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-primary">{s.first_name} {s.middle_name} {s.last_name}</h1>
          <p className="text-sm text-muted-foreground"><span className="font-mono">{s.admission_number}</span> · {p.campusName} · {p.gradeName}{s.status !== 'active' && <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs capitalize">{s.status}</span>}</p>
        </div>
        <Button asChild variant="outline"><Link href={`/admin/fees/students/${s.id}`}><Wallet className="mr-1.5 h-4 w-4" />Fee account</Link></Button>
      </div>
      {sp.error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{sp.error}</div>}
      {sp.ok && <div role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{sp.ok}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border bg-card p-5">
          <h2 className="mb-2 text-base font-semibold text-primary">Class</h2>
          <p className="mb-3 text-sm">{p.currentClass ? <>Currently in <strong>{p.currentClass}</strong>.</> : <span className="text-amber-700">Not in a class yet.</span>}</p>
          {p.options.length === 0 ? <p className="text-sm text-muted-foreground">No classes created yet. <Link href="/admin/classes" className="text-primary underline">Create one</Link>.</p> : (
            <form action={placeOneStudentAction} className="flex flex-wrap items-end gap-2">
              <input type="hidden" name="student_id" value={s.id} />
              <div><label htmlFor="class_id" className="mb-1 block text-xs text-muted-foreground">Put in class (this also sets their level)</label>
                <select id="class_id" name="class_id" required defaultValue="" className={field}><option value="" disabled>Choose…</option>{p.options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}</select></div>
              <Button type="submit">Save</Button>
            </form>
          )}
          {s.class_id && (
            <form action={removeFromClassAction} className="mt-3"><input type="hidden" name="student_id" value={s.id} /><input type="hidden" name="next" value={here} /><Button type="submit" variant="ghost" size="sm" className="text-muted-foreground">Take out of this class</Button></form>
          )}
        </section>

        <section className="rounded-lg border bg-card p-5">
          <h2 className="mb-2 text-base font-semibold text-primary">School transport</h2>
          {p.routes.length === 0 ? <p className="text-sm text-muted-foreground">No routes created yet. <Link href="/admin/staff" className="text-primary underline">Add routes</Link> under Staff.</p> : (
            <form action={setStudentRouteAction} className="flex flex-wrap items-end gap-2">
              <input type="hidden" name="student_id" value={s.id} />
              <div><label htmlFor="route_id" className="mb-1 block text-xs text-muted-foreground">Route</label>
                <select id="route_id" name="route_id" defaultValue={s.route_id ?? ''} className={field}><option value="">Not on school transport</option>{p.routes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
              <Button type="submit">Save</Button>
            </form>
          )}
        </section>

        <section className="rounded-lg border bg-card p-5">
          <h2 className="mb-2 text-base font-semibold text-primary">Parent / guardian</h2>
          <dl>
            <Row label="Name" value={s.guardian_name} />
            <Row label="Relationship" value={s.guardian_relationship} />
            <Row label="Phone" value={s.guardian_phone && <a className="text-primary hover:underline" href={`tel:${s.guardian_phone}`}>{s.guardian_phone}</a>} />
            <Row label="Email" value={s.guardian_email} />
            <Row label="Address" value={s.guardian_address} />
            <Row label="Parent accounts" value={p.parentAccounts === 0 ? 'None linked yet' : `${p.parentAccounts} linked`} />
          </dl>
        </section>

        <section className="rounded-lg border bg-card p-5 lg:col-span-2">
          <h2 className="mb-2 text-base font-semibold text-primary">Pupil details</h2>
          <dl className="grid gap-x-8 sm:grid-cols-2">
            <div><Row label="Date of birth" value={s.date_of_birth && formatDate(s.date_of_birth)} /><Row label="Gender" value={<span className="capitalize">{s.gender}</span>} /><Row label="UPI number" value={s.upi_number} /></div>
            <div><Row label="Enrolled" value={formatDate(s.enrolled_on)} /><Row label="Medical notes" value={s.medical_notes} /><Row label="Special needs" value={s.special_needs} /></div>
          </dl>
          {s.application_id && <p className="mt-3 text-sm"><Link href={`/admin/admissions/${s.application_id}`} className="text-primary underline">View the original application</Link></p>}
        </section>
      </div>
    </div>
  );
}
