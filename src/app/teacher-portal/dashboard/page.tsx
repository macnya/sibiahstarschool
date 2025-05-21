
'use client';

import { PageHeader } from '@/components/shared/page-header';
import { useAuth } from '@/contexts/auth-provider';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, UserCheck, LogOut, Edit3, Users, ListChecks, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";

// Mock data - replace with actual data fetching and logic
const mockTeacherData = {
  name: "Mr. Harrison (Teacher)",
  classes: [
    { id: "classA", name: "Grade 5 - Mathematics", subject: "Mathematics" },
    { id: "classB", name: "Grade 5 - Science", subject: "Science" },
    { id: "classC", name: "Grade 6 - Mathematics", subject: "Mathematics" },
  ],
  studentsByClass: {
    classA: [
      { id: "student1", name: "John Doe", currentGrade: "A" },
      { id: "student3", name: "Bob Williams", currentGrade: "B" }
    ],
    classB: [
      { id: "student1", name: "John Doe", currentGrade: "B+" },
      { id: "student5", name: "Sarah Miller", currentGrade: "A-" }
    ],
    classC: [
      { id: "student6", name: "Emily White", currentGrade: "A" },
      { id: "student7", name: "David Green", currentGrade: "C+" }
    ],
  }
};

export default function TeacherDashboardPage() {
  const { user, logout, loading: authLoading, initialLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [grade, setGrade] = useState('');
  const [subjectForGrade, setSubjectForGrade] = useState(''); // To store subject of selected class

  useEffect(() => {
    if (!initialLoading && !user) {
      router.push('/teacher-portal');
    }
  }, [user, initialLoading, router]);

  if (initialLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const teacherData = mockTeacherData; // Use mock data
  const studentsInSelectedClass = selectedClass ? teacherData.studentsByClass[selectedClass as keyof typeof teacherData.studentsByClass] || [] : [];
  const studentDetails = selectedStudent ? studentsInSelectedClass.find(s => s.id === selectedStudent) : null;
  
  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
    setSelectedStudent(null); // Reset student when class changes
    setGrade('');
    const classInfo = teacherData.classes.find(c => c.id === classId);
    setSubjectForGrade(classInfo?.subject || '');
  };
  
  const handleStudentChange = (studentId: string) => {
    setSelectedStudent(studentId);
    const student = studentsInSelectedClass.find(s => s.id === studentId);
    setGrade(student?.currentGrade || ''); // Pre-fill grade if available
  };

  const handleUpdateGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !selectedStudent || !grade || !subjectForGrade) {
      toast({ title: "Missing Information", description: "Please select a class, student, and enter a grade.", variant: "destructive" });
      return;
    }
    // Placeholder: In a real app, this would call a backend API to update the grade.
    console.log(`Updating grade for ${studentDetails?.name} in ${subjectForGrade}: ${grade}`);
    toast({ title: "Grade Updated (Simulated)", description: `${studentDetails?.name}'s grade for ${subjectForGrade} set to ${grade}.` });
    // Optionally, update mock data here to reflect change in UI if not refetching
  };

  return (
    <div>
      <PageHeader
        title="Teacher Dashboard"
        subtitle={`Welcome, ${user.displayName || user.email}! Manage your classes and student grades.`}
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-semibold text-primary">{teacherData.name}</h2>
          <Button onClick={logout} disabled={authLoading} variant="outline">
            {authLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
            Logout
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Manage Grades Section */}
          <Card className="lg:col-span-2 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl flex items-center"><Edit3 className="mr-2 h-6 w-6 text-accent" /> Update Student Grades</CardTitle>
              <CardDescription>Select a class and student to update their grade for the class subject.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateGrade} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="select-class">Select Class</Label>
                    <Select onValueChange={handleClassChange} value={selectedClass || undefined}>
                      <SelectTrigger id="select-class">
                        <SelectValue placeholder="Choose a class..." />
                      </SelectTrigger>
                      <SelectContent>
                        {teacherData.classes.map(cls => (
                          <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="select-student">Select Student</Label>
                    <Select onValueChange={handleStudentChange} value={selectedStudent || undefined} disabled={!selectedClass}>
                      <SelectTrigger id="select-student">
                        <SelectValue placeholder="Choose a student..." />
                      </SelectTrigger>
                      <SelectContent>
                        {studentsInSelectedClass.length > 0 ? studentsInSelectedClass.map(student => (
                          <SelectItem key={student.id} value={student.id}>{student.name}</SelectItem>
                        )) : <div className="p-2 text-sm text-muted-foreground">No students in selected class.</div>}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {selectedClass && (
                     <p className="text-sm text-muted-foreground">Subject for this class: <strong>{subjectForGrade || "N/A"}</strong></p>
                )}

                {selectedStudent && studentDetails && (
                  <div className="space-y-2 pt-4 border-t">
                     <Label htmlFor="grade-input">Grade for {studentDetails.name} ({subjectForGrade})</Label>
                    <Input 
                      id="grade-input" 
                      placeholder="Enter grade (e.g., A, B+, 85%)" 
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                    />
                  </div>
                )}
                <Button type="submit" disabled={!selectedStudent || !grade || authLoading} className="w-full sm:w-auto">
                  {authLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Update Grade
                </Button>
                 {(!selectedClass || studentsInSelectedClass.length === 0 && selectedClass) && (
                    <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-md">
                        <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-yellow-700 mr-2" />
                        <p className="text-sm text-yellow-700">
                            {selectedClass ? "No students found in this class." : "Please select a class to view students."}
                        </p>
                        </div>
                    </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Quick Actions / Info Section */}
          <Card className="lg:col-span-1 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl flex items-center"><ListChecks className="mr-2 h-6 w-6 text-accent" /> Class Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedClass ? (
                <div>
                  <h3 className="font-semibold text-primary mb-2">{teacherData.classes.find(c=>c.id === selectedClass)?.name}</h3>
                  <p className="text-sm text-muted-foreground mb-1">Subject: {subjectForGrade}</p>
                  <p className="text-sm text-muted-foreground mb-3">Number of Students: {studentsInSelectedClass.length}</p>
                  <Button variant="outline" size="sm" className="w-full justify-start mb-2"><Users className="mr-2 h-4 w-4"/> View Class Roster</Button>
                  <Button variant="outline" size="sm" className="w-full justify-start"><UserCheck className="mr-2 h-4 w-4"/> Manage Attendance (Coming Soon)</Button>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Select a class to see an overview.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
