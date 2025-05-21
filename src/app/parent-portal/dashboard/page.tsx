
'use client';

import { PageHeader } from '@/components/shared/page-header';
import { useAuth } from '@/contexts/auth-provider';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, UserCircle, LogOut, BookOpen, BarChart2, Smile, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Image from 'next/image';

// Mock data - replace with actual data fetching
const mockParentData = {
  name: "Jane Doe (Parent)",
  students: [
    {
      id: "student1",
      name: "John Doe",
      class: "Grade 5A",
      profilePic: "https://placehold.co/100x100.png",
      profilePicHint: "student portrait",
      grades: [
        { subject: "Mathematics", score: "A", term: "Term 1" },
        { subject: "Science", score: "B+", term: "Term 1" },
        { subject: "English", score: "A-", term: "Term 1" },
        { subject: "Mathematics", score: "A-", term: "Term 2" },
        { subject: "Science", score: "A", term: "Term 2" },
        { subject: "English", score: "A", term: "Term 2" },
      ],
      performanceOverview: "John is showing great improvement in Mathematics and actively participates in Science. He is a diligent student."
    },
    {
      id: "student2",
      name: "Alice Doe",
      class: "Grade 3B",
      profilePic: "https://placehold.co/100x100.png",
      profilePicHint: "student portrait",
      grades: [
        { subject: "English", score: "A+", term: "Term 1" },
        { subject: "History", score: "A", term: "Term 1" },
        { subject: "Art", score: "A+", term: "Term 1" },
      ],
      performanceOverview: "Alice excels in English and shows a remarkable talent in Art. She is a creative and engaged learner."
    }
  ]
};

export default function ParentDashboardPage() {
  const { user, logout, loading: authLoading, initialLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!initialLoading && !user) {
      router.push('/parent-portal');
    }
  }, [user, initialLoading, router]);

  if (initialLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // In a real app, you'd fetch this data based on the logged-in parent (user.uid)
  const parentData = mockParentData;

  return (
    <div>
      <PageHeader
        title="Parent Dashboard"
        subtitle={`Welcome, ${user.displayName || user.email}!`}
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-semibold text-primary">Your Children's Overview</h2>
          <Button onClick={logout} disabled={authLoading} variant="outline">
            {authLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
            Logout
          </Button>
        </div>

        {parentData.students.length === 0 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center"><AlertTriangle className="mr-2 h-6 w-6 text-destructive" /> No Students Linked</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/80">It appears there are no students currently linked to your account. Please contact the school administration if you believe this is an error.</p>
            </CardContent>
          </Card>
        )}

        <Accordion type="multiple" className="w-full space-y-6">
          {parentData.students.map((student) => (
            <AccordionItem value={student.id} key={student.id} className="bg-card border border-border rounded-lg shadow-lg overflow-hidden">
              <AccordionTrigger className="p-6 hover:bg-secondary/10 text-left">
                <div className="flex items-center space-x-4">
                  <Image 
                    src={student.profilePic} 
                    alt={student.name} 
                    width={60} height={60} 
                    className="rounded-full"
                    data-ai-hint={student.profilePicHint}
                  />
                  <div>
                    <h3 className="text-xl font-semibold text-primary">{student.name}</h3>
                    <p className="text-sm text-muted-foreground">{student.class}</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-6 bg-background/50">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center"><BookOpen className="mr-2 h-5 w-5 text-accent" /> Grades</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {student.grades.length > 0 ? (
                        <ul className="space-y-2 text-sm">
                          {student.grades.map((grade, index) => (
                            <li key={index} className="flex justify-between p-2 rounded-md even:bg-secondary/5">
                              <span><strong>{grade.subject}</strong> ({grade.term}):</span>
                              <span className="font-medium text-primary">{grade.score}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground text-sm">No grades available yet.</p>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center"><BarChart2 className="mr-2 h-5 w-5 text-accent" /> Performance Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-foreground/80 leading-relaxed">{student.performanceOverview}</p>
                    </CardContent>
                     <CardFooter>
                        <Button variant="link" className="text-accent p-0 text-sm">View Detailed Report (Coming Soon)</Button>
                    </CardFooter>
                  </Card>
                </div>
                <div className="mt-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-md">
                  <div className="flex items-center">
                    <Smile className="h-6 w-6 text-green-600 mr-3"/>
                    <p className="text-sm text-green-700">Teachers' Note: {student.name} is encouraged to continue exploring their interests in coding club!</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}

