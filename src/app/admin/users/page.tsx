"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Assume you have a function to check admin status
import { checkAdminStatus } from '@/lib/admin'; // You'll need to create this file

interface User {
  id: string;
  email: string;
  displayName: string | null;
  // Add other user properties you want to display
}

export default function AdminUsersPage() {
  const deleteUserFunction = httpsCallable(getFunctions(), 'deleteUser');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const verifyAdmin = async () => {
      const admin = await checkAdminStatus();
      setIsAdmin(admin);
      if (!admin) {
        router.push('/'); // Redirect to home if not admin
      } else {
        await fetchUsers(); // Fetch users if admin
        setLoading(false);
      }
    };
    verifyAdmin();
  }, [router]);

  const fetchUsers = async () => {
    console.log('Fetching users...');
    const fetchedUsers: User[] = [
      { id: 'user1', email: 'user1@example.com', displayName: 'User One' },
      { id: 'user2', email: 'user2@example.com', displayName: 'User Two' },
    ];
    setUsers(fetchedUsers);
    setLoading(false);
  };

  const handleEdit = (userId: string) => {
    // Placeholder for edit action
    console.log(`Edit user with ID: ${userId}`);
    // Navigate to an edit user page or open a modal
  };

  const handleDelete = async (userId: string) => {
    console.log(`Delete user with ID: ${userId}`);
    try {
      await deleteUserFunction({ uid: userId });
      // Filter out the deleted user from the current state
      setUsers(users.filter(user => user.id !== userId));
      console.log(`User ${userId} deleted successfully.`);
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  if (loading || !isAdmin) {
    return <div>Loading or not authorized...</div>;
  }

 return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Manage Users</h1>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b border-gray-200 text-left text-sm font-semibold text-gray-600">ID</th>
              <th className="py-2 px-4 border-b border-gray-200 text-left text-sm font-semibold text-gray-600">Email</th>
              <th className="py-2 px-4 border-b border-gray-200 text-left text-sm font-semibold text-gray-600">Display Name</th>
              <th className="py-2 px-4 border-b border-gray-200 text-left text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="py-2 px-4 border-b border-gray-200 text-sm text-gray-700">{user.id}</td>
                <td className="py-2 px-4 border-b border-gray-200 text-sm text-gray-700">{user.email}</td>
                <td className="py-2 px-4 border-b border-gray-200 text-sm text-gray-700">{user.displayName}</td>
                <td className="py-2 px-4 border-b border-gray-200 text-sm text-gray-700">
                  <button
                    onClick={() => handleEdit(user.id)}
                    className="mr-2 text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}