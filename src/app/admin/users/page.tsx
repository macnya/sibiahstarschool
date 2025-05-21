
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Button } from '@/components/ui/button'; 
import { PageHeader } from '@/components/shared/page-header'; 
import { Loader2, Edit, Trash2 } from 'lucide-react'; 

// Assume you have a function to check admin status
// import { checkAdminStatus } from '@/lib/admin'; // This file/function does not exist

interface User {
  uid: string; 
  email: string | null;
  displayName: string | null;
  // Add other user properties you want to display
}

export default function AdminUsersPage() {
  const functions = getFunctions(); 
  // const deleteUserFunction = httpsCallable(functions, 'deleteUser'); // Ensure 'deleteUser' matches your callable function name
  // const listUsersFunction = httpsCallable(functions, 'listUsers'); // Assuming 'listUsers' is the name of your callable function

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  // const [isAdmin, setIsAdmin] = useState(false); // Temporarily assume admin or handle differently
  const router = useRouter();

  useEffect(() => {
    const verifyAndFetch = async () => {
      // const admin = await checkAdminStatus(); // This function doesn't exist
      // setIsAdmin(admin);
      // if (!admin) {
      //   router.push('/'); // Redirect to home if not admin
      // } else {
      //   await fetchUsers(); // Fetch users if admin
      // }
      // For now, let's assume the user is an admin to see the page structure.
      // Actual admin role checking needs to be implemented.
      console.warn("Admin role check not implemented. Assuming admin for now.");
      await fetchUsers();
    };
    verifyAndFetch();
  }, [router]); 

  const fetchUsers = async () => {
    setLoading(true);
    console.log('Fetching users (placeholder)...');
    // TODO: Replace with actual call to a listUsers Cloud Function
    // try {
    //   const result = await listUsersFunction();
    //   // Assuming result.data is an array of Firebase UserRecord-like objects
    //   const fetchedUsers = (result.data as any[]).map(u => ({
    //     uid: u.uid,
    //     email: u.email,
    //     displayName: u.displayName,
    //   }));
    //   setUsers(fetchedUsers);
    // } catch (error) {
    //   console.error("Error fetching users:", error);
    //   setUsers([]); // Set to empty array on error
    // }
    const placeholderUsers: User[] = [
      { uid: 'user1-placeholder', email: 'user1@example.com', displayName: 'User One (Placeholder)' },
      { uid: 'user2-placeholder', email: 'user2@example.com', displayName: 'User Two (Placeholder)' },
    ];
    setUsers(placeholderUsers);
    setLoading(false); // Corrected: removed extra "set"
  };

  const handleEdit = (userId: string) => {
    console.log(`Edit user with ID: ${userId}`);
    router.push(`/admin/users/edit/${userId}`);
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm(`Are you sure you want to delete user ${userId}? This action cannot be undone.`)) {
      return;
    }
    console.log(`Attempting to delete user with ID: ${userId}`);
    try {
      // Make sure 'deleteUser' is the correct name of your callable function in functions/src/index.ts
      // await deleteUserFunction({ uid: userId }); 
      alert(`User ${userId} delete functionality is a placeholder.`);
      // setUsers(prevUsers => prevUsers.filter(user => user.uid !== userId));
      console.log(`User ${userId} delete request sent (placeholder).`);
    } catch (error) {
      console.error("Error deleting user (placeholder):", error);
      alert(`Error deleting user (placeholder): ${(error as Error).message}`); 
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4">Loading users or checking authorization...</p>
      </div>
    );
  }

 return (
    <div>
      <PageHeader title="Manage Users" subtitle="View, edit, or delete user accounts." />
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-4 text-right">
          <Button onClick={fetchUsers} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Refresh Users (Placeholder)
          </Button>
        </div>
        <div className="overflow-x-auto bg-card shadow-lg rounded-lg">
          <table className="min-w-full ">
            <thead className="bg-secondary/30">
              <tr>
                <th className="py-3 px-6 text-left text-xs font-medium text-primary uppercase tracking-wider">User ID</th>
                <th className="py-3 px-6 text-left text-xs font-medium text-primary uppercase tracking-wider">Email</th>
                <th className="py-3 px-6 text-left text-xs font-medium text-primary uppercase tracking-wider">Display Name</th>
                <th className="py-3 px-6 text-left text-xs font-medium text-primary uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.length > 0 ? users.map((user) => (
                <tr key={user.uid} className="hover:bg-secondary/10">
                  <td className="py-4 px-6 text-sm text-foreground whitespace-nowrap">{user.uid}</td>
                  <td className="py-4 px-6 text-sm text-foreground whitespace-nowrap">{user.email || 'N/A'}</td>
                  <td className="py-4 px-6 text-sm text-foreground whitespace-nowrap">{user.displayName || 'N/A'}</td>
                  <td className="py-4 px-6 text-sm text-foreground whitespace-nowrap space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(user.uid)}>
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(user.uid)}>
                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </Button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="py-4 px-6 text-center text-muted-foreground">No users found or data is placeholder.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Note: User management functionality is under development. Data displayed might be placeholder.
          Actual user listing and admin role verification require backend implementation.
        </p>
      </div>
    </div>
  );
}
