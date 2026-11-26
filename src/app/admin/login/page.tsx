import { redirect } from 'next/navigation';

/** Old address kept for bookmarks. All staff now sign in at /staff-login. */
export default function OldAdminLogin() {
  redirect('/staff-login');
}
