/**
 * Database types.
 *
 * Written by hand to match supabase/migrations/0001_init.sql through
 * 0004_scholarships.sql.
 *
 * The shape below is not arbitrary: supabase-js constrains the schema
 * generic to `GenericSchema`, which requires Tables / Views / Functions /
 * Enums / CompositeTypes, and each table to carry a Relationships array.
 * If any of those are missing the constraint fails and every query result
 * silently degrades to `never` — which shows up as errors like
 * "Property 'role' does not exist on type 'never'".
 *
 * Once the Supabase CLI is set up you can generate this instead:
 *   npx supabase gen types typescript --project-id <ref> > src/lib/supabase/types.ts
 */

export type UserRole = 'admin' | 'editor' | 'teacher' | 'student' | 'parent';

export interface ProfileRow {
  id: string;
  full_name: string | null;
  role: UserRole;
  /** null = group-level user; set = limited to that campus. */
  campus_id: string | null;
  created_at: string;
}

export interface EventRow {
  id: string;
  title: string;
  slug: string;
  event_date: string;
  location: string;
  description: string;
  image_url: string | null;
  image_hint: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlogPostRow {
  id: string;
  title: string;
  slug: string;
  author: string;
  excerpt: string;
  body: string | null;
  published_at: string;
  image_url: string | null;
  image_hint: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface GalleryImageRow {
  id: string;
  image_url: string;
  alt_text: string;
  caption: string | null;
  image_hint: string | null;
  sort_order: number;
  published: boolean;
  created_at: string;
}

export interface ContactMessageRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  handled: boolean;
  created_at: string;
}

export type ScholarshipRequestStatus = 'pending' | 'approved' | 'declined';

export interface ScholarshipRequestRow {
  id: string;
  parent_name: string;
  phone: string;
  email: string;
  student_name: string;
  student_level: string;
  reason: string;
  status: ScholarshipRequestStatus;
  created_at: string;
}

export type SponsorRequestStatus = 'pending' | 'contacted' | 'matched' | 'declined';

export interface SponsorRequestRow {
  id: string;
  sponsor_name: string;
  organization: string | null;
  phone: string;
  email: string;
  message: string | null;
  status: SponsorRequestStatus;
  created_at: string;
}

export type ActiveScholarshipStatus = 'active' | 'completed';

export interface ActiveScholarshipRow {
  id: string;
  student_name: string;
  student_level: string | null;
  sponsor_name: string;
  sponsor_email: string | null;
  sponsor_phone: string | null;
  notes: string | null;
  start_date: string;
  status: ActiveScholarshipStatus;
  scholarship_request_id: string | null;
  sponsor_request_id: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Campuses, classes, admissions, students (0005_campuses_admissions.sql)
// ---------------------------------------------------------------------------
export interface CampusRow {
  id: string;
  code: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  address: string | null;
  town: string | null;
  phone: string | null;
  email: string | null;
  map_url: string | null;
  website_url: string | null;
  logo_url: string | null;
  image_url: string | null;
  admissions_open: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type GradeStage = 'pre_primary' | 'lower_primary' | 'upper_primary' | 'junior_school';

export interface GradeLevelRow {
  id: string;
  code: string;
  name: string;
  stage: GradeStage;
  sort_order: number;
}

export interface CampusGradeRow {
  campus_id: string;
  grade_id: string;
  capacity: number;
}

export type ApplicationStatus =
  | 'submitted'
  | 'under_review'
  | 'assessment'
  | 'offered'
  | 'accepted'
  | 'enrolled'
  | 'waitlisted'
  | 'declined'
  | 'withdrawn';

export interface AdmissionApplicationRow {
  id: string;
  reference: string;
  campus_id: string;
  grade_id: string;
  intake_year: number;
  intake_term: number;
  status: ApplicationStatus;
  student_first_name: string;
  student_middle_name: string | null;
  student_last_name: string;
  date_of_birth: string;
  gender: 'female' | 'male';
  nationality: string | null;
  birth_cert_number: string | null;
  previous_school: string | null;
  previous_grade: string | null;
  medical_notes: string | null;
  special_needs: string | null;
  guardian_name: string;
  guardian_relationship: string;
  guardian_phone: string;
  guardian_email: string | null;
  guardian_occupation: string | null;
  guardian_address: string | null;
  guardian2_name: string | null;
  guardian2_relationship: string | null;
  guardian2_phone: string | null;
  how_heard: string | null;
  wants_transport: boolean;
  consent_given: boolean;
  assessment_date: string | null;
  decision_note: string | null;
  internal_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  student_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicationEventRow {
  id: string;
  application_id: string;
  event: string;
  from_status: string | null;
  to_status: string | null;
  note: string | null;
  actor: string | null;
  created_at: string;
}

export type StudentStatus = 'active' | 'transferred' | 'graduated' | 'withdrawn';

export interface StudentRow {
  id: string;
  admission_number: string;
  campus_id: string;
  grade_id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  date_of_birth: string;
  gender: 'female' | 'male';
  guardian_name: string;
  guardian_relationship: string | null;
  guardian_phone: string;
  guardian_email: string | null;
  guardian_address: string | null;
  medical_notes: string | null;
  special_needs: string | null;
  status: StudentStatus;
  enrolled_on: string;
  application_id: string | null;
  created_at: string;
  updated_at: string;
}

/** What a family sees when they look up their own application. */
export interface ApplicationStatusResult {
  reference: string;
  status: ApplicationStatus;
  student_name: string;
  campus_name: string;
  grade_name: string;
  intake_year: number;
  assessment_date: string | null;
  decision_note: string | null;
  updated_at: string;
  history: { status: ApplicationStatus; at: string }[];
}

/** Columns the database fills in itself, so they are optional on insert. */
type Generated = 'id' | 'created_at' | 'updated_at';

type Insertable<Row> = Omit<Row, Generated & keyof Row> &
  Partial<Pick<Row, Generated & keyof Row>>;

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Insertable<ProfileRow>;
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      events: {
        Row: EventRow;
        Insert: Insertable<EventRow>;
        Update: Partial<EventRow>;
        Relationships: [];
      };
      blog_posts: {
        Row: BlogPostRow;
        Insert: Insertable<BlogPostRow>;
        Update: Partial<BlogPostRow>;
        Relationships: [];
      };
      gallery_images: {
        Row: GalleryImageRow;
        Insert: Insertable<GalleryImageRow>;
        Update: Partial<GalleryImageRow>;
        Relationships: [];
      };
      contact_messages: {
        Row: ContactMessageRow;
        Insert: Insertable<ContactMessageRow>;
        Update: Partial<ContactMessageRow>;
        Relationships: [];
      };
      scholarship_requests: {
        Row: ScholarshipRequestRow;
        Insert: Insertable<ScholarshipRequestRow>;
        Update: Partial<ScholarshipRequestRow>;
        Relationships: [];
      };
      sponsor_requests: {
        Row: SponsorRequestRow;
        Insert: Insertable<SponsorRequestRow>;
        Update: Partial<SponsorRequestRow>;
        Relationships: [];
      };
      active_scholarships: {
        Row: ActiveScholarshipRow;
        Insert: Insertable<ActiveScholarshipRow>;
        Update: Partial<ActiveScholarshipRow>;
        Relationships: [];
      };
      campuses: {
        Row: CampusRow;
        Insert: Insertable<CampusRow>;
        Update: Partial<CampusRow>;
        Relationships: [];
      };
      grade_levels: {
        Row: GradeLevelRow;
        Insert: Insertable<GradeLevelRow>;
        Update: Partial<GradeLevelRow>;
        Relationships: [];
      };
      campus_grades: {
        Row: CampusGradeRow;
        Insert: CampusGradeRow;
        Update: Partial<CampusGradeRow>;
        Relationships: [];
      };
      admission_applications: {
        Row: AdmissionApplicationRow;
        Insert: Insertable<AdmissionApplicationRow>;
        Update: Partial<AdmissionApplicationRow>;
        Relationships: [];
      };
      application_events: {
        Row: ApplicationEventRow;
        Insert: Insertable<ApplicationEventRow>;
        Update: Partial<ApplicationEventRow>;
        Relationships: [];
      };
      students: {
        Row: StudentRow;
        Insert: Insertable<StudentRow>;
        Update: Partial<StudentRow>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      is_admin: { Args: Record<never, never>; Returns: boolean };
      can_edit_content: { Args: Record<never, never>; Returns: boolean };
      is_group_admin: { Args: Record<never, never>; Returns: boolean };
      can_manage_campus: { Args: { p_campus: string }; Returns: boolean };
      submit_admission_application: { Args: { p: Record<string, unknown> }; Returns: string };
      get_application_status: {
        Args: { p_reference: string; p_phone: string };
        Returns: ApplicationStatusResult[];
      };
      enrol_application: { Args: { p_application_id: string }; Returns: string };
    };
    Enums: {
      user_role: UserRole;
    };
    CompositeTypes: Record<never, never>;
  };
}
