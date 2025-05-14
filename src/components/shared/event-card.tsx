import type { FC } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, MapPin, ArrowRight } from 'lucide-react';

export interface EventProps {
  title: string;
  date: string;
  location: string;
  description: string;
  imageUrl: string;
  imageHint?: string;
  slug: string;
}

export const EventCard: FC<EventProps> = ({ title, date, location, description, imageUrl, imageHint, slug }) => {
  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
      <div className="relative w-full h-48">
        <Image
          src={imageUrl}
          alt={title}
          layout="fill"
          objectFit="cover"
          data-ai-hint={imageHint || "event image"}
        />
      </div>
      <CardHeader>
        <CardTitle className="text-xl text-primary">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow space-y-2">
        <div className="flex items-center text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4 mr-2 text-accent" />
          <span>{date}</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 mr-2 text-accent" />
          <span>{location}</span>
        </div>
        <CardDescription className="text-sm text-foreground/80 pt-2 line-clamp-3">
          {description}
        </CardDescription>
      </CardContent>
      <CardFooter>
        <Button asChild variant="link" className="text-accent p-0 hover:underline">
          <Link href={`/events/${slug}`}>
            View Details
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};
