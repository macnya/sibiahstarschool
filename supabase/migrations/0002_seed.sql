-- =====================================================================
-- Seed with the content that was previously hardcoded in the page files.
-- Run after 0001_init.sql. Safe to re-run: conflicts are ignored.
--
-- Every image_url below is a placeholder. Replace them from the admin
-- panel once you upload real photos.
-- =====================================================================

insert into public.events
  (title, slug, event_date, location, description, image_url, image_hint, published)
values
  ('Annual Sports Day',
   'annual-sports-day-2025',
   '2025-03-15',
   'Sports Ground',
   'Join us for a day of thrilling athletic competitions, team spirit, and fun for the whole family.',
   'https://placehold.co/600x400.png', 'sports day', true),

  ('CBC Exhibition',
   'science-fair-2025',
   '2025-04-22',
   'School Ground',
   'Witness the innovative projects and talents of our students from all grades.',
   'https://placehold.co/600x400.png', 'science fair', true),

  ('Parent-Teacher Conference',
   'parent-teacher-conference-may-2025',
   '2025-05-10',
   'Respective Classrooms',
   'An opportunity for parents to discuss their child''s progress with teachers.',
   'https://placehold.co/600x400.png', 'meeting conference', true),

  ('Cultural Day Celebration',
   'cultural-day-2025',
   '2025-06-05',
   'School Ground',
   'Experience a vibrant display of diverse cultures through music, dance, and drama performances.',
   'https://placehold.co/600x400.png', 'cultural festival', true),

  ('Pre-School Graduation',
   'preschool-graduation-2025',
   '2025-07-12',
   'School Ground',
   'Celebrating our little stars as they move on to Primary school. A joyous occasion for PP2 students and their families.',
   'https://placehold.co/600x400.png', 'preschool graduation', true),

  ('Junior Secondary Open House',
   'junior-secondary-open-house-2025',
   '2025-08-20',
   'Junior Secondary Block',
   'Prospective students and parents are invited to explore our Junior Secondary facilities and meet our faculty.',
   'https://placehold.co/600x400.png', 'school open house', true)
on conflict (slug) do nothing;


insert into public.blog_posts
  (title, slug, author, excerpt, published_at, image_url, image_hint, published)
values
  ('The Importance of Early Childhood Education',
   'importance-early-childhood-education',
   'Dr. Emily Carter, Head of Pre-school',
   'Discover why the foundational years in pre-school are crucial for a child''s lifelong learning journey and overall development.',
   '2025-02-28',
   'https://placehold.co/600x400.png', 'children learning', true),

  ('Fostering a Love for Reading in Primary Students',
   'fostering-love-for-reading',
   'Mr. David Lee, Grade 3 Teacher',
   'Tips and strategies for parents and educators to encourage primary school children to develop a passion for reading.',
   '2025-03-05',
   'https://placehold.co/600x400.png', 'child reading book', true),

  ('Navigating Junior Secondary: A Guide for Students and Parents',
   'navigating-junior-secondary',
   'Ms. Sarah Chen, School Counselor',
   'Practical advice for students transitioning to junior secondary and how parents can support them during this important phase.',
   '2025-03-12',
   'https://placehold.co/600x400.png', 'teenager student', true),

  ('The Role of Extracurricular Activities in Holistic Development',
   'role-extracurricular-activities',
   'Mr. Tom Baker, Sports Coordinator',
   'Exploring how activities like sports, music, and clubs contribute to a well-rounded education and personal growth.',
   '2025-03-19',
   'https://placehold.co/600x400.png', 'students playing sports', true)
on conflict (slug) do nothing;


insert into public.gallery_images
  (image_url, alt_text, caption, image_hint, sort_order, published)
values
  ('https://placehold.co/600x400.png', 'Students in classroom',  'Engaged Learning in Classroom',        'students classroom',   1, true),
  ('https://placehold.co/600x400.png', 'School sports day',      'Annual Sports Day Fun',               'school sports',        2, true),
  ('https://placehold.co/600x400.png', 'Science fair project',   'Innovative Science Fair Projects',    'science fair',         3, true),
  ('https://placehold.co/600x400.png', 'Music class performance','Musical Talents on Display',          'music class',          4, true),
  ('https://placehold.co/600x400.png', 'Art exhibition',         'Creative Art Exhibition',             'art exhibition',       5, true),
  ('https://placehold.co/600x400.png', 'School assembly',        'Morning Assembly Gatherings',         'school assembly',      6, true),
  ('https://placehold.co/600x400.png', 'Students in library',    'Exploring Worlds in the Library',     'library students',     7, true),
  ('https://placehold.co/600x400.png', 'Graduation ceremony',    'Celebrating Achievements: Graduation', 'graduation ceremony',  8, true),
  ('https://placehold.co/600x400.png', 'Scout camp activity',    'Adventures at Scout Camp',            'scout camp',           9, true);
