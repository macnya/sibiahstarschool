import { createPublicClient } from '@/lib/supabase/public';
import type { CampusRow, GradeLevelRow } from '@/lib/supabase/types';

export type CampusGrade = GradeLevelRow & { capacity: number };
export type CampusWithGrades = CampusRow & { grades: CampusGrade[] };

/** All active schools in the group, each with the classes it offers (Playgroup → Grade 9). */
export async function getActiveCampusesWithGrades(): Promise<CampusWithGrades[]> {
  const supabase = createPublicClient();
  const [campusRes, gradeRes, linkRes] = await Promise.all([
    supabase.from('campuses').select('*').eq('is_active', true).order('sort_order').order('name'),
    supabase.from('grade_levels').select('*').order('sort_order'),
    supabase.from('campus_grades').select('*'),
  ]);

  const campuses = (campusRes.data ?? []) as CampusRow[];
  const grades = (gradeRes.data ?? []) as GradeLevelRow[];
  const links = (linkRes.data ?? []) as { campus_id: string; grade_id: string; capacity: number }[];
  const gradeById = new Map(grades.map((g) => [g.id, g]));

  return campuses.map((campus) => ({
    ...campus,
    grades: links
      .filter((l) => l.campus_id === campus.id)
      .map((l) => ({ ...gradeById.get(l.grade_id)!, capacity: l.capacity }))
      .filter((g) => g.id)
      .sort((a, b) => a.sort_order - b.sort_order),
  }));
}

export async function getCampusBySlug(slug: string): Promise<CampusWithGrades | null> {
  const all = await getActiveCampusesWithGrades();
  return all.find((c) => c.slug === slug) ?? null;
}

/** "Playgroup – Grade 9" style summary of the classes a campus offers. */
export function gradeRange(grades: { name: string }[]): string {
  if (grades.length === 0) return 'Classes to be announced';
  if (grades.length === 1) return grades[0].name;
  return `${grades[0].name} – ${grades[grades.length - 1].name}`;
}
