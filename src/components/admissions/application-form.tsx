'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { applicationSchema, type ApplicationInput, type ApplicationValues } from '@/lib/admissions/schema';
import { HOW_HEARD, RELATIONSHIPS, STAGE_LABEL, STAGE_ORDER } from '@/lib/admissions/constants';
import { submitApplication } from '@/app/admissions/apply/actions';
import type { GradeStage } from '@/lib/supabase/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export interface ApplyCampus {
  id: string;
  name: string;
  slug: string;
  admissionsOpen: boolean;
  grades: { id: string; name: string; stage: GradeStage }[];
}

const today = new Date();

export function ApplicationForm({ campuses, defaultCampusId }: { campuses: ApplyCampus[]; defaultCampusId?: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  const form = useForm<ApplicationInput, unknown, ApplicationValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      campusId: defaultCampusId ?? (campuses.length === 1 ? campuses[0].id : ''),
      gradeId: '',
      intakeYear: today.getMonth() >= 8 ? today.getFullYear() + 1 : today.getFullYear(),
      intakeTerm: 1,
      studentFirstName: '', studentMiddleName: '', studentLastName: '',
      dateOfBirth: '', gender: undefined, nationality: 'Kenyan', birthCertNumber: '',
      previousSchool: '', previousGrade: '', medicalNotes: '', specialNeeds: '',
      guardianName: '', guardianRelationship: '', guardianPhone: '', guardianEmail: '',
      guardianOccupation: '', guardianAddress: '',
      guardian2Name: '', guardian2Relationship: '', guardian2Phone: '',
      howHeard: '', wantsTransport: false, consent: false, website: '',
    },
  });

  const campusId = form.watch('campusId');
  const campus = campuses.find((c) => c.id === campusId);
  const groupedGrades = useMemo(
    () =>
      STAGE_ORDER.map((stage) => ({
        stage,
        grades: (campus?.grades ?? []).filter((g) => g.stage === stage),
      })).filter((g) => g.grades.length > 0),
    [campus],
  );
  const years = [today.getFullYear(), today.getFullYear() + 1, today.getFullYear() + 2];

  function onSubmit(values: ApplicationValues) {
    setError(null);
    startTransition(async () => {
      const result = await submitApplication(values as unknown as ApplicationInput);
      if (result.ok) {
        setReference(result.reference);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(result.error);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  if (reference) {
    return (
      <Card className="mx-auto max-w-2xl border-green-200">
        <CardContent className="space-y-5 p-8 text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-green-600" />
          <h2 className="text-2xl font-bold text-primary">Application received</h2>
          <p className="text-muted-foreground">
            Thank you. Please keep your reference number — you will need it, with your phone number, to check progress at any time.
          </p>
          <div className="rounded-lg bg-muted px-6 py-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Your reference number</p>
            <p className="mt-1 select-all font-mono text-2xl font-bold text-primary">{reference}</p>
          </div>
          <ol className="mx-auto max-w-md space-y-2 text-left text-sm text-muted-foreground">
            <li><strong className="text-foreground">1.</strong> The admissions office reviews your application.</li>
            <li><strong className="text-foreground">2.</strong> We may invite your child for a short assessment or interview.</li>
            <li><strong className="text-foreground">3.</strong> You receive an offer, then the school completes enrolment.</li>
          </ol>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button asChild><Link href="/admissions/status">Track my application</Link></Button>
            <Button asChild variant="outline"><Link href="/">Back to home</Link></Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mx-auto max-w-3xl space-y-6" noValidate>
        {error && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
        )}

        <Card>
          <CardHeader><CardTitle className="text-lg text-primary">1. School and class</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="campusId" render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>School</FormLabel>
                <Select value={field.value} onValueChange={(v) => { field.onChange(v); form.setValue('gradeId', ''); }}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Choose a school" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {campuses.map((c) => (
                      <SelectItem key={c.id} value={c.id} disabled={!c.admissionsOpen}>
                        {c.name}{!c.admissionsOpen ? ' (applications closed)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="gradeId" render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Class applying for</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={!campus}>
                  <FormControl><SelectTrigger><SelectValue placeholder={campus ? 'Choose a class' : 'Choose a school first'} /></SelectTrigger></FormControl>
                  <SelectContent>
                    {groupedGrades.map((group) => (
                      <div key={group.stage}>
                        <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{STAGE_LABEL[group.stage]}</p>
                        {group.grades.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="intakeYear" render={({ field }) => (
              <FormItem>
                <FormLabel>Year of entry</FormLabel>
                <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>{years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="intakeTerm" render={({ field }) => (
              <FormItem>
                <FormLabel>Term of entry</FormLabel>
                <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>{[1, 2, 3].map((t) => <SelectItem key={t} value={String(t)}>Term {t}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg text-primary">2. About the child</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <FormField control={form.control} name="studentFirstName" render={({ field }) => (
              <FormItem><FormLabel>First name</FormLabel><FormControl><Input autoComplete="off" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="studentMiddleName" render={({ field }) => (
              <FormItem><FormLabel>Middle name <span className="text-muted-foreground">(optional)</span></FormLabel><FormControl><Input autoComplete="off" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="studentLastName" render={({ field }) => (
              <FormItem><FormLabel>Last name</FormLabel><FormControl><Input autoComplete="off" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
              <FormItem><FormLabel>Date of birth</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="gender" render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select value={field.value ?? ''} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger></FormControl>
                  <SelectContent><SelectItem value="female">Girl</SelectItem><SelectItem value="male">Boy</SelectItem></SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="nationality" render={({ field }) => (
              <FormItem><FormLabel>Nationality</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="birthCertNumber" render={({ field }) => (
              <FormItem><FormLabel>Birth certificate no. <span className="text-muted-foreground">(optional)</span></FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="previousSchool" render={({ field }) => (
              <FormItem><FormLabel>Previous school <span className="text-muted-foreground">(if any)</span></FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="previousGrade" render={({ field }) => (
              <FormItem><FormLabel>Last class attended</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="medicalNotes" render={({ field }) => (
              <FormItem className="sm:col-span-3">
                <FormLabel>Medical information <span className="text-muted-foreground">(allergies, conditions — optional)</span></FormLabel>
                <FormControl><Textarea rows={2} {...field} /></FormControl><FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="specialNeeds" render={({ field }) => (
              <FormItem className="sm:col-span-3">
                <FormLabel>Learning needs or support <span className="text-muted-foreground">(optional)</span></FormLabel>
                <FormControl><Textarea rows={2} {...field} /></FormControl><FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg text-primary">3. Parent or guardian</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="guardianName" render={({ field }) => (
              <FormItem><FormLabel>Full name</FormLabel><FormControl><Input autoComplete="name" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="guardianRelationship" render={({ field }) => (
              <FormItem>
                <FormLabel>Relationship to child</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger></FormControl>
                  <SelectContent>{RELATIONSHIPS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="guardianPhone" render={({ field }) => (
              <FormItem>
                <FormLabel>Phone number</FormLabel>
                <FormControl><Input type="tel" inputMode="tel" autoComplete="tel" placeholder="0712 345 678" {...field} /></FormControl>
                <FormDescription>We use this to contact you and to let you track your application.</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="guardianEmail" render={({ field }) => (
              <FormItem><FormLabel>Email <span className="text-muted-foreground">(optional)</span></FormLabel><FormControl><Input type="email" autoComplete="email" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="guardianOccupation" render={({ field }) => (
              <FormItem><FormLabel>Occupation <span className="text-muted-foreground">(optional)</span></FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="guardianAddress" render={({ field }) => (
              <FormItem><FormLabel>Home area / address <span className="text-muted-foreground">(optional)</span></FormLabel><FormControl><Input autoComplete="street-address" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <p className="sm:col-span-2 pt-2 text-sm font-medium text-primary">Second contact <span className="font-normal text-muted-foreground">(optional)</span></p>
            <FormField control={form.control} name="guardian2Name" render={({ field }) => (
              <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="guardian2Phone" render={({ field }) => (
              <FormItem><FormLabel>Phone</FormLabel><FormControl><Input type="tel" inputMode="tel" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg text-primary">4. A few last things</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="howHeard" render={({ field }) => (
              <FormItem>
                <FormLabel>How did you hear about us? <span className="text-muted-foreground">(optional)</span></FormLabel>
                <Select value={field.value ?? ''} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger></FormControl>
                  <SelectContent>{HOW_HEARD.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                </Select>
              </FormItem>
            )} />
            <FormField control={form.control} name="wantsTransport" render={({ field }) => (
              <FormItem className="flex items-start gap-3 space-y-0">
                <FormControl><Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} /></FormControl>
                <FormLabel className="font-normal">My child will need school transport</FormLabel>
              </FormItem>
            )} />
            <FormField control={form.control} name="consent" render={({ field }) => (
              <FormItem>
                <div className="flex items-start gap-3">
                  <FormControl><Checkbox checked={field.value === true} onCheckedChange={(v) => field.onChange(v === true)} /></FormControl>
                  <FormLabel className="font-normal leading-snug">
                    I confirm the information given is true, and I allow the school to contact me and to keep this information for admissions purposes, as explained in the <Link href="/privacy" target="_blank" className="text-primary underline">privacy notice</Link>.
                  </FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )} />
            {/* Honeypot — hidden from people, irresistible to bots. */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label>Website<input tabIndex={-1} autoComplete="off" {...form.register('website')} /></label>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col items-center gap-3">
          <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto sm:min-w-64">
            {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting…</> : 'Submit application'}
          </Button>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" /> Your details are only seen by the school’s admissions staff.
          </p>
        </div>
      </form>
    </Form>
  );
}
