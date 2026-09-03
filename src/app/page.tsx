
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { InfoCard } from '@/components/shared/info-card';
import { Award, BookOpen, Bus, Lightbulb, Users, ShieldCheck, Music, Globe, CalendarDays, Newspaper } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary to-blue-700 text-primary-foreground py-20 md:py-32">
        <div className="absolute inset-0">
            <Image 
              src="https://placehold.co/1920x1080.png" 
              alt="School campus background" 
              fill
              style={{ objectFit: "cover" }}
              className="opacity-20"
              priority // Good to add for LCP images
              data-ai-hint="school campus"
            />
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
            Welcome to <span className="text-accent">Sibiah Star</span> School
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl">
            Nurturing potential, inspiring futures. Discover a vibrant learning community for Pre-school, Primary, and Junior Secondary students.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Button size="lg" asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href="/admissions">Apply Now</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">
              <Link href="/about">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* School Levels Section */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-primary mb-12">Our Educational Journey</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <InfoCard
              title="Pre-school (Playgroup, PP1, PP2)"
              description="A nurturing start to education, fostering curiosity and foundational skills through play-based learning."
              icon={<Users className="h-8 w-8" />}
              linkHref="/curriculum#preschool"
            />
            <InfoCard
              title="Primary (Grade 1 - 6)"
              description="Building strong academic foundations and character development in a supportive environment."
              icon={<BookOpen className="h-8 w-8" />}
              linkHref="/curriculum#primary"
            />
            <InfoCard
              title="Junior Secondary (Grade 7 - 9)"
              description="Preparing students for higher education and future success with a comprehensive and challenging curriculum."
              icon={<Award className="h-8 w-8" />}
              linkHref="/curriculum#junior-secondary"
            />
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-primary mb-12">Why Choose Sibiah Star?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-md">
              <Lightbulb className="h-12 w-12 text-accent mb-4" />
              <h3 className="text-xl font-semibold text-primary mb-2">Modern Facilities</h3>
              <p className="text-foreground/80 text-sm">State-of-the-art classrooms, labs, and learning spaces.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-md">
              <Bus className="h-12 w-12 text-accent mb-4" />
              <h3 className="text-xl font-semibold text-primary mb-2">Transport Services</h3>
              <p className="text-foreground/80 text-sm">Safe and reliable transportation covering the entire area.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-md">
              <Award className="h-12 w-12 text-accent mb-4" />
              <h3 className="text-xl font-semibold text-primary mb-2">Excellent Academics</h3>
              <p className="text-foreground/80 text-sm">Proven track record of academic excellence and student achievement.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-md">
              <ShieldCheck className="h-12 w-12 text-accent mb-4" />
              <h3 className="text-xl font-semibold text-primary mb-2">Character Development</h3>
              <p className="text-foreground/80 text-sm">Fostering values, discipline, and leadership skills.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Co-curricular Activities */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-primary mb-12">Beyond the Classroom</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
             <InfoCard
              title="Music Program"
              description="Explore creativity and talent with our diverse music classes and ensembles."
              icon={<Music className="h-8 w-8" />}
              linkHref="/curriculum#extracurricular"
            />
             <InfoCard
              title="Scout Program"
              description="Developing leadership, teamwork, and outdoor skills through engaging scout activities."
              icon={<Globe className="h-8 w-8" />}
              linkHref="/curriculum#extracurricular"
            />
          </div>
        </div>
      </section>

      {/* Call to Action / Quick Links */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-primary mb-6">Get Involved</h2>
          <p className="text-lg text-foreground/80 mb-8 max-w-xl mx-auto">
            Join our community, attend an event, or read our latest news.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/events"><CalendarDays className="mr-2 h-5 w-5"/> Upcoming Events</Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/blog"><Newspaper className="mr-2 h-5 w-5"/> School Blog</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
}
