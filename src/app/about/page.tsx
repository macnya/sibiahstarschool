import { PageHeader } from '@/components/shared/page-header';
import Image from 'next/image';
import { Users, Target, Eye, Heart, School } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about Sibiah Star School\'s history, mission, vision, values, and our dedicated team.',
};

export default function AboutPage() {
  return (
    <div>
      <PageHeader
        title="About Sibiah Star School"
        subtitle="Dedicated to Excellence in Education and Character Development Since [Year Founded]"
      />

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl font-bold text-primary mb-4">Our Story</h2>
              <p className="text-foreground/80 mb-4 leading-relaxed">
                Sibiah Star Pre-school, Primary & Junior School was founded with a passion for providing holistic education that nurtures both academic prowess and strong moral character. For over 20 years, we have been committed to creating a supportive and stimulating environment where students can thrive and reach their full potential. Our journey began with a small group of dedicated educators and has grown into a vibrant community recognized for its commitment to excellence.
              </p>
              <p className="text-foreground/80 leading-relaxed">
                We believe in a balanced approach to education, integrating rigorous academics with enriching co-curricular activities. Our focus extends beyond textbooks to instill values such as integrity, respect, and responsibility in every student.
              </p>
            </div>
            <div>
              <Image
                src="/images/SibiahStarposter.jpg"
                alt="School building or happy students"
                width={600}
                height={400}
                className="rounded-lg shadow-xl object-cover"
                data-ai-hint="school building students"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-secondary/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <Target className="h-12 w-12 text-accent mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-primary mb-2">Our Mission</h3>
              <p className="text-foreground/80 text-sm">
                To provide a high-quality, inclusive education that empowers students to become critical thinkers, lifelong learners, and compassionate leaders in a global society.
              </p>
            </div>
            <div className="p-6">
              <Eye className="h-12 w-12 text-accent mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-primary mb-2">Our Vision</h3>
              <p className="text-foreground/80 text-sm">
                To be a leading educational institution renowned for academic excellence, innovation, and the holistic development of every child.
              </p>
            </div>
            <div className="p-6">
              <Heart className="h-12 w-12 text-accent mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-primary mb-2">Our Core Values</h3>
              <ul className="text-foreground/80 text-sm space-y-1">
                <li>Excellence</li>
                <li>Integrity</li>
                <li>Respect</li>
                <li>Collaboration</li>
                <li>Resilience</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-primary text-center mb-10">Message from the Director</h2>
          <div className="max-w-3xl mx-auto bg-card p-8 rounded-lg shadow-lg">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-6">
              <Image
                src="https://placehold.co/150x150.png"
                alt="Principal's Portrait"
                width={150}
                height={150}
                className="rounded-full object-cover shadow-md flex-shrink-0"
                data-ai-hint="portrait person"
              />
              <div>
                <h3 className="text-xl font-semibold text-primary">Mrs. Sibiah Kwamboka Nyamwamu</h3>
                <p className="text-accent font-medium">School Director</p>
              </div>
            </div>
            <p className="text-foreground/80 mb-4 leading-relaxed">
              "Welcome to Sibiah Star School! It is my pleasure to lead this wonderful institution where we are deeply committed to fostering an environment of learning, growth, and discovery. Our dedicated team of educators works tirelessly to provide an engaging curriculum that challenges and inspires our students."
            </p>
            <p className="text-foreground/80 leading-relaxed">
              "We believe that education is a partnership between the school, parents, and the community. Together, we can help our students develop the skills, knowledge, and character necessary to succeed in an ever-changing world. We invite you to explore our website and learn more about the exciting opportunities at Sibiah Star."
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-secondary/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-primary text-center mb-10">Our Dedicated Team</h2>
          <p className="text-center text-foreground/80 max-w-2xl mx-auto mb-8">
            At Sibiah Star, we are proud of our team of experienced and passionate educators and staff who are committed to providing the best possible learning experience for our students. They are the heart of our school community.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: "Mr. Raphael ", role: "Head of Primary", imageHint: "teacher portrait" },
              { name: "Mrs. Edith Ojiambo", role: "Head of Administration & Finance", imageHint: "teacher portrait" },
              { name: "Mr. Martin", role: "Junior Secondary Coordinator", imageHint: "teacher portrait" },
              { name: "Mrs. Fanne Mwambi", role: "Administration & Communication", imageHint: "counselor portrait" },
              { name: "Mr. Emmanuel Odongo", role: "Transport Coordinator", imageHint: "teacher portrait" },
              { name: "Mr. Sam ", role: "Head of Clubs & Co-curriculum", imageHint: "teacher portrait" }
            ].map((staff) => (
              <div key={staff.name} className="text-center bg-card p-4 rounded-lg shadow-md">
                <Image
                  src="https://placehold.co/200x200.png"
                  alt={staff.name}
                  width={120}
                  height={120}
                  className="rounded-full mx-auto mb-3 object-cover"
                  data-ai-hint={staff.imageHint}
                />
                <h4 className="font-semibold text-primary">{staff.name}</h4>
                <p className="text-xs text-accent">{staff.role}</p>
              </div>
            ))}
          </div>
           {/* <div className="text-center mt-8">
             <Button variant="link" asChild className="text-accent">
               <Link href="/staff">Meet Our Full Team <ArrowRight className="ml-2 h-4 w-4"/></Link>
             </Button>
           </div> */}
        </div>
      </section>
    </div>
  );
}
