
'use client';

import { PageHeader } from '@/components/shared/page-header';
import { useAuth } from '@/contexts/auth-provider';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, UserCircle, LogOut, CalendarCheck, ClipboardList, BarChartHorizontal, BookCopy, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Mock data - replace with actual data fetching
const mockStudentData = {
  name: "Alex Johnson (Student)",
  class: "Grade 8B",
  upcomingExams: [
    { id: "exam1", subject: "Mathematics Final", date: "2025-06-15", type: "Exam", details: "Covers chapters 1-8. Duration: 2 hours." },
    { id: "exam2", subject: "Science Unit Test", date: "2025-06-01", type: "Test", details: "Chapter 5: Energy. Duration: 45 minutes." },
    { id: "exam3", subject: "History Project Due", date: "2025-06-10", type: "Project", details: "Presentation on Ancient Civilizations." }
  ],
  grades: [
    { subject: "Mathematics", score: "A-", term: "Term 1", remarks: "Good understanding of concepts." },
    { subject: "Science", score: "B+", term: "Term 1", remarks: "Needs to focus more on practicals." },
    { subject: "English", score: "A", term: "Term 1", remarks: "Excellent creative writing skills." },
    { subject: "History", score: "B", term: "Term 1", remarks: "Improvement needed in date recall." }
  ],
  performanceOverview: "Alex is performing well overall, with notable strengths in English. Consistent effort in Science practicals will further boost performance. Upcoming Mathematics exam is crucial."
};

export default function StudentDashboardPage() {
  const { user, logout, loading: authLoading, initialLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!initialLoading && !user) {
      router.push('/student-portal');
    }
  }, [user, initialLoading, router]);

  if (initialLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // In a real app, you'd fetch this data based on the logged-in student (user.uid)
  const studentData = mockStudentData;

  return (
    <div>
      <PageHeader
        title="Student Dashboard"
        subtitle={`Welcome back, ${user.displayName || user.email}!`}
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-primary">{studentData.name}</h2>
            <p className="text-md text-muted-foreground">{studentData.class}</p>
          </div>
          <Button onClick={logout} disabled={authLoading} variant="outline">
            {authLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
            Logout
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Column 1: Upcoming Exams/Tests */}
          <Card className="lg:col-span-1 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl flex items-center"><CalendarCheck className="mr-2 h-6 w-6 text-accent" /> Upcoming Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              {studentData.upcomingExams.length > 0 ? (
                <ul className="space-y-4">
                  {studentData.upcomingExams.map(exam => (
                    <li key={exam.id} className="p-3 rounded-md border bg-secondary/10">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-primary">{exam.subject}</h4>
                        <Badge variant={exam.type === 'Exam' ? 'destructive' : 'secondary'}>{exam.type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Date: {exam.date}</p>
                      <p className="text-xs text-foreground/80 mt-1">{exam.details}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm">No upcoming tests or exams scheduled.</p>
              )}
            </CardContent>
          </Card>

          {/* Column 2: Grades */}
          <Card className="lg:col-span-1 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl flex items-center"><ClipboardList className="mr-2 h-6 w-6 text-accent" /> Your Grades</CardTitle>
              <CardDescription>Latest term grades.</CardDescription>
            </CardHeader>
            <CardContent>
               {studentData.grades.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2 font-medium text-primary">Subject</th>
                        <th className="text-center py-2 px-2 font-medium text-primary">Score</th>
                        <th className="text-left py-2 px-2 font-medium text-primary">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentData.grades.map((grade, index) => (
                        <tr key={index} className="border-b last:border-b-0 hover:bg-secondary/5">
                          <td className="py-2 px-2">{grade.subject}</td>
                          <td className="py-2 px-2 text-center font-semibold text-primary">{grade.score}</td>
                          <td className="py-2 px-2 text-xs text-foreground/70">{grade.remarks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                 <p className="text-muted-foreground text-sm">Grades for this term are not yet available.</p>
              )}
            </CardContent>
            <CardFooter>
                <Button variant="link" className="text-accent p-0 text-sm">View Full Grade History (Coming Soon)</Button>
            </CardFooter>
          </Card>
          
          {/* Column 3: Performance Overview & Resources */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl flex items-center"><BarChartHorizontal className="mr-2 h-6 w-6 text-accent" /> Performance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/80 leading-relaxed">{studentData.performanceOverview}</p>
              </CardContent>
            </Card>
             <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl flex items-center"><BookCopy className="mr-2 h-6 w-6 text-accent" /> Quick Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                 <Button variant="outline" size="sm" className="w-full justify-start">View Timetable</Button>
                 <Button variant="outline" size="sm" className="w-full justify-start">Library Access</Button>
                 <Button variant="outline" size="sm" className="w-full justify-start">School Announcements</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
