import type { FC } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, UserCircle, ArrowRight } from 'lucide-react';

export interface BlogPostProps {
  title: string;
  date: string;
  author: string;
  excerpt: string;
  imageUrl: string;
  imageHint?: string;
  slug: string;
}

export const BlogPostCard: FC<BlogPostProps> = ({ title, date, author, excerpt, imageUrl, imageHint, slug }) => {
  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
      <div className="relative w-full h-52">
        <Image
          src={imageUrl}
          alt={title}
          layout="fill"
          objectFit="cover"
          data-ai-hint={imageHint || "blog post image"}
        />
      </div>
      <CardHeader>
        <CardTitle className="text-xl text-primary line-clamp-2">{title}</CardTitle>
        <div className="flex items-center text-xs text-muted-foreground space-x-4 pt-1">
          <div className="flex items-center">
            <CalendarDays className="h-3.5 w-3.5 mr-1.5 text-accent" />
            <span>{date}</span>
          </div>
          <div className="flex items-center">
            <UserCircle className="h-3.5 w-3.5 mr-1.5 text-accent" />
            <span>By {author}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <CardDescription className="text-sm text-foreground/80 line-clamp-4">
          {excerpt}
        </CardDescription>
      </CardContent>
      <CardFooter>
        <Button asChild variant="link" className="text-accent p-0 hover:underline">
          <Link href={`/blog/${slug}`}>
            Read More
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};
