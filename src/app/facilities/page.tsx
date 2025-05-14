import { PageHeader } from '@/components/shared/page-header';
import Image from 'next/image';
import { BookOpen, FlaskConical, MonitorPlay, Utensils, Bus, ShieldCheck, Wifi, Trees } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Facilities',
  description: 'Discover the modern facilities at Sibiah Star School, including classrooms, labs, library, sports areas, and our comprehensive transport service.',
};

const facilitiesData = [
  {
    name: "Spacious Classrooms",
    description: "Bright, airy, and well-equipped classrooms designed to foster an optimal learning environment. Each classroom is fitted with modern teaching aids.",
    icon: <BookOpen className="h-10 w-10 text-accent" />,
    imageSrc: "https://placehold.co/600x400.png",
    imageAlt: "Modern classroom",
    imageHint: "classroom modern"
  },
  {
    name: "Science Laboratories",
    description: "State-of-the-art science labs for Physics, Chemistry, and Biology, allowing students to engage in practical experiments and discovery.",
    icon: <FlaskConical className="h-10 w-10 text-accent" />,
    imageSrc: "https://placehold.co/600x400.png",
    imageAlt: "Science laboratory",
    imageHint: "science lab"
  },
  {
    name: "Computer & ICT Lab",
    description: "Fully equipped computer lab with internet access and modern software to enhance digital literacy and ICT skills.",
    icon: <MonitorPlay className="h-10 w-10 text-accent" />,
    imageSrc: "https://placehold.co/600x400.png",
    imageAlt: "Computer lab",
    imageHint: "computer lab"
  },
  {
    name: "Library & Resource Center",
    description: "A well-stocked library with a wide range of books, journals, and digital resources to support research and encourage reading habits.",
    icon: <BookOpen className="h-10 w-10 text-accent" />,
    imageSrc: "https://placehold.co/600x400.png",
    imageAlt: "School library",
    imageHint: "school library"
  },
  {
    name: "Cafeteria / Dining Hall",
    description: "A clean and hygienic cafeteria providing nutritious and balanced meals for students and staff.",
    icon: <Utensils className="h-10 w-10 text-accent" />,
    imageSrc: "https://placehold.co/600x400.png",
    imageAlt: "School cafeteria",
    imageHint: "school cafeteria"
  },
  {
    name: "Sports Grounds & Play Areas",
    description: "Expansive sports fields for various outdoor games and dedicated play areas for younger children, promoting physical fitness and teamwork.",
    icon: <Trees className="h-10 w-10 text-accent" />, // Using Trees for general outdoor space
    imageSrc: "https://placehold.co/600x400.png",
    imageAlt: "School sports ground",
    imageHint: "sports ground"
  },
];

export default function FacilitiesPage() {
  return (
    <div>
      <PageHeader
        title="Our Facilities"
        subtitle="Explore the modern, safe, and stimulating environment we provide for our students to learn and grow."
      />

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {facilitiesData.map((facility) => (
              <div key={facility.name} className="bg-card rounded-lg shadow-lg overflow-hidden flex flex-col">
                <div className="relative h-56 w-full">
                  <Image
                    src={facility.imageSrc}
                    alt={facility.imageAlt}
                    layout="fill"
                    objectFit="cover"
                    data-ai-hint={facility.imageHint}
                  />
                </div>
                <div className="p-6 flex-grow flex flex-col">
                  <div className="flex items-center mb-3">
                    <div className="p-2 bg-accent/10 rounded-md mr-3">{facility.icon}</div>
                    <h3 className="text-xl font-semibold text-primary">{facility.name}</h3>
                  </div>
                  <p className="text-foreground/80 text-sm leading-relaxed flex-grow">{facility.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-secondary/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Image
                src="https://placehold.co/600x450.png"
                alt="School bus"
                width={600}
                height={450}
                className="rounded-lg shadow-xl object-cover"
                data-ai-hint="school bus transport"
              />
            </div>
            <div>
              <div className="flex items-center mb-4">
                 <Bus className="h-12 w-12 text-accent mr-4" />
                 <h2 className="text-2xl md:text-3xl font-bold text-primary">Transportation Services</h2>
              </div>
              <p className="text-foreground/80 mb-4 leading-relaxed">
                Sibiah Star School offers a comprehensive and reliable transportation service for students, covering the entire local area. Our fleet of buses is well-maintained and equipped with safety features to ensure a secure and comfortable journey for your child.
              </p>
              <ul className="space-y-2 text-foreground/80">
                <li className="flex items-center"><ShieldCheck className="h-5 w-5 mr-2 text-green-500" /> Experienced and vetted drivers.</li>
                <li className="flex items-center"><ShieldCheck className="h-5 w-5 mr-2 text-green-500" /> GPS tracking on all buses for real-time monitoring.</li>
                <li className="flex items-center"><ShieldCheck className="h-5 w-5 mr-2 text-green-500" /> Regular safety checks and maintenance.</li>
                <li className="flex items-center"><ShieldCheck className="h-5 w-5 mr-2 text-green-500" /> Convenient routes and pick-up/drop-off points.</li>
                <li className="flex items-center"><ShieldCheck className="h-5 w-5 mr-2 text-green-500" /> Attendants on board for younger children.</li>
              </ul>
              <p className="mt-4 text-foreground/80 leading-relaxed">
                We strive to make the daily commute safe, convenient, and stress-free for both students and parents. For more details on routes and fees, please contact our administration office.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-primary text-center mb-10">Other Amenities</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 text-center">
            {[
              { name: "Campus-wide Wi-Fi", icon: <Wifi className="h-8 w-8 text-accent" /> },
              { name: "Secure Campus with CCTV", icon: <ShieldCheck className="h-8 w-8 text-accent" /> },
              { name: "Green Spaces & Gardens", icon: <Trees className="h-8 w-8 text-accent" /> },
            ].map(item => (
              <div key={item.name} className="p-6 bg-card rounded-lg shadow-md">
                {item.icon}
                <h3 className="mt-2 font-semibold text-primary">{item.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
