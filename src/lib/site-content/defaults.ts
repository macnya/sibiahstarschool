/**
 * Editable page-content schemas + defaults.
 *
 * Each `DEFAULT_*_CONTENT` below is the exact text that used to be
 * hardcoded in the page component. It is still the fallback: if the
 * `site_content` table has no row for a page (or is missing a field),
 * the page renders this. Nothing changes on the live site until an
 * admin actually edits a page in /admin/content.
 *
 * Things left OUT of these schemas on purpose: icons, image URLs,
 * layout, and internal links (e.g. "/curriculum#preschool"). Those are
 * structural, not copy, and changing them needs a code change anyway.
 */

export const SITE_CONTENT_PAGES = [
  'home',
  'about',
  'admissions',
  'facilities',
  'curriculum',
  'contact',
] as const;

export type SiteContentPage = (typeof SITE_CONTENT_PAGES)[number];

// --- Home ---------------------------------------------------------------

export type HomeContent = {
  hero: { title: string; highlight: string; subtitle: string };
  heroEyebrow: string;
  heroImage: { url: string; hint: string };
  levelsHeading: string;
  levels: { title: string; description: string }[];
  highlightsHeading: string;
  highlights: { title: string; description: string }[];
  cocurricularHeading: string;
  cocurricular: { title: string; description: string }[];
  getInvolvedHeading: string;
  getInvolvedText: string;
};

export const DEFAULT_HOME_CONTENT: HomeContent = {
  hero: {
    title: 'Welcome to',
    highlight: 'Sibiah Star',
    subtitle:
      'Nurturing potential, inspiring futures. Discover a vibrant learning community for Pre-school, Primary, and Junior Secondary students.',
  },
  heroEyebrow: 'Admissions open — Playgroup through Grade 9',
  heroImage: { url: 'https://placehold.co/1920x1080.png', hint: 'school campus' },
  levelsHeading: 'Our Educational Journey',
  levels: [
    {
      title: 'Pre-school (Playgroup, PP1, PP2)',
      description:
        'A nurturing start to education, fostering curiosity and foundational skills through play-based learning.',
    },
    {
      title: 'Primary (Grade 1 - 6)',
      description:
        'Building strong academic foundations and character development in a supportive environment.',
    },
    {
      title: 'Junior Secondary (Grade 7 - 9)',
      description:
        'Preparing students for higher education and future success with a comprehensive and challenging curriculum.',
    },
  ],
  highlightsHeading: 'Why Choose Sibiah Star?',
  highlights: [
    { title: 'Modern Facilities', description: 'State-of-the-art classrooms, labs, and learning spaces.' },
    { title: 'Transport Services', description: 'Safe and reliable transportation covering the entire area.' },
    { title: 'Excellent Academics', description: 'Proven track record of academic excellence and student achievement.' },
    { title: 'Character Development', description: 'Fostering values, discipline, and leadership skills.' },
  ],
  cocurricularHeading: 'Beyond the Classroom',
  cocurricular: [
    { title: 'Music Program', description: 'Explore creativity and talent with our diverse music classes and ensembles.' },
    { title: 'Scout Program', description: 'Developing leadership, teamwork, and outdoor skills through engaging scout activities.' },
  ],
  getInvolvedHeading: 'Get Involved',
  getInvolvedText: 'Join our community, attend an event, or read our latest news.',
};

// --- About ----------------------------------------------------------------

export type AboutContent = {
  header: { eyebrow: string; title: string; subtitle: string };
  story: { heading: string; paragraph1: string; paragraph2: string; imageUrl: string };
  mission: { heading: string; text: string };
  vision: { heading: string; text: string };
  values: { heading: string; items: string[] };
  director: { heading: string; name: string; title: string; quote1: string; quote2: string; imageUrl: string };
  team: { heading: string; intro: string; members: { name: string; role: string; imageUrl: string }[] };
};

export const DEFAULT_ABOUT_CONTENT: AboutContent = {
  header: {
    eyebrow: 'Since [Year Founded]',
    title: 'About Sibiah Star School',
    subtitle: 'Dedicated to Excellence in Education and Character Development Since [Year Founded]',
  },
  story: {
    heading: 'Our Story',
    paragraph1:
      'Sibiah Star Pre-school, Primary & Junior School was founded with a passion for providing holistic education that nurtures both academic prowess and strong moral character. For over 20 years, we have been committed to creating a supportive and stimulating environment where students can thrive and reach their full potential. Our journey began with a small group of dedicated educators and has grown into a vibrant community recognized for its commitment to excellence.',
    paragraph2:
      'We believe in a balanced approach to education, integrating rigorous academics with enriching co-curricular activities. Our focus extends beyond textbooks to instill values such as integrity, respect, and responsibility in every student.',
    imageUrl: '/images/SibiahStarposter.jpg',
  },
  mission: {
    heading: 'Our Mission',
    text: 'To provide a high-quality, inclusive education that empowers students to become critical thinkers, lifelong learners, and compassionate leaders in a global society.',
  },
  vision: {
    heading: 'Our Vision',
    text: 'To be a leading educational institution renowned for academic excellence, innovation, and the holistic development of every child.',
  },
  values: {
    heading: 'Our Core Values',
    items: ['Excellence', 'Integrity', 'Respect', 'Collaboration', 'Resilience'],
  },
  director: {
    heading: 'Message from the Director',
    name: 'Mrs. Sibiah Kwamboka Nyamwamu',
    title: 'School Director',
    quote1:
      'Welcome to Sibiah Star School! It is my pleasure to lead this wonderful institution where we are deeply committed to fostering an environment of learning, growth, and discovery. Our dedicated team of educators works tirelessly to provide an engaging curriculum that challenges and inspires our students.',
    quote2:
      'We believe that education is a partnership between the school, parents, and the community. Together, we can help our students develop the skills, knowledge, and character necessary to succeed in an ever-changing world. We invite you to explore our website and learn more about the exciting opportunities at Sibiah Star.',
    imageUrl: 'https://placehold.co/150x150.png',
  },
  team: {
    heading: 'Our Dedicated Team',
    intro:
      'At Sibiah Star, we are proud of our team of experienced and passionate educators and staff who are committed to providing the best possible learning experience for our students. They are the heart of our school community.',
    members: [
      { name: 'Tr. Raphael Odongo', role: 'Head of Primary', imageUrl: 'https://placehold.co/200x200.png' },
      { name: 'Ms. Moraa Ojiambo', role: 'Head of Administration & Finance', imageUrl: 'https://placehold.co/200x200.png' },
      { name: 'Tr. Martin', role: 'Junior Secondary Coordinator', imageUrl: 'https://placehold.co/200x200.png' },
      { name: 'Ms. Fanne Mwambi', role: 'Administration & Communication', imageUrl: 'https://placehold.co/200x200.png' },
      { name: 'Tr. Emmanuel Odongo', role: 'Transport Coordinator', imageUrl: 'https://placehold.co/200x200.png' },
      { name: 'Tr. Sam', role: 'Head of Clubs & Co-curriculum', imageUrl: 'https://placehold.co/200x200.png' },
    ],
  },
};

// --- Admissions -------------------------------------------------------------

export type AdmissionsContent = {
  header: { eyebrow: string; title: string; subtitle: string };
  processHeading: string;
  steps: { title: string; description: string }[];
  requirementsHeading: string;
  requirements: { level: string; items: string[] }[];
  aiGuide: { heading: string; text: string; buttonLabel: string };
  formsHeading: string;
  formsText: string;
  downloadButtonLabel: string;
  downloadUrl: string;
  formsNote: string;
  questionsHeading: string;
  questionsText: string;
};

export const DEFAULT_ADMISSIONS_CONTENT: AdmissionsContent = {
  header: {
    eyebrow: 'Admissions open for 2026',
    title: 'Admissions at Sibiah Star',
    subtitle: 'Join our vibrant learning community. We are excited to guide you through our admission process.',
  },
  processHeading: 'Our Admission Process',
  steps: [
    { title: 'Inquiry & Information', description: 'Contact us or visit our website to learn more about our programs and admission criteria. Attend an open house if available.' },
    { title: 'Application Submission', description: 'Complete and submit the online application form along with required documents and application fee.' },
    { title: 'Assessment/Interview', description: 'Prospective students may be required to undergo an age-appropriate assessment or interview.' },
    { title: 'Offer of Admission', description: 'Successful candidates will receive an offer of admission. Parents accept the offer and complete enrollment formalities.' },
    { title: 'Welcome to Sibiah Star!', description: 'Once enrollment is complete, your child becomes a part of the Sibiah Star family!' },
  ],
  requirementsHeading: 'Admission Requirements',
  requirements: [
    { level: 'Pre-school (Playgroup, PP1, PP2)', items: ['Birth Certificate copy', 'Passport-size photos (2)', 'Completed Application Form', 'Immunization Records'] },
    { level: 'Primary (Grade 1 - 6)', items: ['Birth Certificate copy', 'Previous School Report Cards (if applicable)', 'Transfer Certificate (if applicable)', 'Passport-size photos (2)'] },
    { level: 'Junior Secondary (Grade 7 - 9)', items: ['Birth Certificate copy', 'Previous School Report Cards', 'Transfer Certificate', 'Passport-size photos (2)', 'Recommendation Letter (optional)'] },
  ],
  aiGuide: {
    heading: 'AI Admission Guide',
    text: "Preparing for admissions? Our AI-powered tool helps you tailor questions for your child's specific needs based on their age and learning considerations.",
    buttonLabel: 'Launch AI Guide',
  },
  formsHeading: 'Application Forms',
  formsText: 'Download the necessary application forms here. Please ensure all sections are completed accurately.',
  downloadButtonLabel: 'Download Admission Form (All Levels)',
  downloadUrl: 'https://drive.google.com/file/d/1JSusZZDhgqaj2uG7VZ8-lqxD7wx_5_dE/view?usp=sharing',
  formsNote: 'Note: Online application portal coming soon!',
  questionsHeading: 'Have Questions?',
  questionsText: 'Our admissions team is here to help. Feel free to reach out with any queries.',
};

// --- Facilities -------------------------------------------------------------

export type FacilitiesContent = {
  header: { eyebrow: string; title: string; subtitle: string };
  facilities: { name: string; description: string; imageUrl: string }[];
  transport: { heading: string; paragraph: string; features: string[]; closing: string; imageUrl: string };
  amenitiesHeading: string;
  amenities: { name: string }[];
};

export const DEFAULT_FACILITIES_CONTENT: FacilitiesContent = {
  header: {
    eyebrow: 'Built for how children learn',
    title: 'Our Facilities',
    subtitle: 'Explore the modern, safe, and stimulating environment we provide for our students to learn and grow.',
  },
  facilities: [
    { name: 'Spacious Classrooms', description: 'Bright, airy, and well-equipped classrooms designed to foster an optimal learning environment. Each classroom is fitted with modern teaching aids.', imageUrl: 'https://placehold.co/600x400.png' },
    { name: 'Science Laboratories', description: 'State-of-the-art science labs for Physics, Chemistry, and Biology, allowing students to engage in practical experiments and discovery.', imageUrl: 'https://placehold.co/600x400.png' },
    { name: 'Computer & ICT Lab', description: 'Fully equipped computer lab with internet access and modern software to enhance digital literacy and ICT skills.', imageUrl: 'https://placehold.co/600x400.png' },
    { name: 'Library & Resource Center', description: 'A well-stocked library with a wide range of books, journals, and digital resources to support research and encourage reading habits.', imageUrl: 'https://placehold.co/600x400.png' },
    { name: 'Sports Grounds & Play Areas', description: 'Expansive sports fields for various outdoor games and dedicated play areas for younger children, promoting physical fitness and teamwork.', imageUrl: 'https://placehold.co/600x400.png' },
  ],
  transport: {
    heading: 'Transportation Services',
    paragraph:
      'Sibiah Star School offers a comprehensive and reliable transportation service for students, covering the entire local area. Our bus is well-maintained and equipped with safety features to ensure a secure and comfortable journey for your child.',
    features: [
      'Experienced and vetted driver.',
      'GPS tracking on the bus for real-time monitoring.',
      'Regular safety checks and maintenance.',
      'Convenient routes and pick-up/drop-off points.',
      'Attendant on board for younger children.',
    ],
    closing:
      'We strive to make the daily commute safe, convenient, and stress-free for both students and parents. For more details on routes and fees, please contact our administration office.',
    imageUrl: 'https://placehold.co/600x450.png',
  },
  amenitiesHeading: 'Other Amenities',
  amenities: [
    { name: 'Campus-wide Wi-Fi' },
    { name: 'Secure Campus with 24/7 security' },
    { name: 'Campus Shop for Uniforms and accessories' },
  ],
};

// --- Curriculum -------------------------------------------------------------

export type CurriculumLevel = { title: string; description: string; keyAreas: string[]; imageUrl: string };

export type CurriculumContent = {
  header: { eyebrow: string; title: string; subtitle: string };
  levelsHeading: string;
  levels: {
    preschool: CurriculumLevel;
    primary: CurriculumLevel;
    juniorSecondary: CurriculumLevel;
  };
  extracurricularHeading: string;
  extracurricularIntro: string;
  extracurricular: { name: string; description: string }[];
  approachHeading: string;
  approachText: string;
};

export const DEFAULT_CURRICULUM_CONTENT: CurriculumContent = {
  header: {
    eyebrow: 'Playgroup through Grade 9',
    title: 'Our Curriculum',
    subtitle: "A comprehensive and engaging educational experience designed to unlock every student's potential.",
  },
  levelsHeading: 'Educational Levels',
  levels: {
    preschool: {
      title: 'Pre-school Program (Playgroup, PP1, PP2)',
      description:
        'Our Pre-school program focuses on holistic development through play-based learning. We nurture curiosity, creativity, and social skills in a safe and stimulating environment, preparing children for a smooth transition to primary school.',
      keyAreas: [
        'Early Literacy & Numeracy',
        'Motor Skills Development',
        'Social & Emotional Learning',
        'Creative Arts & Expression',
        'Introduction to Environmental Awareness',
      ],
      imageUrl: 'https://placehold.co/600x400.png',
    },
    primary: {
      title: 'Primary School (Grade 1 - 6)',
      description:
        'The Primary curriculum builds a strong foundation in core academic subjects while fostering critical thinking and problem-solving skills. We emphasize a balanced education that includes academics, arts, and physical education.',
      keyAreas: [
        'Mathematics, English, Science',
        'Social Studies / Environmental Activities',
        'Kiswahili & Indigenous Languages',
        'Creative Arts (Music, Art)',
        'Physical Education & Health',
      ],
      imageUrl: 'https://placehold.co/600x400.png',
    },
    juniorSecondary: {
      title: 'Junior Secondary School (Grade 7 - 9)',
      description:
        'Our Junior Secondary program offers a broad and balanced curriculum designed to challenge students academically and prepare them for senior secondary education and future careers. We focus on developing independent learners and responsible citizens.',
      keyAreas: [
        'Core Subjects (Math, Sciences, Languages, Humanities)',
        'Pre-Technical & Pre-Career Education',
        'Digital Literacy & ICT Skills',
        'Life Skills Education',
        'Guidance & Counseling',
      ],
      imageUrl: 'https://placehold.co/600x400.png',
    },
  },
  extracurricularHeading: 'Extracurricular Activities',
  extracurricularIntro:
    'We believe in holistic development. Our diverse range of co-curricular activities helps students explore their interests, develop new skills, and build character outside the classroom.',
  extracurricular: [
    { name: 'Music Program', description: 'Vocal training, instrumental lessons (piano, guitar, drums), school band, and choir. Regular performances and recitals.' },
    { name: 'Scout Program', description: 'Camping, leadership training, community service projects, and skill-building workshops. Fosters teamwork and resilience.' },
    { name: 'Art & Craft Club', description: 'Painting, drawing, sculpting, pottery, and various craft activities. Annual art exhibitions.' },
    { name: 'Sports Teams', description: 'Football (Soccer), Basketball, Netball, Athletics. Participation in inter-school competitions.' },
    { name: 'Debate & Public Speaking', description: 'Develop critical thinking and communication skills through debates, model UN, and public speaking events.' },
  ],
  approachHeading: 'Our Educational Approach',
  approachText:
    'At Sibiah Star, we employ a student-centered approach that blends modern teaching methodologies with time-tested educational practices. We focus on inquiry-based learning, collaborative projects, and the integration of technology to create an engaging and effective learning experience. Our aim is to cultivate not just knowledgeable students, but also critical thinkers, problem solvers, and compassionate individuals ready to make a positive impact on the world. We are committed to continuous improvement and adapting our methods to meet the evolving needs of our learners.',
};

// --- Contact info block -----------------------------------------------------

export type ContactContent = {
  header: { eyebrow: string; title: string; subtitle: string };
  address: string;
  phoneDisplay: string;
  phoneHref: string;
  email: string;
  officeHours: { weekday: string; saturday: string; sunday: string };
};

export const DEFAULT_CONTACT_CONTENT: ContactContent = {
  header: {
    eyebrow: "We'd love to hear from you",
    title: 'Contact Us',
    subtitle: "We're here to help and answer any questions you might have. We look forward to hearing from you!",
  },
  address: 'Sibiah Star School, Baraka Mowlem, Behind Kinyago Secondary School, Nairobi.',
  phoneDisplay: '(254) 721-412004',
  phoneHref: '+254721412004',
  email: 'sibiahstarschool@gmail.com',
  officeHours: {
    weekday: 'Monday - Friday: 8:00 AM - 4:00 PM',
    saturday: 'Saturday: 9:00 AM - 12:00 PM (Admissions Office Only)',
    sunday: 'Sunday: Closed',
  },
};

// --- shared helpers -----------------------------------------------------

export type ContentByPage = {
  home: HomeContent;
  about: AboutContent;
  admissions: AdmissionsContent;
  facilities: FacilitiesContent;
  curriculum: CurriculumContent;
  contact: ContactContent;
};

export const DEFAULTS_BY_PAGE: ContentByPage = {
  home: DEFAULT_HOME_CONTENT,
  about: DEFAULT_ABOUT_CONTENT,
  admissions: DEFAULT_ADMISSIONS_CONTENT,
  facilities: DEFAULT_FACILITIES_CONTENT,
  curriculum: DEFAULT_CURRICULUM_CONTENT,
  contact: DEFAULT_CONTACT_CONTENT,
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Merges a (possibly partial, possibly empty) row from the database over
 * the hardcoded defaults. Arrays and primitives from the override replace
 * the default outright; plain objects are merged key by key. This way an
 * admin who only ever edited the hero text doesn't lose the rest of the
 * page's defaults, and a page nobody has touched yet renders exactly as
 * it always did.
 */
export function mergeContent<T>(defaults: T, override: unknown): T {
  if (!isPlainObject(override)) return defaults;
  if (!isPlainObject(defaults)) return (override as T) ?? defaults;

  const result: Record<string, unknown> = { ...(defaults as Record<string, unknown>) };
  for (const key of Object.keys(override)) {
    const overrideValue = override[key];
    const defaultValue = (defaults as Record<string, unknown>)[key];
    if (overrideValue === undefined) continue;
    result[key] = isPlainObject(defaultValue) && isPlainObject(overrideValue)
      ? mergeContent(defaultValue, overrideValue)
      : overrideValue;
  }
  return result as T;
}
