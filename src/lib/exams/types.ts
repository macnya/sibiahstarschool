export interface ReportRow { area: string; score: number | null; code: string | null; label: string | null; points: number | null }
export interface ReportCardData {
  exam: { name: string; year: number; term: number; published: boolean };
  student: { id: string; name: string; admission: string; class: string | null; grade: string; stage: string };
  school: string;
  rows: ReportRow[];
  areas_scored: number;
  average: number | null;
  total: number | null;
  average_level: { code: string; label: string } | null;
  position: number | null;
  class_size: number | null;
  teacher_comment: string | null;
  head_comment: string | null;
}
export interface ExamRow { id: string; campus_id: string; name: string; year: number; term: number; is_published: boolean; show_position: boolean }
export interface AreaRow { id: string; campus_id: string; stage: string; name: string; sort_order: number }
export const STAGE_LABEL: Record<string, string> = { pre_primary: 'Pre-Primary', lower_primary: 'Lower Primary (Grades 1–3)', upper_primary: 'Upper Primary (Grades 4–6)', junior_school: 'Junior School (Grades 7–9)' };
