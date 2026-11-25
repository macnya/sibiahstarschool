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
  paybill_number: string | null;
  till_number: string | null;
  paybill_account_format: string | null;
  kcb_till_number: string | null;
  kcb_paybill_number: string | null;
  kcb_account_format: string | null;
  payment_instructions: string | null;
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
  /** Unknown for some pupils imported from an older register. */
  date_of_birth: string | null;
  gender: 'female' | 'male';
  guardian_name: string;
  guardian_relationship: string | null;
  guardian_phone: string;
  guardian_email: string | null;
  guardian_address: string | null;
  medical_notes: string | null;
  special_needs: string | null;
  upi_number: string | null;
  class_id: string | null;
  source: 'admission' | 'import';
  status: StudentStatus;
  enrolled_on: string;
  application_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClassRow {
  id: string;
  campus_id: string;
  grade_id: string;
  year: number;
  stream: string;
  capacity: number;
  created_at: string;
}

export interface ClassTeacherRow {
  class_id: string;
  teacher_id: string;
  is_class_teacher: boolean;
  subject: string | null;
  created_at: string;
}

/** One child as a signed-in parent sees them. */
export interface MyChild {
  student_id: string;
  name: string;
  admission_number: string;
  school: string;
  class_name: string | null;
  class_teacher: string | null;
  balance_cents: number;
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

// ---------------------------------------------------------------------------
// Fees (0006_fees.sql). All money is in cents (KES x 100).
// ---------------------------------------------------------------------------
export interface TermRow {
  id: string;
  year: number;
  number: number;
  name: string;
  start_date: string | null;
  end_date: string | null;
  due_date: string | null;
  is_current: boolean;
}

export type FeeKind = 'tuition' | 'transport' | 'meals' | 'activity' | 'exam' | 'admission' | 'other';

export interface FeeItemRow {
  id: string;
  name: string;
  kind: FeeKind;
  is_optional: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface FeeStructureRow {
  id: string;
  campus_id: string;
  year: number;
  grade_id: string;
  term_number: number;
  fee_item_id: string;
  amount_cents: number;
}

export interface InvoiceRow {
  id: string;
  number: string;
  student_id: string;
  campus_id: string;
  year: number;
  term_number: number;
  status: 'open' | 'cancelled';
  total_cents: number;
  due_date: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface InvoiceLineRow {
  id: string;
  invoice_id: string;
  fee_item_id: string | null;
  description: string;
  amount_cents: number;
}

export type PaymentMethod = 'mpesa' | 'kcb' | 'bank' | 'cash' | 'cheque' | 'card' | 'other';

export interface PaymentRow {
  id: string;
  receipt_number: string;
  student_id: string;
  campus_id: string;
  amount_cents: number;
  method: PaymentMethod;
  reference: string | null;
  payer_name: string | null;
  payer_phone: string | null;
  source: 'staff' | 'mpesa_c2b' | 'mpesa_stk' | 'statement';
  status: 'confirmed' | 'reversed';
  received_on: string;
  notes: string | null;
  recorded_by: string | null;
  reversed_by: string | null;
  reversed_at: string | null;
  reversal_reason: string | null;
  created_at: string;
}

export type AdjustmentKind =
  | 'bursary' | 'discount' | 'waiver' | 'scholarship' | 'penalty' | 'opening_balance' | 'refund' | 'correction';

export interface FeeAdjustmentRow {
  id: string;
  student_id: string;
  campus_id: string;
  kind: AdjustmentKind;
  amount_cents: number;
  description: string;
  year: number | null;
  term_number: number | null;
  created_by: string | null;
  created_at: string;
}

export interface MpesaTransactionRow {
  id: string;
  trans_id: string;
  trans_time: string | null;
  amount_cents: number;
  msisdn: string | null;
  bill_ref: string | null;
  payer_name: string | null;
  shortcode: string | null;
  campus_id: string | null;
  channel: 'mpesa' | 'kcb' | 'bank';
  status: 'matched' | 'unmatched' | 'ignored';
  student_id: string | null;
  payment_id: string | null;
  created_at: string;
}

export interface StudentBalanceRow {
  student_id: string;
  campus_id: string;
  grade_id: string;
  admission_number: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  guardian_name: string;
  guardian_phone: string;
  status: StudentStatus;
  invoiced: number;
  adjustments: number;
  paid: number;
  balance: number;
}

export interface FeeAccountEntry {
  date: string;
  type: string;
  description: string;
  amount_cents: number;
  balance_cents: number;
}

/** What a family sees after entering the admission number and phone number. */
export interface FeeAccount {
  student_id: string;
  admission_number: string;
  student_name: string;
  campus_name: string;
  campus_code: string;
  paybill_number: string | null;
  paybill_account_format: string | null;
  till_number: string | null;
  kcb_till_number: string | null;
  kcb_paybill_number: string | null;
  kcb_account_format: string | null;
  payment_instructions: string | null;
  balance_cents: number;
  entries: FeeAccountEntry[];
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
      classes: { Row: ClassRow; Insert: Insertable<ClassRow>; Update: Partial<ClassRow>; Relationships: [] };
      class_teachers: {
        Row: ClassTeacherRow;
        Insert: Omit<ClassTeacherRow, 'created_at'> & Partial<Pick<ClassTeacherRow, 'created_at'>>;
        Update: Partial<ClassTeacherRow>;
        Relationships: [];
      };
      terms: { Row: TermRow; Insert: Insertable<TermRow>; Update: Partial<TermRow>; Relationships: [] };
      fee_items: { Row: FeeItemRow; Insert: Insertable<FeeItemRow>; Update: Partial<FeeItemRow>; Relationships: [] };
      fee_structures: { Row: FeeStructureRow; Insert: Insertable<FeeStructureRow>; Update: Partial<FeeStructureRow>; Relationships: [] };
      student_fee_subscriptions: {
        Row: { student_id: string; fee_item_id: string };
        Insert: { student_id: string; fee_item_id: string };
        Update: Partial<{ student_id: string; fee_item_id: string }>;
        Relationships: [];
      };
      invoices: { Row: InvoiceRow; Insert: Insertable<InvoiceRow>; Update: Partial<InvoiceRow>; Relationships: [] };
      invoice_lines: { Row: InvoiceLineRow; Insert: Insertable<InvoiceLineRow>; Update: Partial<InvoiceLineRow>; Relationships: [] };
      payments: { Row: PaymentRow; Insert: Insertable<PaymentRow>; Update: Partial<PaymentRow>; Relationships: [] };
      fee_adjustments: { Row: FeeAdjustmentRow; Insert: Insertable<FeeAdjustmentRow>; Update: Partial<FeeAdjustmentRow>; Relationships: [] };
      mpesa_transactions: { Row: MpesaTransactionRow; Insert: Insertable<MpesaTransactionRow>; Update: Partial<MpesaTransactionRow>; Relationships: [] };
    };
    Views: {
      student_balances: { Row: StudentBalanceRow; Relationships: [] };
    };
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
      generate_invoices: {
        Args: { p_campus: string; p_year: number; p_term: number; p_grade?: string | null };
        Returns: { created: number; skipped: number };
      };
      cancel_invoice: { Args: { p_invoice: string; p_reason: string }; Returns: undefined };
      record_payment: {
        Args: {
          p_student: string; p_amount_cents: number; p_method: string; p_reference?: string | null;
          p_payer_name?: string | null; p_payer_phone?: string | null; p_received_on?: string | null; p_notes?: string | null;
        };
        Returns: string;
      };
      reverse_payment: { Args: { p_payment: string; p_reason: string }; Returns: undefined };
      post_fee_adjustment: {
        Args: { p_student: string; p_kind: string; p_amount_cents: number; p_description: string; p_year?: number | null; p_term?: number | null };
        Returns: string;
      };
      mpesa_assign_transaction: { Args: { p_transaction: string; p_student: string }; Returns: string };
      mpesa_ignore_transaction: { Args: { p_transaction: string }; Returns: undefined };
      import_students: {
        Args: { p_campus: string; p_rows: unknown[]; p_commit: boolean };
        Returns: {
          committed: boolean; ok: number; duplicates: number; errors: number;
          rows: { row: number; status: 'ok' | 'duplicate' | 'error'; admission_number: string | null; message: string | null }[];
        };
      };
      import_statement: {
        Args: { p_campus: string; p_channel: 'mpesa' | 'kcb' | 'bank'; p_rows: unknown[]; p_commit: boolean };
        Returns: {
          committed: boolean; total: number; matched: number; unmatched: number; duplicates: number; errors: number;
          matched_cents: number; unmatched_cents: number;
          rows: { line: number; status: 'matched' | 'unmatched' | 'duplicate' | 'error'; message: string | null; reference: string | null;
                  amount_cents: number | null; student_name: string | null; admission_number: string | null }[];
        };
      };
      create_class: { Args: { p_campus: string; p_grade: string; p_year: number; p_stream: string; p_capacity: number }; Returns: string };
      place_students: { Args: { p_class: string; p_students: string[] }; Returns: number };
      place_unplaced: { Args: { p_class: string }; Returns: number };
      remove_from_class: { Args: { p_student: string }; Returns: undefined };
      assign_class_teacher: { Args: { p_class: string; p_teacher: string; p_is_head: boolean; p_subject: string | null }; Returns: undefined };
      remove_class_teacher: { Args: { p_class: string; p_teacher: string }; Returns: undefined };
      delete_class: { Args: { p_class: string }; Returns: undefined };
      claim_child: { Args: { p_admission_number: string; p_phone: string }; Returns: { student_id: string; student_name: string; admission_number: string } | null };
      my_children: { Args: Record<string, never>; Returns: MyChild[] };
      my_child_account: { Args: { p_student: string }; Returns: FeeAccount | null };
      unlink_child: { Args: { p_student: string }; Returns: undefined };
      get_fee_account: { Args: { p_admission_number: string; p_phone: string }; Returns: FeeAccount | null };
    };
    Enums: {
      user_role: UserRole;
    };
    CompositeTypes: Record<never, never>;
  };
}
