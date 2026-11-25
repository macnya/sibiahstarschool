import { redirect } from 'next/navigation';

/** Teacher logins are created by the school office, so there is no public registration. */
export default function TeacherRegisterPage() {
  redirect('/teacher-portal');
}
