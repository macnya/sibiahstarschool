import type { ReportCardData } from '@/lib/exams/types';

/** One printable report card. Several can be stacked; each starts on a new printed page. */
export function ReportCard({ data }: { data: ReportCardData }) {
  const junior = data.student.stage === 'junior_school';
  return (
    <article className="rounded-xl border bg-white p-6 text-slate-900 shadow-sm print:break-after-page print:last:break-after-auto print:rounded-none print:border-0 print:p-0 print:shadow-none">
      <header className="border-b-2 border-slate-800 pb-3 text-center">
        <h2 className="text-xl font-bold uppercase tracking-wide">{data.school}</h2>
        <p className="text-sm font-semibold">Learner Progress Report · {data.exam.name}</p>
        <p className="text-xs text-slate-600">Term {data.exam.term}, {data.exam.year}</p>
      </header>
      <dl className="my-4 grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
        <div><dt className="text-xs text-slate-500">Learner</dt><dd className="font-semibold">{data.student.name}</dd></div>
        <div><dt className="text-xs text-slate-500">Admission no.</dt><dd className="font-mono">{data.student.admission}</dd></div>
        <div><dt className="text-xs text-slate-500">Class</dt><dd>{data.student.class ?? data.student.grade}</dd></div>
        {data.position && data.class_size ? <div><dt className="text-xs text-slate-500">Position</dt><dd>{data.position} of {data.class_size}</dd></div> : <div />}
      </dl>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead><tr className="bg-slate-100 text-left text-xs uppercase"><th className="border p-2">Learning area</th><th className="border p-2 text-right">Score %</th><th className="border p-2">Level</th><th className="border p-2">{junior ? 'Points' : 'Performance'}</th></tr></thead>
          <tbody>
            {data.rows.map((r) => (
              <tr key={r.area}>
                <td className="border p-2">{r.area}</td>
                <td className="border p-2 text-right tabular-nums">{r.score ?? '—'}</td>
                <td className="border p-2 font-semibold">{r.code ?? ''}</td>
                <td className="border p-2">{junior ? r.points ?? '' : r.label ?? ''}</td>
              </tr>
            ))}
          </tbody>
          {data.average !== null && (
            <tfoot><tr className="bg-slate-50 font-semibold"><td className="border p-2">Overall average</td><td className="border p-2 text-right tabular-nums">{data.average}</td><td className="border p-2">{data.average_level?.code}</td><td className="border p-2">{data.average_level?.label}</td></tr></tfoot>
          )}
        </table>
      </div>
      <div className="mt-4 space-y-3 text-sm">
        <div><p className="text-xs uppercase text-slate-500">Class teacher’s comment</p><p className="min-h-10 border-b border-dotted pb-1">{data.teacher_comment ?? ''}</p></div>
        <div><p className="text-xs uppercase text-slate-500">Head teacher’s comment</p><p className="min-h-10 border-b border-dotted pb-1">{data.head_comment ?? ''}</p></div>
      </div>
      <p className="mt-4 text-[11px] text-slate-500">{junior
        ? 'Levels: EE1–EE2 Exceeding · ME1–ME2 Meeting · AE1–AE2 Approaching · BE1–BE2 Below expectations.'
        : 'Levels: EE Exceeding · ME Meeting · AE Approaching · BE Below expectations.'}</p>
    </article>
  );
}
