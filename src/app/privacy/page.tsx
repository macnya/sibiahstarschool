import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';

export const metadata: Metadata = {
  title: 'Privacy notice',
  description: 'How Sibiah Star School collects, uses and protects the personal information of pupils, parents and visitors, under the Kenya Data Protection Act, 2019.',
};

const CONTACT_EMAIL = 'sibiahstarschool@gmail.com';

export default function PrivacyPage() {
  const h2 = 'display-title mt-10 text-2xl text-primary';
  const p = 'mt-3 leading-relaxed text-muted-foreground';
  const li = 'mt-2 leading-relaxed text-muted-foreground';
  return (
    <>
      <PageHeader eyebrow="Your information" title="Privacy notice" subtitle="How we collect, use and protect the personal information of our pupils, parents and visitors." />
      <section className="section-pad">
        <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-muted-foreground">Last updated: November 2026. This notice applies to this website and to the school’s admissions, pupil records and fees systems.</p>

          <h2 className={h2}>Who we are</h2>
          <p className={p}>
            Sibiah Star School (and any other campus run by the same management, listed under <Link href="/schools" className="text-primary underline">Our Schools</Link>) decides why and how your
            information is used. That makes us the “data controller” under the Kenya Data Protection Act, 2019. Questions about this notice: <a className="text-primary underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>

          <h2 className={h2}>What we collect</h2>
          <ul className="list-disc pl-6">
            <li className={li}><strong>Admission applications:</strong> the child’s name, date of birth, gender, class applied for, previous school, medical or special-needs notes you choose to give; the parent or guardian’s name, relationship, phone, email and address.</li>
            <li className={li}><strong>Pupil records:</strong> admission number, class, guardian contacts, attendance in the school’s systems, and any UPI number supplied.</li>
            <li className={li}><strong>Fees and payments:</strong> invoices, balances, receipts, and the details that come with a payment (amount, date, M-Pesa or bank reference, payer’s name and phone).</li>
            <li className={li}><strong>Messages and enquiries</strong> sent through our contact form or the AI admissions guide.</li>
            <li className={li}><strong>Basic technical data</strong> such as cookies needed to keep staff signed in.</li>
          </ul>

          <h2 className={h2}>Why we use it</h2>
          <ul className="list-disc pl-6">
            <li className={li}>To consider an application, tell you the outcome, and enrol a child (to take steps you ask for, and with your consent).</li>
            <li className={li}>To teach, care for and keep each pupil safe, and to contact parents about their child.</li>
            <li className={li}>To raise fee invoices, receive and record payments, and show a parent their child’s balance.</li>
            <li className={li}>To meet legal duties, such as keeping financial records and reporting to education authorities.</li>
          </ul>
          <p className={p}>We do not sell personal information and we do not use it for advertising.</p>

          <h2 className={h2}>Children’s information</h2>
          <p className={p}>
            We collect a child’s information only from a parent or guardian, or with their permission, and use it only for the child’s education, safety and care. Medical and special-needs details are
            optional and are seen only by staff who need them.
          </p>

          <h2 className={h2}>Who we share it with</h2>
          <p className={p}>Only as needed to run the school, and only with service providers who handle it on our behalf:</p>
          <ul className="list-disc pl-6">
            <li className={li}>Our website and database hosting (Supabase, and our web host).</li>
            <li className={li}>Payment providers: Safaricom M-Pesa, KCB and other banks, when you pay fees or when we reconcile a statement.</li>
            <li className={li}>Messaging and AI services we may use to send notices or answer admissions questions. Please do not put sensitive details about a child in the AI guide.</li>
            <li className={li}>Government or education authorities, where the law requires.</li>
          </ul>

          <h2 className={h2}>How long we keep it</h2>
          <p className={p}>
            Applications that do not proceed are deleted after a reasonable period. Pupil and fee records are kept while a child is enrolled and afterwards for as long as the law and our accounting
            duties require, then deleted or anonymised.
          </p>

          <h2 className={h2}>How we protect it</h2>
          <p className={p}>
            Records sit in a protected database. Staff see only the school and records their role needs, parents can see a child’s fee account only with the admission number and the phone number we hold,
            and changes to money records are logged against the staff member who made them. No system is perfectly secure, but we take reasonable steps and act quickly if something goes wrong.
          </p>

          <h2 className={h2}>Your rights</h2>
          <p className={p}>
            You may ask to see the information we hold about you or your child, correct it, have it deleted (unless we must keep it by law), object to some uses, or withdraw consent you gave. Email
            <a className="text-primary underline" href={`mailto:${CONTACT_EMAIL}`}> {CONTACT_EMAIL}</a> and we will reply promptly. If you are not satisfied, you may complain to the Office of the Data Protection
            Commissioner (Kenya) at <a className="text-primary underline" href="https://www.odpc.go.ke" rel="noopener noreferrer">www.odpc.go.ke</a>.
          </p>

          <h2 className={h2}>Changes</h2>
          <p className={p}>If we change how we use information we will update this page and the date above.</p>
        </div>
      </section>
    </>
  );
}
