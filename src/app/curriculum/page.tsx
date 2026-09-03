import { PageHeader } from '@/components/shared/page-header';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BookOpen, Users, Award, Music, Globe, Palette, Dumbbell, Brain } from 'lucide-react';
import Image from 'next/image';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Curriculum',
  description: 'Explore the comprehensive curriculum at Sibiah Star School, from Pre-school to Junior Secondary, including our enriching extracurricular activities.',
};

const curriculumData = {
  preschool: {
    id: "preschool",
    title: "Pre-school Program (Playgroup, PP1, PP2)",
    icon: <Users className="h-8 w-8 text-accent" />,
    description: "Our Pre-school program focuses on holistic development through play-based learning. We nurture curiosity, creativity, and social skills in a safe and stimulating environment, preparing children for a smooth transition to primary school.",
    keyAreas: ["Early Literacy & Numeracy", "Motor Skills Development", "Social & Emotional Learning", "Creative Arts & Expression", "Introduction to Environmental Awareness"],
    image: { src: "https://placehold.co/600x400.png", alt: "Children in preschool", hint: "preschool children" }
  },
  primary: {
    id: "primary",
    title: "Primary School (Grade 1 - 6)",
    icon: <BookOpen className="h-8 w-8 text-accent" />,
    description: "The Primary curriculum builds a strong foundation in core academic subjects while fostering critical thinking and problem-solving skills. We emphasize a balanced education that includes academics, arts, and physical education.",
    keyAreas: ["Mathematics, English, Science", "Social Studies / Environmental Activities", "Kiswahili & Indigenous Languages", "Creative Arts (Music, Art)", "Physical Education & Health"],
    image: { src: "https://placehold.co/600x400.png", alt: "Primary school students in class", hint: "primary students" }
  },
  juniorSecondary: {
    id: "junior-secondary",
    title: "Junior Secondary School (Grade 7 - 9)",
    icon: <Award className="h-8 w-8 text-accent" />,
    description: "Our Junior Secondary program offers a broad and balanced curriculum designed to challenge students academically and prepare them for senior secondary education and future careers. We focus on developing independent learners and responsible citizens.",
    keyAreas: ["Core Subjects (Math, Sciences, Languages, Humanities)", "Pre-Technical & Pre-Career Education", "Digital Literacy & ICT Skills", "Life Skills Education", "Guidance & Counseling"],
    image: { src: "https://placehold.co/600x400.png", alt: "Junior secondary students in a lab", hint: "secondary students lab" }
  }
};

const extracurricularActivities = [
  { name: "Music Program", icon: <Music className="h-6 w-6 text-primary" />, description: "Vocal training, instrumental lessons (piano, guitar, drums), school band, and choir. Regular performances and recitals." },
  { name: "Scout Program", icon: <Globe className="h-6 w-6 text-primary" />, description: "Camping, leadership training, community service projects, and skill-building workshops. Fosters teamwork and resilience." },
  { name: "Art & Craft Club", icon: <Palette className="h-6 w-6 text-primary" />, description: "Painting, drawing, sculpting, pottery, and various craft activities. Annual art exhibitions." },
  { name: "Sports Teams", icon: <Dumbbell className="h-6 w-6 text-primary" />, description: "Football (Soccer), Basketball, Netball, Athletics. Participation in inter-school competitions." },
  { name: "Debate & Public Speaking", icon: <Brain className="h-6 w-6 text-primary" />, description: "Develop critical thinking and communication skills through debates, model UN, and public speaking events." },
];

export default function CurriculumPage() {
  return (
    <div>
      <PageHeader
        title="Our Curriculum"
        subtitle="A comprehensive and engaging educational experience designed to unlock every student's potential."
      />

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-primary text-center mb-12">Educational Levels</h2>
          <Accordion type="single" collapsible className="w-full max-w-4xl mx-auto" defaultValue="preschool">
            {Object.values(curriculumData).map((level) => (
              <AccordionItem value={level.id} key={level.id} className="mb-4 bg-card rounded-lg shadow-md overflow-hidden">
                <AccordionTrigger className="p-6 text-xl font-semibold text-primary hover:bg-secondary/50 transition-colors data-[state=open]:bg-secondary/50">
                  <div className="flex items-center space-x-3">
                    {level.icon}
                    <span>{level.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-6 bg-card">
                  <div className="grid md:grid-cols-2 gap-6 items-center">
                    <div>
                      <p className="text-foreground/80 mb-4 leading-relaxed">{level.description}</p>
                      <h4 className="font-semibold text-primary mb-2">Key Learning Areas:</h4>
                      <ul className="list-disc list-inside space-y-1 text-foreground/80 text-sm">
                        {level.keyAreas.map((area) => <li key={area}>{area}</li>)}
                      </ul>
                    </div>
                    <div className="mt-4 md:mt-0">
                      <Image
                        src={level.image.src}
                        alt={level.image.alt}
                        width={500}
                        height={300}
                        className="rounded-md object-cover shadow-lg"
                        data-ai-hint={level.image.hint}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section id="extracurricular" className="py-16 md:py-20 bg-secondary/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-primary text-center mb-12">Extracurricular Activities</h2>
          <p className="text-center text-foreground/80 max-w-2xl mx-auto mb-10">
            We believe in holistic development. Our diverse range of co-curricular activities helps students explore their interests, develop new skills, and build character outside the classroom.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {extracurricularActivities.map((activity) => (
              <div key={activity.name} className="bg-card p-6 rounded-lg shadow-lg flex flex-col items-start hover:shadow-xl transition-shadow">
                <div className="p-3 rounded-full bg-accent/20 mb-4">
                  {activity.icon}
                </div>
                <h3 className="text-xl font-semibold text-primary mb-2">{activity.name}</h3>
                <p className="text-foreground/80 text-sm leading-relaxed">{activity.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">Our Educational Approach</h2>
            <p className="text-lg text-foreground/80 max-w-3xl mx-auto leading-relaxed">
                At Sibiah Star, we employ a student-centered approach that blends modern teaching methodologies with time-tested educational practices. We focus on inquiry-based learning, collaborative projects, and the integration of technology to create an engaging and effective learning experience. Our aim is to cultivate not just knowledgeable students, but also critical thinkers, problem solvers, and compassionate individuals ready to make a positive impact on the world. We are committed to continuous improvement and adapting our methods to meet the evolving needs of our learners.
            </p>
        </div>
      </section>
    </div>
  );
}
