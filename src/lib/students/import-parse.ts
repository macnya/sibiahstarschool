/**
 * Reads a school's pupil list (CSV, or cells pasted straight from Excel) and turns it into rows
 * the database can import. Pure functions, no server access — so it runs in the browser for an
 * instant preview, and the database re-checks everything again before saving.
 */

export interface GradeRef { id: string; code: string; name: string }

export interface ImportRow {
  first_name: string;
  middle_name?: string;
  last_name: string;
  gender: 'female' | 'male';
  grade_id: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_email?: string;
  guardian_relationship?: string;
  admission_number?: string;
  upi_number?: string;
  date_of_birth?: string;
  opening_balance_cents?: number;
}

export interface MappedLine {
  line: number;            // line number in the file (header = 1)
  data?: ImportRow;        // present when the line is usable
  errors: string[];
  warnings: string[];
  label: string;           // "First Last" for display
}

// ---------------------------------------------------------------- CSV

/** RFC-4180-ish parser: quotes, escaped quotes, commas / semicolons / tabs, Windows line endings, BOM. */
export function parseCsv(input: string): string[][] {
  const text = input.replace(/^\uFEFF/, '');
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  const counts = { ',': 0, ';': 0, '\t': 0 };
  let q = false;
  for (const ch of firstLine) {
    if (ch === '"') q = !q;
    else if (!q && ch in counts) counts[ch as keyof typeof counts] += 1;
  }
  const delimiter = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0][1] > 0
    ? Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
    : ',') as string;

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i += 1; } else inQuotes = false;
      } else cell += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === delimiter) { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cell); cell = '';
      rows.push(row); row = [];
    } else cell += ch;
  }
  if (cell !== '' || row.length > 0) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

// ---------------------------------------------------------------- columns

export type Field =
  | 'first_name' | 'middle_name' | 'last_name' | 'full_name' | 'gender' | 'date_of_birth' | 'class'
  | 'admission_number' | 'upi_number' | 'guardian_name' | 'guardian_phone' | 'guardian_email'
  | 'guardian_relationship' | 'opening_balance';

const SYNONYMS: Record<Field, string[]> = {
  first_name: ['first name', 'firstname', 'given name', 'fname', 'first'],
  middle_name: ['middle name', 'middlename', 'other names', 'othernames', 'other name', 'middle'],
  last_name: ['last name', 'lastname', 'surname', 'family name', 'lname', 'last'],
  full_name: ['name', 'full name', 'fullname', 'student name', 'pupil name', 'student', 'pupil', 'names'],
  gender: ['gender', 'sex'],
  date_of_birth: ['dob', 'date of birth', 'birth date', 'birthdate', 'd.o.b', 'dateofbirth'],
  class: ['class', 'grade', 'level', 'form', 'std', 'standard', 'current class', 'class name'],
  admission_number: ['admission number', 'admission no', 'admission', 'adm no', 'adm', 'adm number', 'admno', 'reg no', 'registration number', 'student id'],
  upi_number: ['upi', 'upi number', 'upi no', 'nemis', 'nemis upi', 'nemis number'],
  guardian_name: ['parent', 'parent name', 'guardian', 'guardian name', 'parent/guardian', 'parent guardian', 'parents name', 'next of kin'],
  guardian_phone: ['phone', 'parent phone', 'guardian phone', 'contact', 'mobile', 'tel', 'telephone', 'phone number', 'parent contact', 'parent mobile', 'guardian contact', 'phone no'],
  guardian_email: ['email', 'parent email', 'guardian email', 'e-mail'],
  guardian_relationship: ['relationship', 'relation'],
  opening_balance: ['balance', 'arrears', 'opening balance', 'balance b/f', 'balance bf', 'fee balance', 'outstanding', 'balance brought forward', 'bf'],
};

const norm = (s: string) => s.toLowerCase().replace(/[_\-.]+/g, ' ').replace(/\s+/g, ' ').trim();

export function detectColumns(headers: string[]): Partial<Record<Field, number>> {
  const found: Partial<Record<Field, number>> = {};
  headers.forEach((h, index) => {
    const n = norm(h);
    for (const [field, names] of Object.entries(SYNONYMS) as [Field, string[]][]) {
      if (found[field] === undefined && names.includes(n)) { found[field] = index; break; }
    }
  });
  return found;
}

// ---------------------------------------------------------------- value parsers

export function resolveGrade(text: string, grades: GradeRef[]): GradeRef | null {
  const n = norm(text).replace(/^(class|grade|std|standard|form)\s*/, '');
  if (!n) return null;
  const byCode = (code: string) => grades.find((g) => g.code === code) ?? null;
  if (['playgroup', 'play group', 'pg', 'baby class', 'babyclass', 'nursery'].includes(n)) return byCode('PLAYGROUP');
  const pp = /^(pp|pre primary|preprimary|pre school|preschool)\s*([12])$/.exec(n);
  if (pp) return byCode(`PP${pp[2]}`);
  const num = /^(\d{1,2})$/.exec(n) ?? /^g(?:rade)?\s*(\d{1,2})$/.exec(n) ?? /^(\d{1,2})(?:st|nd|rd|th)?$/.exec(n);
  if (num) return byCode(`G${Number(num[1])}`);
  const direct = grades.find((g) => norm(g.name) === n || g.code.toLowerCase() === n);
  return direct ?? null;
}

const MONTHS: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12 };

/** ISO (2016-03-02) or Kenyan day-first (02/03/2016, 2-3-2016, 2.3.16, 2 Mar 2016). Returns ISO, '' for blank, null when invalid. */
export function parseDate(text: string): string | '' | null {
  const t = text.trim();
  if (!t) return '';
  let y: number, m: number, d: number;
  let match: RegExpExecArray | null;
  if ((match = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(t))) { y = +match[1]; m = +match[2]; d = +match[3]; }
  else if ((match = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/.exec(t))) {
    d = +match[1]; m = +match[2]; y = +match[3];
    if (match[3].length === 2) y += y > (new Date().getFullYear() % 100) ? 1900 : 2000;
  } else if ((match = /^(\d{1,2})\s+([A-Za-z]{3,9})\.?,?\s+(\d{4})$/.exec(t))) {
    d = +match[1]; m = MONTHS[match[2].toLowerCase().slice(0, 4)] ?? MONTHS[match[2].toLowerCase().slice(0, 3)]; y = +match[3];
  } else return null;
  if (!m || m < 1 || m > 12 || d < 1 || d > 31 || y < 1990 || y > new Date().getFullYear()) return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCMonth() !== m - 1) return null;
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function parseGender(text: string): 'female' | 'male' | null {
  const n = text.trim().toLowerCase();
  if (['f', 'female', 'girl', 'g'].includes(n)) return 'female';
  if (['m', 'male', 'boy', 'b'].includes(n)) return 'male';
  return null;
}

/** "12,500" / "KES 12,500" / "(5,000)" / "-5000" / "1500/-" -> cents. Positive = owes, negative = credit. NaN when invalid; undefined when blank. */
export function parseMoney(text: string): number | undefined {
  const raw = text.trim();
  if (!raw || /^(nil|none|-|0)$/i.test(raw)) return undefined;
  let negative = false;
  let t = raw.replace(/kes|ksh|ksh\.|\/=|\/-|\s/gi, '');
  if (/^\(.*\)$/.test(t)) { negative = true; t = t.slice(1, -1); }
  if (t.startsWith('-')) { negative = !negative; t = t.slice(1); }
  t = t.replace(/,/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return NaN;
  const cents = Math.round(parseFloat(t) * 100);
  return cents === 0 ? undefined : negative ? -cents : cents;
}

export function cleanPhone(text: string): string {
  return text.replace(/[^\d+]/g, '');
}

function splitName(full: string) {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return { first: parts[0], middle: '', last: '' };
  return { first: parts[0], middle: parts.slice(1, -1).join(' '), last: parts[parts.length - 1] };
}

const REQUIRED_LABEL: Record<string, string> = {
  class: 'Class', gender: 'Gender', guardian_name: 'Parent name', guardian_phone: 'Parent phone',
};

// ---------------------------------------------------------------- the whole file

export interface MappedFile {
  lines: MappedLine[];
  missingColumns: string[];
  unusedHeaders: string[];
  total: number;
  ready: number;
  problems: number;
}

export function mapTable(table: string[][], grades: GradeRef[]): MappedFile {
  if (table.length < 2) return { lines: [], missingColumns: [], unusedHeaders: [], total: 0, ready: 0, problems: 0 };
  const headers = table[0];
  const col = detectColumns(headers);
  const hasNames = (col.first_name !== undefined && col.last_name !== undefined) || col.full_name !== undefined;
  const missingColumns: string[] = [];
  if (!hasNames) missingColumns.push('Name (First name + Last name, or one Name column)');
  for (const f of ['class', 'gender', 'guardian_name', 'guardian_phone'] as const) if (col[f] === undefined) missingColumns.push(REQUIRED_LABEL[f]);

  const used = new Set(Object.values(col));
  const unusedHeaders = headers.filter((_, i) => !used.has(i) && headers[i].trim() !== '');
  const get = (row: string[], f: Field) => (col[f] === undefined ? '' : (row[col[f]!] ?? '').trim());

  const lines: MappedLine[] = table.slice(1).map((row, idx) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    let first = get(row, 'first_name'), middle = get(row, 'middle_name'), last = get(row, 'last_name');
    if (!(col.first_name !== undefined && col.last_name !== undefined) && col.full_name !== undefined) {
      const s = splitName(get(row, 'full_name'));
      first = s.first; middle = s.middle; last = s.last;
    }
    if (!first) errors.push('First name is missing');
    if (!last) errors.push('Last name is missing (use at least two names)');

    const grade = resolveGrade(get(row, 'class'), grades);
    if (!get(row, 'class')) errors.push('Class is missing');
    else if (!grade) errors.push(`Class “${get(row, 'class')}” is not offered at this school`);

    const gender = parseGender(get(row, 'gender'));
    if (!gender) errors.push('Gender must be M/F, male/female or boy/girl');

    const guardianName = get(row, 'guardian_name');
    if (!guardianName) errors.push('Parent name is missing');
    const phone = cleanPhone(get(row, 'guardian_phone'));
    if (phone.replace(/\D/g, '').length < 9) errors.push('Parent phone is missing or too short');

    const dob = col.date_of_birth !== undefined ? parseDate(get(row, 'date_of_birth')) : '';
    if (dob === null) warnings.push(`Date of birth “${get(row, 'date_of_birth')}” was not understood — left blank`);

    const balanceText = get(row, 'opening_balance');
    const balance = balanceText ? parseMoney(balanceText) : undefined;
    if (balance !== undefined && Number.isNaN(balance)) errors.push(`Balance “${balanceText}” is not a valid amount`);

    const email = get(row, 'guardian_email');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) warnings.push('Email looks wrong — left blank');

    const label = `${first} ${last}`.trim() || '(no name)';
    const clean = (v: string) => (v ? v : undefined);
    const data: ImportRow | undefined = errors.length
      ? undefined
      : {
          first_name: first, middle_name: clean(middle), last_name: last, gender: gender!, grade_id: grade!.id,
          guardian_name: guardianName, guardian_phone: phone, guardian_email: email && !warnings.some((w) => w.startsWith('Email')) ? email : undefined,
          guardian_relationship: clean(get(row, 'guardian_relationship')),
          admission_number: clean(get(row, 'admission_number')), upi_number: clean(get(row, 'upi_number')),
          date_of_birth: dob ? dob : undefined,
          opening_balance_cents: balance !== undefined && !Number.isNaN(balance) ? balance : undefined,
        };
    return { line: idx + 2, data, errors, warnings, label };
  });

  const ready = lines.filter((l) => l.data).length;
  return { lines, missingColumns, unusedHeaders, total: lines.length, ready, problems: lines.length - ready };
}

export const TEMPLATE_CSV =
  'First name,Middle name,Last name,Gender,Date of birth,Class,Admission number,UPI,Parent name,Parent phone,Parent email,Opening balance\r\n' +
  'Wanjiru,,Kamau,F,02/03/2016,Grade 4,,,Mary Kamau,0712 345 678,mary@example.com,15000\r\n' +
  'Otieno,James,Ouma,M,14/08/2018,PP2,0457,,Peter Ouma,0722 000 002,,-2000\r\n';
