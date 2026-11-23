import { getPageContent } from '@/lib/site-content/queries';
import { getActiveCampusesWithGrades } from '@/lib/campuses/queries';
import { getPublishedEvents, getPublishedGallery, getPublishedPosts } from '@/lib/queries';
import { OurSchools } from '@/components/shared/our-schools';
import { Hero } from '@/components/home/hero';
import { QuickActions } from '@/components/home/quick-actions';
import { Welcome } from '@/components/home/welcome';
import { StatsBand } from '@/components/home/stats-band';
import { Pillars } from '@/components/home/pillars';
import { Highlights } from '@/components/home/highlights';
import { ExploreMosaic } from '@/components/home/explore-mosaic';
import { BelieveTabs } from '@/components/home/believe-tabs';
import { NewsEvents } from '@/components/home/news-events';
import { AdmissionBand } from '@/components/home/admission-band';
import { isRealImage } from '@/components/site/safe-image';

export const dynamic = 'force-dynamic';

/** Never let a hiccup in one data source blank the whole home page. */
async function safely<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try { return await promise; } catch { return fallback; }
}

export default async function HomePage() {
  const [home, about, campuses, events, posts, gallery] = await Promise.all([
    getPageContent('home'),
    getPageContent('about'),
    safely(getActiveCampusesWithGrades(), []),
    safely(getPublishedEvents(), []),
    safely(getPublishedPosts(), []),
    safely(getPublishedGallery(), []),
  ]);

  // Photos managed in Admin → Gallery are used wherever the design has room for a picture.
  const photos = gallery.map((g) => g.image_url).filter(isRealImage);
  const classCount = new Set(campuses.flatMap((c) => c.grades.map((g) => g.id))).size;

  return (
    <>
      <Hero
        eyebrow={home.heroEyebrow}
        title={home.hero.title}
        highlight={home.hero.highlight}
        subtitle={home.hero.subtitle}
        imageUrl={home.heroImage.url}
      />
      <QuickActions />
      <Welcome story={about.story.paragraph1} mission={about.mission.text} imageUrl={about.story.imageUrl} />
      <StatsBand schools={campuses.length} classes={classCount} />
      <Pillars heading={home.levelsHeading} levels={home.levels} images={photos} />
      <OurSchools />
      <Highlights heading={home.highlightsHeading} items={home.highlights} />
      <ExploreMosaic images={photos.slice(3)} cocurricularTitle={home.cocurricular[0]?.title} />
      <BelieveTabs mission={about.mission.text} vision={about.vision.text} values={about.values.items} />
      <NewsEvents posts={posts.slice(0, 3)} events={events.slice(0, 3)} />
      <AdmissionBand text={home.getInvolvedText} />
    </>
  );
}
